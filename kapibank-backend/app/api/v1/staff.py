import uuid
from decimal import Decimal
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlmodel import Session
from app.core.db import get_session
from app.core.errors import AppException
from app.models.user import UserModel
from app.models.product import ProductModel
from app.schemas.application import ApplicationResponse
from app.schemas.staff import BankDecisionRequest, ClientOfferActionRequest, SignAndIssueRequest, InfoRequest, InfoReply
from app.services.auth import get_current_user, require_bank_staff
from app.services.company import resolve_or_bind_company_profile
from app.services.scoring import evaluate_precheck
from app.services.applications import ACTIVE_STATUSES, check_version, contract_version, event, get_application, make_offer, persist, response
router = APIRouter(prefix='/applications', tags=['Application actions'])

def active(app):
    if app.status not in ACTIVE_STATUSES: raise AppException(409,'INVALID_STATUS','Заявка не ожидает действий сотрудника')

@router.post('/{appId}/info-requests', response_model=ApplicationResponse, operation_id='requestApplicationInformation')
def request_info(appId: str, payload: InfoRequest, user: UserModel = Depends(require_bank_staff), session: Session = Depends(get_session)):
    app=get_application(session,appId,user,True); check_version(app,payload.expectedVersion); active(app)
    message=payload.message.strip()
    if not message: raise AppException(422,'VALIDATION_ERROR','Укажите, какие сведения нужны')
    app.info_requests=[*app.info_requests, {'id':f'info-{uuid.uuid4().hex[:12]}','message':message,'status':'open','answer':None,'createdAt':datetime.now(timezone.utc).isoformat()}]
    app.status='info_requested'; event(app,'bank_staff','REQUEST_INFORMATION',message)
    return persist(session,app)

@router.post('/{appId}/info-requests/{requestId}/reply', response_model=ApplicationResponse, operation_id='replyApplicationInformation')
def reply_info(appId: str, requestId: str, payload: InfoReply, user: UserModel = Depends(get_current_user), session: Session = Depends(get_session)):
    app=get_application(session,appId,user,True)
    if user.role != 'client' or app.user_id != user.id: raise AppException(403,'FORBIDDEN','Ответить может только владелец заявки')
    check_version(app,payload.expectedVersion)
    if app.status != 'info_requested': raise AppException(409,'INVALID_STATUS','Заявка не ожидает уточнений')
    entries=[dict(x) for x in app.info_requests]; entry=next((x for x in entries if x['id']==requestId),None)
    if not entry: raise AppException(404,'NOT_FOUND','Запрос не найден')
    if entry['status'] != 'open': raise AppException(409,'ALREADY_ANSWERED','Ответ уже отправлен')
    if not payload.message.strip(): raise AppException(422,'VALIDATION_ERROR','Ответ не должен быть пустым')
    entry.update(status='answered',answer=payload.message.strip(),answeredAt=datetime.now(timezone.utc).isoformat())
    app.info_requests=entries; app.status='info_requested' if any(x['status']=='open' for x in entries) else 'employee_review'
    event(app,'client','REPLY_INFORMATION',payload.message.strip())
    return persist(session,app)

@router.post('/{appId}/bank-decision', response_model=ApplicationResponse, operation_id='submitBankDecision')
def decision(appId: str, payload: BankDecisionRequest, user: UserModel = Depends(require_bank_staff), session: Session = Depends(get_session)):
    app=get_application(session,appId,user,True); check_version(app,payload.expectedVersion); active(app)
    if any(x['status']=='open' for x in app.info_requests): raise AppException(409,'OPEN_INFO_REQUEST','Сначала дождитесь ответов на запросы')
    if payload.action=='reject':
        app.status='bank_rejected'; app.alternative_offer=None
        event(app,'bank_staff','BANK_REJECT',(payload.rejectionReason or payload.comment).strip())
    else:
        product=session.get(ProductModel,app.product_id)
        if not product: raise AppException(404,'NOT_FOUND','Продукт не найден')
        principal=Decimal(payload.alternativePrincipal) if payload.action=='propose_alternative' else app.principal
        term=payload.alternativeTermMonths if payload.action=='propose_alternative' else app.term_months
        rate=Decimal(payload.annualRate) if payload.annualRate is not None else (app.annual_rate if app.annual_rate is not None else product.annual_rate)
        _,company=resolve_or_bind_company_profile(session,app.inn)
        # Recheck product restrictions and affordability at the proposed rate.
        product_data=product.model_copy(update={'annual_rate':rate})
        evaluation=evaluate_precheck(company,product_data,principal,term,app.purpose)
        if not evaluation.can_submit_standard: raise AppException(422,'OFFER_BLOCKED',evaluation.block_reason or 'Предлагаемые условия не укладываются в доступную нагрузку')
        app.offer_version+=1
        app.alternative_offer=make_offer(app,principal,term,rate,payload.comment.strip())
        app.status='waiting_acceptance'
        event(app,'bank_staff','PROPOSE_ALTERNATIVE' if payload.action=='propose_alternative' else 'BANK_APPROVE',payload.comment.strip())
    return persist(session,app)

