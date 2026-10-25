import hashlib, json, uuid
from decimal import Decimal
from fastapi import APIRouter, Depends, Header, Query
from sqlmodel import Session, select
from app.core.db import get_session
from app.core.errors import AppException
from app.models.application import ApplicationModel
from app.models.product import ProductModel
from app.models.user import UserModel
from app.schemas.application import ApplicationCreateRequest, ApplicationResponse, ApplicationListResponse
from app.services.auth import get_current_user
from app.services.company import resolve_or_bind_company_profile
from app.services.scoring import evaluate_precheck
from app.services.applications import event, make_offer, response, snapshot, get_application

router = APIRouter(prefix='/applications', tags=['Applications'])

@router.post('', response_model=ApplicationResponse, status_code=201, operation_id='createApplication')
def create(payload: ApplicationCreateRequest, user: UserModel = Depends(get_current_user), session: Session = Depends(get_session), idempotency_key: str | None = Header(default=None, max_length=100)):
    if user.role != 'client': raise AppException(403, 'FORBIDDEN', 'Заявку может создать только клиент')
    user = session.exec(select(UserModel).where(UserModel.id == user.id).with_for_update().execution_options(populate_existing=True)).one()
    digest = hashlib.sha256(json.dumps(payload.model_dump(mode='json'), sort_keys=True).encode()).hexdigest()
    if idempotency_key:
        existing = session.exec(select(ApplicationModel).where(ApplicationModel.user_id == user.id, ApplicationModel.submission_key == idempotency_key)).first()
        if existing:
            if existing.submission_hash != digest: raise AppException(409,'IDEMPOTENCY_CONFLICT','Ключ уже использован с другими параметрами')
            return response(existing, session)
    inn, company = resolve_or_bind_company_profile(session, payload.inn)
    if user.bound_inn and user.bound_inn != inn: raise AppException(400,'INN_BINDING_CONFLICT','За аккаунтом закреплён другой ИНН',[{'field':'inn','message':'ИНН не совпадает с компанией аккаунта'}])
    product = session.get(ProductModel, payload.productId)
    if not product: raise AppException(404,'PRODUCT_NOT_FOUND','Продукт не найден')
    evaluation = evaluate_precheck(company, product, Decimal(payload.principal), payload.termMonths, payload.purpose)
    if not evaluation.can_submit_standard and not (payload.requestOtherTerms and evaluation.can_request_other_terms):
        raise AppException(400,'APPLICATION_BLOCKED',evaluation.block_reason or 'Для этой заявки нужно запросить другие условия')
    initial_status = 'waiting_acceptance' if evaluation.status == 'auto_approval_likely' and not payload.requestOtherTerms else 'employee_review'
    app = ApplicationModel(id=f'app-{uuid.uuid4().hex[:12]}', user_id=user.id, inn=inn, product_id=product.id, principal=Decimal(payload.principal), requested_principal=Decimal(payload.principal), term_months=payload.termMonths, requested_term_months=payload.termMonths, annual_rate=product.annual_rate, purpose=payload.purpose, status=initial_status, score=evaluation.scoring.score, approval_probability=evaluation.approval_probability, monthly_payment=evaluation.load.monthly_payment, company_snapshot=snapshot(company,inn), info_requests=[], history=[], submission_key=idempotency_key, submission_hash=digest, comment=payload.comment.strip(), contact_email=str(payload.contactEmail) if payload.contactEmail else user.email)
    event(app,'client','CREATE_APPLICATION','Заявка создана. '+('Запрошены другие условия. '+payload.comment.strip() if payload.requestOtherTerms else ''))
    event(app,'system','AUTOMATIC_CHECK',f'Предварительная проверка: {evaluation.status}; балл: {evaluation.scoring.score}')
    if initial_status == 'waiting_acceptance': app.alternative_offer = make_offer(app, app.principal, app.term_months, product.annual_rate, 'Предложение на запрошенных условиях')
    user.bound_inn = inn
    session.add(user); session.add(app); session.commit(); session.refresh(app)
    return response(app,session)

@router.get('', response_model=ApplicationListResponse, operation_id='listApplications')
def listing(user: UserModel = Depends(get_current_user), session: Session = Depends(get_session), search: str = Query(default='', max_length=100), status: str | None = None):
    statement = select(ApplicationModel).order_by(ApplicationModel.created_at.desc(),ApplicationModel.id)
    if user.role != 'bank_staff': statement = statement.where(ApplicationModel.user_id == user.id)
    if status: statement = statement.where(ApplicationModel.status == status)
    items = session.exec(statement).all()
    query = search.strip().casefold()
    if query: items = [a for a in items if any(query in str(v).casefold() for v in [a.id,a.inn,(a.company_snapshot or {}).get('name','')])]
    return ApplicationListResponse(items=[response(a,session) for a in items])

@router.get('/{appId}', response_model=ApplicationResponse, operation_id='getApplicationById')
def get_one(appId: str, user: UserModel = Depends(get_current_user), session: Session = Depends(get_session)):
    return response(get_application(session,appId,user),session)
