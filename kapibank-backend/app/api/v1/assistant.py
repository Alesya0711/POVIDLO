import uuid
from datetime import datetime,timezone,timedelta
from fastapi import APIRouter, Depends, Request, Response
from sqlmodel import Session, select
from app.core.db import get_session
from app.core.config import settings
from app.core.errors import AppException
from app.models.assistant import AssistantConversation,AssistantProposal
from app.schemas.assistant import AssistantMessageRequest,AssistantMessageResponse,ProposalConfirmRequest,ProposalConfirmResponse
from app.services.assistant import process_message,context_hash
from app.services.auth import get_current_user
router=APIRouter(prefix='/assistant',tags=['Assistant'])

def owner(request,response,session):
    token=request.headers.get('authorization','')
    if request.cookies.get('kapibank_session') or token:
        bearer=token.split(' ',1)[1] if token.lower().startswith('bearer ') else None
        return 'user:'+get_current_user(request,bearer,session).id
    guest=request.cookies.get('kapibank_assistant')
    if not guest or not guest.isalnum() or len(guest)!=32:
        guest=uuid.uuid4().hex
        response.set_cookie('kapibank_assistant',guest,httponly=True,secure=settings.ENVIRONMENT=='production',samesite='lax',max_age=86400,path='/')
    return 'guest:'+guest

def expired(created):
    if created.tzinfo is None: created=created.replace(tzinfo=timezone.utc)
    return datetime.now(timezone.utc)-created>timedelta(days=1)

@router.post('/messages',response_model=AssistantMessageResponse,operation_id='sendAssistantMessage')
def send(payload:AssistantMessageRequest,request:Request,response:Response,session:Session=Depends(get_session)):
    who=owner(request,response,session)
    if not payload.message.strip(): raise AppException(422,'VALIDATION_ERROR','Введите сообщение')
    conversation=session.get(AssistantConversation,payload.conversationId) if payload.conversationId else None
    if payload.conversationId and (not conversation or conversation.owner!=who or expired(conversation.created_at)): raise AppException(404,'NOT_FOUND','Беседа не найдена или истекла')
    if conversation is None: conversation=AssistantConversation(id='conv-'+uuid.uuid4().hex,owner=who,messages=[])
    previous=next((m for m in conversation.messages if m.get('clientMessageId')==payload.clientMessageId and m.get('response')),None)
    if previous:
        if previous['content']!=payload.message: raise AppException(409,'MESSAGE_CONFLICT','Идентификатор сообщения уже использован')
        return AssistantMessageResponse(**previous['response'])
    history=[{'role':m['role'],'content':m['content']} for m in conversation.messages[-20:]]
    reply,proposal,mode=process_message(payload.message,payload.context,history)
    result=AssistantMessageResponse(conversationId=conversation.id,reply=reply,proposal=proposal,dataMode=mode)
    if proposal:
        session.add(AssistantProposal(id=proposal.id,owner=who,conversation_id=conversation.id,target_field=proposal.targetField,value={'value':proposal.proposedValue},context_hash=context_hash(payload.context),revision=proposal.revision))
    conversation.messages=[*conversation.messages,{'role':'user','content':payload.message,'clientMessageId':payload.clientMessageId,'response':result.model_dump(mode='json')},{'role':'assistant','content':reply}][-20:]
    session.add(conversation);session.commit()
    return result

@router.post('/proposals/{proposalId}/confirm',response_model=ProposalConfirmResponse,operation_id='confirmAssistantProposal')
def confirm(proposalId:str,payload:ProposalConfirmRequest,request:Request,response:Response,session:Session=Depends(get_session)):
    who=owner(request,response,session)
    proposal=session.exec(select(AssistantProposal).where(AssistantProposal.id==proposalId).with_for_update()).first()
    if not proposal or proposal.owner!=who or expired(proposal.created_at): raise AppException(404,'NOT_FOUND','Предложение не найдено или истекло')
    if proposal.revision!=payload.revision or proposal.context_hash!=context_hash(payload.context): raise AppException(409,'STALE_PROPOSAL','Поля изменились. Получите новое предложение помощника.')
    proposal.confirmed=True;session.add(proposal);session.commit()
    return ProposalConfirmResponse(targetField=proposal.target_field,confirmedValue=proposal.value['value'],revision=proposal.revision)
