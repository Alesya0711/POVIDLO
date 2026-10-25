import math
from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP

from app.models.company import CompanyProfileModel
from app.models.product import ProductModel
from app.services.finance import calculate_annuity, round_money


def clamp_dec(val: Decimal, low: Decimal, high: Decimal) -> Decimal:
    return min(high, max(low, val))


def round_int_half_up(val: Decimal) -> int:
    return int(val.quantize(Decimal("1"), rounding=ROUND_HALF_UP))


@dataclass(frozen=True)
class ScoringBreakdown:
    history_points: Decimal
    trend_points: Decimal
    margin_points: Decimal
    debt_points: Decimal
    score: int | None
    risk_band: str  # auto_approve_eligible | manual_review | reject_risk | unavailable


@dataclass(frozen=True)
class LoadCalculation:
    operating_cash: Decimal
    available_cash: Decimal
    payment_limit: Decimal
    monthly_payment: Decimal
    total_repayment: Decimal
    total_interest: Decimal
    is_affordable: bool


@dataclass(frozen=True)
class PrecheckEvaluation:
    status: str
    # statuses:
    # - blocked_red_flag
    # - blocked_product_mismatch
    # - blocked_risk
    # - unaffordable_request_other_terms
    # - evaluation_unavailable
    # - manual_review_likely
    # - auto_approval_likely
    can_submit_standard: bool
    can_request_other_terms: bool
    approval_probability: int | None
    scoring: ScoringBreakdown
    load: LoadCalculation
    factors: list[str]
    block_reason: str | None


def calculate_company_score(
    revenue: Decimal,
    previous_revenue: Decimal,
    operating_expenses: Decimal,
    existing_monthly_payments: Decimal,
    credit_history_status: str,
    past_days: int,
    current_days: int,
) -> ScoringBreakdown:
    """
    Формула скоринга компании (0..100 баллов) без промежуточных округлений.
    Если источник БКИ недоступен (source_unavailable), расчёт ожидает данных.
    """
    if credit_history_status == "source_unavailable":
        return ScoringBreakdown(
            history_points=Decimal("0"),
            trend_points=Decimal("0"),
            margin_points=Decimal("0"),
            debt_points=Decimal("0"),
            score=None,
            risk_band="unavailable",
        )

    # 1. Платёжная дисциплина (до 40 баллов, при отсутствии кредитов = 25)
    if credit_history_status == "empty":
        history = Decimal("25")
    else:
        worst_delay = Decimal(max(past_days, 2 * current_days))
        ratio = clamp_dec(worst_delay / Decimal("90"), Decimal("0"), Decimal("1"))
        history = Decimal("40") * (Decimal("1") - ratio)

    # 2. Динамика выручки (до 20 баллов)
    if previous_revenue == Decimal("0") and revenue > Decimal("0"):
        revenue_growth = Decimal("0.30")
    elif previous_revenue == Decimal("0") and revenue == Decimal("0"):
        revenue_growth = Decimal("0")
    else:
        revenue_growth = (revenue - previous_revenue) / previous_revenue

    trend = Decimal("20") * clamp_dec(
        (revenue_growth + Decimal("0.30")) / Decimal("0.60"),
        Decimal("0"),
        Decimal("1"),
    )

    # 3. Операционная рентабельность (до 20 баллов)
    operating_cash = revenue - operating_expenses
    if revenue <= Decimal("0") or operating_cash <= Decimal("0"):
        margin = Decimal("0")
    else:
        margin = Decimal("20") * clamp_dec(
            operating_cash / (Decimal("0.25") * revenue),
            Decimal("0"),
            Decimal("1"),
        )

    # 4. Нагрузка по действующим кредитам (до 20 баллов)
    if operating_cash <= Decimal("0"):
        debt = Decimal("0")
    else:
        debt = Decimal("20") * clamp_dec(
            Decimal("1") - (existing_monthly_payments / operating_cash),
            Decimal("0"),
            Decimal("1"),
        )

    total_score = round_int_half_up(history + trend + margin + debt)
    if total_score < 45:
        band = "reject_risk"
    elif total_score < 75:
        band = "manual_review"
    else:
        band = "auto_approve_eligible"

    return ScoringBreakdown(
        history_points=round_money(history),
        trend_points=round_money(trend),
        margin_points=round_money(margin),
        debt_points=round_money(debt),
        score=total_score,
        risk_band=band,
    )


