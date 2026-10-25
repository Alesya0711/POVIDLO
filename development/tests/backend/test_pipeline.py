"""One isolated API smoke test; no external services or real financial operations."""
import os
os.environ['DATABASE_URL']=os.environ.get('TEST_DATABASE_URL','sqlite://')
os.environ['LLM_MODE']='stub'
import unittest
import uuid
import io
import json
from unittest.mock import patch
from urllib.error import HTTPError
from pydantic import SecretStr
from app.core.config import settings
settings.DATABASE_URL=os.environ['DATABASE_URL']
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import SQLModel, create_engine, Session
from app.core import db
engine=create_engine(os.environ['DATABASE_URL'],**({'connect_args':{'check_same_thread':False},'poolclass':StaticPool} if os.environ['DATABASE_URL']=='sqlite://' else {}))
db.engine=engine
from app.main import app
from app.core.db import get_session

def session_override():
    with Session(engine) as session: yield session
app.dependency_overrides[get_session]=session_override

class PipelineSmoke(unittest.TestCase):
    def setUp(self):
        mode = patch.object(settings, 'LLM_MODE', 'stub')
        mode.start()
        self.addCleanup(mode.stop)

    def test_pipeline_and_isolation(self):
        if os.environ['DATABASE_URL']=='sqlite://': SQLModel.metadata.create_all(engine)
        with TestClient(app) as client:
            def ok(res,code=200):
                self.assertEqual(res.status_code,code,res.text)
                return res.json()
            suffix=uuid.uuid4().hex[:10]
            ok(client.post('/api/v1/auth/register',json={'email':f'integration.client.{suffix}@example.com','password':'client123','fullName':'Тестовый клиент'}),201)
            other=TestClient(app)
            ok(other.post('/api/v1/auth/register',json={'email':f'integration.other.{suffix}@example.com','password':'client123','fullName':'Другой клиент'}),201)
            staff=TestClient(app)
            ok(staff.post('/api/v1/auth/login',json={'email':'staff@kapibank.demo','password':'staff123'}))
            self.assertTrue(ok(client.get('/api/v1/products'))['items'])
            ok(client.patch('/api/v1/auth/me',json={'name':'Тестовый клиент','email':f'integration.client.{suffix}@example.com','company':'Тестовая мастерская','legalForm':'ooo','industry':'trade','businessAgeMonths':'24'}))
            inn='7701000019'
            company=ok(client.post('/api/v1/companies/lookup',json={'inn':inn}))
            body={'inn':inn,'productId':'demo-working-capital','principal':'2000000.00','termMonths':12,'purpose':'working_capital','requestOtherTerms':True,'comment':'Прошу подобрать допустимые условия'}
            self.assertEqual(client.post('/api/v1/applications',json={**body,'inn':'1234567890'}).status_code,422)
            self.assertEqual(client.post('/api/v1/applications',json={**body,'requestOtherTerms':False}).status_code,400)
            a=ok(client.post('/api/v1/applications',json=body,headers={'Idempotency-Key':'smoke-create'}),201)
            self.assertEqual(a['company']['profileId'],company['profileId'])
            self.assertEqual(a['id'],ok(client.post('/api/v1/applications',json=body,headers={'Idempotency-Key':'smoke-create'}),201)['id'])
            path='/api/v1/applications/'+a['id']
            self.assertEqual(other.get(path).status_code,403)
            a=ok(staff.post(path+'/info-requests',json={'expectedVersion':a['version'],'message':'Уточните назначение оборудования'}))
            a=ok(client.post(path+'/info-requests/'+a['infoRequests'][0]['id']+'/reply',json={'expectedVersion':a['version'],'message':'Для расширения тестовой мастерской'}))
            a=ok(staff.post(path+'/bank-decision',json={'expectedVersion':a['version'],'action':'propose_alternative','alternativePrincipal':'1200000.00','alternativeTermMonths':24,'annualRate':'0.26','comment':'Тестовые альтернативные условия'}))
            self.assertEqual(a['offer']['principal'],'1200000.00')
            self.assertEqual(a['offer']['monthlyPayment'],'64649.48')
            self.assertEqual(client.post(path+'/client-offer-action',json={'expectedVersion':a['version']-1,'offerVersion':a['offer']['version'],'action':'accept'}).status_code,409)
            a=ok(client.post(path+'/client-offer-action',json={'expectedVersion':a['version'],'offerVersion':a['offer']['version'],'action':'accept'}))
            contract=ok(client.get(path+'/contract'))
            payload={'expectedVersion':a['version'],'contractVersion':contract['version'],'confirmed':True,'settlementAccount':company['settlementAccount']}
            issued=ok(client.post(path+'/sign-and-issue',json=payload))
            self.assertEqual(issued['status'],'issued')
            self.assertEqual(len(issued['history']),len(ok(client.post(path+'/sign-and-issue',json=payload))['history']))
            context={'screen':'questionnaire','field':'principal','data':{'principal':'1000000'}}
            message=ok(client.post('/api/v1/assistant/messages',json={'clientMessageId':'smoke-message','message':'полтора миллиона','context':context}))
            proposal=message['proposal']
            self.assertEqual(proposal['proposedValue'],'1500000.00')
            confirm='/api/v1/assistant/proposals/'+proposal['id']+'/confirm'
            self.assertEqual(other.post(confirm,json={'revision':1,'context':context}).status_code,404)
            self.assertEqual(client.post(confirm,json={'revision':1,'context':{**context,'data':{'principal':'2000000'}}}).status_code,409)
            ok(client.post(confirm,json={'revision':1,'context':context}))
            # A real-provider response must follow the same ownership and confirmation path.
            raw={'choices':[{'finish_reason':'stop','message':{'content':json.dumps({'reply':'Проверьте сумму.', 'proposal':{'targetField':'principal','proposedValue':'1500000.00','explanation':'Полтора миллиона рублей.'}})}}]}
            with patch.multiple(settings,LLM_MODE='groq',GROQ_API_KEY=SecretStr('test-key')), patch('app.services.assistant.urlopen') as provider:
                provider.return_value=io.BytesIO(json.dumps(raw).encode())
                generated=ok(client.post('/api/v1/assistant/messages',json={'clientMessageId':'groq-message','message':'полтора миллиона','context':context}))
                self.assertEqual(generated['dataMode'],'groq')
                groq_confirm='/api/v1/assistant/proposals/'+generated['proposal']['id']+'/confirm'
                self.assertEqual(other.post(groq_confirm,json={'revision':1,'context':context}).status_code,404)
                self.assertEqual(client.post(groq_confirm,json={'revision':1,'context':{**context,'data':{'principal':'2000000'}}}).status_code,409)
                self.assertEqual(ok(client.post(groq_confirm,json={'revision':1,'context':context}))['confirmedValue'],'1500000.00')
                provider.side_effect=HTTPError('https://api.groq.com',429,'private-provider-error',{},None)
                failure=ok(client.post('/api/v1/assistant/messages',json={'conversationId':generated['conversationId'],'clientMessageId':'groq-rate-limit','message':'Ещё вопрос','context':context}),503)
                self.assertEqual(failure['code'],'ASSISTANT_UNAVAILABLE')
                self.assertIn('лимит',failure['message'])
                self.assertNotIn('private-provider-error',failure['message'])
            print('Smoke: INN, other terms, idempotency, information exchange, alternative offer, acceptance, simulated issuance and assistant ownership OK')
