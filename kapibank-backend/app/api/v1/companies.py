from decimal import Decimal
from fastapi import APIRouter, Depends, status
from sqlmodel import Session, select

from app.core.config import settings
from app.core.db import get_session
from app.core.errors import AppException
from app.models.company import CompanyProfileModel, InnProfileBindingModel
from app.models.product import ProductModel
from app.schemas.common import ApiError, format_money
from app.schemas.company import (
    CompanyLookupRequest,
    CompanyProfileResponse,
    DiscrepancyItem,
    PrecheckRequest,
    PrecheckResponse,
    SupportingRecordSchema,
)
from app.services.inn import pick_deterministic_profile_index, validate_inn
from app.services.scoring import evaluate_precheck
from app.services.company import resolve_or_bind_company_profile

router = APIRouter(prefix="/companies", tags=["Companies & Scoring"])


@router.post(
    "/lookup",
    operation_id="lookupCompanyByInn",
    summary="Проверить ИНН и получить сведения о компании",
    response_model=CompanyProfileResponse,
    responses={
        422: {"model": ApiError, "description": "Некорректный формат или контрольная цифра ИНН"},
        503: {"model": ApiError, "description": "Источник временно недоступен"},
    },
)
def lookup_company(
    payload: CompanyLookupRequest,
    session: Session = Depends(get_session),
) -> CompanyProfileResponse:
    clean_inn, profile = resolve_or_bind_company_profile(session, payload.inn)

    session.commit()
    discrepancies: list[DiscrepancyItem] = []
    if payload.questionnaireLegalForm and payload.questionnaireLegalForm != profile.legal_form:
        discrepancies.append(
            DiscrepancyItem(
                field="legalForm",
                questionnaireValue=payload.questionnaireLegalForm,
                simulatorValue=profile.legal_form,
                message="Правовая форма по ИНН отличается от указанной в опросе",
            )
        )
    if payload.questionnaireIndustry and payload.questionnaireIndustry != profile.industry:
        discrepancies.append(
            DiscrepancyItem(
                field="industry",
                questionnaireValue=payload.questionnaireIndustry,
                simulatorValue=profile.industry,
                message="Отрасль компании в реестре отличается от указанной в опросе",
            )
        )
    if (
        payload.questionnaireBusinessAgeMonths is not None
        and payload.questionnaireBusinessAgeMonths != profile.business_age_months
    ):
        discrepancies.append(
            DiscrepancyItem(
                field="businessAgeMonths",
                questionnaireValue=str(payload.questionnaireBusinessAgeMonths),
                simulatorValue=str(profile.business_age_months),
                message="Срок работы компании по дате регистрации отличается от указанного в опросе",
            )
        )

    return CompanyProfileResponse(
        inn=clean_inn,
        profileId=profile.id,
        isSyntheticDemo=True,
        name=profile.name,
        legalForm=profile.legal_form,  # type: ignore[arg-type]
        industry=profile.industry,  # type: ignore[arg-type]
        registrationDate=profile.registration_date,
        businessAgeMonths=profile.business_age_months,
        registryStatus=profile.registry_status,
        revenue=format_money(profile.revenue),
        previousRevenue=format_money(profile.previous_revenue),
        operatingExpenses=format_money(profile.operating_expenses),
        existingMonthlyPayments=format_money(profile.existing_monthly_payments),
        creditHistoryStatus=profile.credit_history_status,
        pastDays=profile.past_days,
        currentDays=profile.current_days,
        hasBankRestriction=profile.has_bank_restriction,
        bankRestrictionReason=profile.bank_restriction_reason,
        settlementAccount=profile.settlement_account,
        supportingRecords=[SupportingRecordSchema(**rec) for rec in profile.supporting_records],
        discrepancies=discrepancies,
        reportingDate=settings.REPORTING_DATE,
        dataVersion=settings.DATA_VERSION,
    )


@router.post(
    "/precheck",
    operation_id="evaluateApplicationPrecheck",
    summary="Рассчитать предварительную вероятность одобрения, скоринг и доступную нагрузку",
    response_model=PrecheckResponse,
    responses={
        404: {"model": ApiError, "description": "Продукт не найден"},
        422: {"model": ApiError, "description": "Ошибка полей запроса или ИНН"},
    },
)
def precheck_company_loan(
    payload: PrecheckRequest,
    session: Session = Depends(get_session),
) -> PrecheckResponse:
    clean_inn, profile = resolve_or_bind_company_profile(session, payload.inn)

    product = session.get(ProductModel, payload.productId)
    if not product:
        raise AppException(
            status_code=status.HTTP_404_NOT_FOUND,
            code="NOT_FOUND",
            message=f"Продукт '{payload.productId}' не найден",
        )

    has_discrepancy = False
    if payload.userRevenueOverride is not None and Decimal(payload.userRevenueOverride) != profile.revenue:
        has_discrepancy = True
    if (
        payload.userOperatingExpensesOverride is not None
        and Decimal(payload.userOperatingExpensesOverride) != profile.operating_expenses
    ):
        has_discrepancy = True

    eval_res = evaluate_precheck(
        company=profile,
        product=product,
        principal=Decimal(payload.principal),
        term_months=payload.termMonths,
        purpose=payload.purpose,
        has_unverified_discrepancy=has_discrepancy,
    )

    session.commit()
    return PrecheckResponse(
        inn=clean_inn,
        productId=product.id,
        status=eval_res.status,
        canSubmitStandard=eval_res.can_submit_standard,
        canRequestOtherTerms=eval_res.can_request_other_terms,
        approvalProbability=eval_res.approval_probability,
        score=eval_res.scoring.score,
        riskBand=eval_res.scoring.risk_band,
        monthlyPayment=format_money(eval_res.load.monthly_payment),
        totalRepayment=format_money(eval_res.load.total_repayment),
        totalInterest=format_money(eval_res.load.total_interest),
        operatingCash=format_money(eval_res.load.operating_cash),
        availableCash=format_money(eval_res.load.available_cash),
        paymentLimit=format_money(eval_res.load.payment_limit),
        isAffordable=eval_res.load.is_affordable,
        factors=eval_res.factors,
        blockReason=eval_res.block_reason,
        hasDiscrepancyWithSimulator=has_discrepancy,
        rulesVersion=settings.RULES_VERSION,
        dataVersion=settings.DATA_VERSION,
    )