@router.post('/{appId}/client-offer-action', response_model=ApplicationResponse, operation_id='handleClientOfferAction')
def offer_action(appId: str, payload: ClientOfferActionRequest, user: UserModel = Depends(get_current_user), session: Session = Depends(get_session)):
    app=get_application(session,appId,user,True)
    if user.role!='client' or app.user_id!=user.id: raise AppException(403,'FORBIDDEN','Действие доступно владельцу заявки')
    check_version(app,payload.expectedVersion)
    if app.status!='waiting_acceptance' or payload.offerVersion!=app.offer_version: raise AppException(409,'STALE_OFFER','Предложение изменилось или больше не ожидает ответа')
    offer=response(app,session).offer
    if payload.action=='accept':
        app.principal=Decimal(offer['principal']); app.term_months=offer['termMonths']; app.annual_rate=Decimal(offer['annualRate']); app.monthly_payment=Decimal(offer['monthlyPayment']); app.alternative_offer=offer; app.status='waiting_signing'
        event(app,'client','ACCEPT_OFFER',f'Принято предложение версии {app.offer_version}')
    elif payload.action=='request_revision':
        if not payload.revisionComment.strip(): raise AppException(422,'VALIDATION_ERROR','Поясните, какие условия нужно пересмотреть')
        app.status='employee_review'; app.alternative_offer=None
        event(app,'client','REQUEST_REVISION',f'{payload.revisionComment.strip()} Сумма: {payload.revisionPrincipal or "не указана"}; срок: {payload.revisionTermMonths or "не указан"}')
    else:
        app.status='client_rejected'; app.alternative_offer=None; event(app,'client','REJECT_OFFER','Клиент отказался от предложения')
    return persist(session,app)

@router.get('/{appId}/contract', operation_id='getApplicationContract')
def contract(appId: str, user: UserModel=Depends(get_current_user), session: Session=Depends(get_session)):
    app=get_application(session,appId,user)
    if app.status not in ('waiting_acceptance','waiting_signing','issued'): raise AppException(409,'CONTRACT_UNAVAILABLE','Договор будет доступен после подготовки предложения')
    return {'applicationId':app.id,'version':contract_version(app),'documentMode':'synthetic_summary','offer':response(app,session).offer,'company':app.company_snapshot,'canSign':app.status=='waiting_signing' and user.role=='client' and app.user_id==user.id,'signed':app.status=='issued','notice':'Сводка условий для ознакомления. Учебное подписание не создаёт юридических обязательств и не переводит деньги.'}

@router.post('/{appId}/sign-and-issue', response_model=ApplicationResponse, operation_id='signAndIssueLoan')
def sign(appId: str, payload: SignAndIssueRequest, user: UserModel=Depends(get_current_user), session: Session=Depends(get_session)):
    app=get_application(session,appId,user,True)
    if user.role!='client' or app.user_id!=user.id: raise AppException(403,'FORBIDDEN','Действие доступно владельцу заявки')
    response(app,session)  # Normalize the stored offer before checking its version.
    if payload.contractVersion!=contract_version(app) or not payload.confirmed: raise AppException(409,'CONTRACT_VERSION_CONFLICT','Ознакомьтесь с актуальной версией условий и подтвердите действие')
    if payload.settlementAccount != app.company_snapshot.get('settlementAccount'): raise AppException(422,'ACCOUNT_MISMATCH','Счёт не совпадает со счётом компании в заявке')
    if app.status=='issued': return response(app,session)
    check_version(app,payload.expectedVersion)
    if app.status!='waiting_signing': raise AppException(409,'INVALID_STATUS','Сначала примите предложение')
    app.status='issued'; event(app,'client','SIGN_CONTRACT',f'Имитация подписания {payload.contractVersion}'); event(app,'system','LOAN_ISSUED','Имитация выдачи средств. Реальная операция не выполнялась.')
    return persist(session,app)
