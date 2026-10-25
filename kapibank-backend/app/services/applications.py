import uuid
from datetime import datetime, timezone
from decimal import Decimal
from sqlmodel import Session, select
from app.core.errors import AppException
from app.models.application import ApplicationModel
from app.models.product import ProductModel
from app.models.user import UserModel
from app.schemas.application import ApplicationResponse
from app.schemas.common import format_money, format_rate
from app.services.finance import calculate_annuity

ACTIVE_STATUSES = ('employee_review', 'info_requested')
def event(app, initiator, action, description):
    app.history = [*app.history, {'timestamp': datetime.now(timezone.utc).isoformat(), 'initiator': initiator, 'action': action, 'description': description}]

def snapshot(company, inn):
    names={'registryStatus':'registry_status','creditHistoryStatus':'credit_history_status','pastDays':'past_days','currentDays':'current_days','hasBankRestriction':'has_bank_restriction','bankRestrictionReason':'bank_restriction_reason','settlementAccount':'settlement_account'}
    data={key:getattr(company,attr) for key,attr in names.items()}
    data.update(name=company.name,industry=company.industry,inn=inn,profileId=company.id,legalForm=company.legal_form,businessAgeMonths=company.business_age_months,supportingRecords=company.supporting_records,isSyntheticDemo=True)
    for key,attr in {'revenue':'revenue','previousRevenue':'previous_revenue','operatingExpenses':'operating_expenses','existingMonthlyPayments':'existing_monthly_payments'}.items(): data[key]=format_money(getattr(company,attr))
    return data

def get_application(session, app_id, user, lock=False):
    statement = select(ApplicationModel).where(ApplicationModel.id == app_id)
    if lock: statement = statement.with_for_update()
    app = session.exec(statement).first()
    if not app: raise AppException(404, 'NOT_FOUND', 'Заявка не найдена')
    if user.role != 'bank_staff' and app.user_id != user.id: raise AppException(403, 'FORBIDDEN', 'Нет доступа к этой заявке')
    return app

def check_version(app, expected):
    if app.version != expected: raise AppException(409, 'STALE_VERSION', 'Заявка изменилась. Обновите её перед отправкой.')

def persist(session, app):
    app.updated_at = datetime.now(timezone.utc)
    app.version += 1
    session.add(app); session.commit(); session.refresh(app)
    return response(app, session)

def make_offer(app, principal, term, annual_rate, comment=''):
    result = calculate_annuity(principal, annual_rate, term)
    if result.monthly_payment <= 0 or result.total_interest < 0: raise AppException(422, 'VALIDATION_ERROR', 'Невозможно корректно рассчитать платёж для этих параметров')
    return {'id':f'offer-{uuid.uuid4().hex[:12]}', 'version':app.offer_version, 'principal':format_money(principal), 'termMonths':term, 'annualRate':format_rate(annual_rate), 'monthlyPayment':format_money(result.monthly_payment), 'totalRepayment':format_money(result.total_repayment), 'totalInterest':format_money(result.total_interest), 'comment':comment}

def response(app, session):
    product = session.get(ProductModel, app.product_id)
    if not app.company_snapshot:
        from app.services.company import resolve_or_bind_company_profile
        _,company=resolve_or_bind_company_profile(session,app.inn)
        app.company_snapshot=snapshot(company,app.inn)
    offer = app.alternative_offer
    if offer and not all(key in offer for key in ('id','version','annualRate','monthlyPayment','totalRepayment','totalInterest')):
        legacy=offer
        offer=make_offer(app,Decimal(legacy['principal']),int(legacy['termMonths']),Decimal(legacy.get('annualRate',app.annual_rate if app.annual_rate is not None else product.annual_rate)),legacy.get('comment',''))
        offer['id']=f'legacy-offer-{app.id}'
    if not offer and app.status in ('waiting_acceptance','waiting_signing','issued') and product:
        offer = make_offer(app, app.principal, app.term_months, app.annual_rate if app.annual_rate is not None else product.annual_rate)
        offer['id'] = f'legacy-offer-{app.id}'
    return ApplicationResponse(id=app.id, userId=app.user_id, inn=app.inn, productId=app.product_id, productName=product.name if product else app.product_id, principal=format_money(app.principal), termMonths=app.term_months, purpose=app.purpose, annualRate=str(app.annual_rate if app.annual_rate is not None else product.annual_rate), status=app.status, score=app.score, approvalProbability=app.approval_probability, monthlyPayment=format_money(app.monthly_payment) if app.monthly_payment is not None else None, requestedPrincipal=format_money(app.requested_principal if app.requested_principal is not None else app.principal), requestedTermMonths=app.requested_term_months or app.term_months, company=app.company_snapshot or {}, offer=offer, infoRequests=app.info_requests or [], version=app.version, comment=app.comment, contactEmail=app.contact_email, history=app.history, createdAt=app.created_at, updatedAt=app.updated_at)

def contract_version(app): return f'{app.id}:offer-{app.offer_version}'