def calculate_load_and_payment(
    revenue: Decimal,
    operating_expenses: Decimal,
    existing_monthly_payments: Decimal,
    principal: Decimal,
    annual_rate: Decimal,
    term_months: int,
) -> LoadCalculation:
    annuity = calculate_annuity(
        principal=principal,
        annual_rate=annual_rate,
        term_months=term_months,
    )
    operating_cash = round_money(revenue - operating_expenses)
    available_cash = round_money(operating_cash - existing_monthly_payments)
    raw_limit = max(Decimal("0"), Decimal("0.5") * available_cash)
    payment_limit = round_money(raw_limit)

    is_affordable = (
        available_cash > Decimal("0") and annuity.monthly_payment <= payment_limit
    )

    return LoadCalculation(
        operating_cash=operating_cash,
        available_cash=available_cash,
        payment_limit=payment_limit,
        monthly_payment=annuity.monthly_payment,
        total_repayment=annuity.total_repayment,
        total_interest=annuity.total_interest,
    is_affordable=is_affordable,
    )


def check_product_compliance(
    company: CompanyProfileModel,
    product: ProductModel,
    principal: Decimal,
    term_months: int,
    purpose: str | None = None,
) -> list[str]:
    mismatches: list[str] = []
    if company.legal_form not in product.legal_forms:
        mismatches.append("Правовая форма компании не поддерживается выбранным продуктом")
    if company.industry not in product.industries:
        mismatches.append("Отрасль компании не входит в условия выбранного продукта")
    if company.business_age_months < product.minimum_business_age_months:
        mismatches.append(
            f"Срок работы компании ({company.business_age_months} мес.) меньше минимального по продукту ({product.minimum_business_age_months} мес.)"
        )
    if not (product.minimum_principal <= principal <= product.maximum_principal):
        mismatches.append("Запрошенная сумма выходит за допустимые границы продукта")
    if not (product.minimum_term_months <= term_months <= product.maximum_term_months):
        mismatches.append("Запрошенный срок выходит за допустимые границы продукта")
    if purpose and not (product.is_universal or purpose in product.purpose_categories):
        mismatches.append("Цель финансирования не соответствует продукту")
    return mismatches


def evaluate_precheck(
    company: CompanyProfileModel,
    product: ProductModel,
    principal: Decimal,
    term_months: int,
    purpose: str | None = None,
    has_unverified_discrepancy: bool = False,
) -> PrecheckEvaluation:
    scoring = calculate_company_score(
        revenue=company.revenue,
        previous_revenue=company.previous_revenue,
        operating_expenses=company.operating_expenses,
        existing_monthly_payments=company.existing_monthly_payments,
        credit_history_status=company.credit_history_status,
        past_days=company.past_days,
        current_days=company.current_days,
    )
    load = calculate_load_and_payment(
        revenue=company.revenue,
        operating_expenses=company.operating_expenses,
        existing_monthly_payments=company.existing_monthly_payments,
        principal=principal,
        annual_rate=product.annual_rate,
        term_months=term_months,
    )

    # 1. Проверка обязательного исключения («Красный флаг»)
    if company.registry_status != "active":
        reason = "Регистрация компании не действует"
        return PrecheckEvaluation(
            status="blocked_red_flag",
            can_submit_standard=False,
            can_request_other_terms=False,
            approval_probability=0,
            scoring=scoring,
            load=load,
            factors=[reason],
            block_reason=reason,
        )

    if company.has_bank_restriction:
        reason = company.bank_restriction_reason or "Подтверждённое внутреннее ограничение банка («Красный флаг»)"
        return PrecheckEvaluation(
            status="blocked_red_flag",
            can_submit_standard=False,
            can_request_other_terms=False,
            approval_probability=0,
            scoring=scoring,
            load=load,
            factors=[reason],
            block_reason=reason,
        )

    # 2. Проверка соответствия выбранному продукту
    product_mismatches = check_product_compliance(company, product, principal, term_months, purpose)
    if product_mismatches:
        return PrecheckEvaluation(
            status="blocked_product_mismatch",
            can_submit_standard=False,
            can_request_other_terms=False,
            approval_probability=0,
            scoring=scoring,
            load=load,
            factors=product_mismatches,
            block_reason="; ".join(product_mismatches),
        )

    # 3. Если источник кредитной истории временно не ответил — оценка недоступна (не 0%!)
    if scoring.score is None or len(company.monthly_reports) < 6:
        return PrecheckEvaluation(
            status="evaluation_unavailable",
            can_submit_standard=True,
            can_request_other_terms=False,
            approval_probability=None,
            scoring=scoring,
            load=load,
            factors=[
                "Оценка недоступна: ожидается получение полных сведений из источника данных"
            ],
            block_reason=None,
        )

    # 4. Проверка минимального порога скоринга (score < 45)
    if scoring.score < 45:
        reason = f"Скоринговый балл компании ({scoring.score}) ниже минимального порога (45)"
        return PrecheckEvaluation(
            status="blocked_risk",
            can_submit_standard=False,
            can_request_other_terms=False,
            approval_probability=0,
            scoring=scoring,
            load=load,
            factors=[reason],
            block_reason=reason,
        )

    # 5. Риск приемлем (score >= 45), но платёж превышает допустимую нагрузку
    if not load.is_affordable:
        return PrecheckEvaluation(
            status="unaffordable_request_other_terms",
            can_submit_standard=False,
            can_request_other_terms=True,
            approval_probability=0,
            scoring=scoring,
            load=load,
            factors=[
                f"Риск компании приемлем (балл {scoring.score}), но ежемесячный платёж ({load.monthly_payment:.2f} ₽) превышает доступный лимит нагрузки ({load.payment_limit:.2f} ₽)",
                "Доступно действие «Запросить другие условия» для подбора допустимой суммы или срока сотрудником банка",
            ],
            block_reason=None,
        )

    # 6. Расчёт предварительной вероятности одобрения по логистической формуле
    utilization = float(load.monthly_payment / load.payment_limit)
    z = (scoring.score - 60.0) / 12.0 + 1.5 * (1.0 - utilization)
    raw_prob = 100.0 / (1.0 + math.exp(-z))
    prob_rounded = round_int_half_up(Decimal(str(raw_prob)))
    probability = max(1, min(95, prob_rounded))

    factors = [
        f"Скоринговый балл компании: {scoring.score} из 100",
        f"Платёж {load.monthly_payment:.2f} ₽ укладывается в лимит нагрузки {load.payment_limit:.2f} ₽ (использование лимита {int(round(utilization * 100))}%)",
    ]

    if has_unverified_discrepancy or scoring.score < 75:
        if has_unverified_discrepancy:
            factors.append("Указанные пользователем уточнения отличаются от данных имитатора и будут проверены сотрудником банка")
        else:
            factors.append("Пограничный балл (45–74): заявка будет направлена на рассмотрение сотруднику банка")
        status_code = "manual_review_likely"
    else:
        factors.append("Высокий балл (75+) и прохождение проверок: возможно автоматическое одобрение")
        status_code = "auto_approval_likely"

    return PrecheckEvaluation(
        status=status_code,
        can_submit_standard=True,
        can_request_other_terms=False,
        approval_probability=probability,
        scoring=scoring,
        load=load,
        factors=factors,
        block_reason=None,
    )