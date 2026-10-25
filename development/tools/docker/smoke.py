"""Minimal built-image smoke. Run inside a disposable Kapibank container."""
import json
import re
import sys
import time
import uuid
from http.cookiejar import CookieJar
from pathlib import Path
from urllib.request import Request, build_opener, HTTPCookieProcessor

base = 'http://127.0.0.1:8080'
state_path = Path('/tmp/kapibank-image-smoke.json')
jar = CookieJar()
client = build_opener(HTTPCookieProcessor(jar))

def request(path, body=None):
    headers = {'Content-Type': 'application/json'} if body is not None else {}
    req = Request(base + path, data=json.dumps(body).encode() if body is not None else None, headers=headers)
    with client.open(req, timeout=5) as response:
        data = response.read()
        return json.loads(data) if 'application/json' in response.headers.get('Content-Type', '') else data.decode()

for attempt in range(30):
    try:
        assert request('/health')['status'] == 'ok'
        break
    except Exception:
        if attempt == 29:
            raise
        time.sleep(1)

index = request('/')
assert '<div id="root">' in index
assert request('/applications/image-check/contract') == index
assets = re.findall(r'(?:src|href)="(/assets/[^\"]+)"', index)
assert assets and all(request(path) for path in assets)
assert len(request('/api/v1/products')['items']) == 20
assert request('/openapi.json')['info']['version'] == '0.3.0'

if '--persisted' in sys.argv:
    state = json.loads(state_path.read_text())
    request('/api/v1/auth/login', {'email': state['email'], 'password': state['password']})
    application = request('/api/v1/applications/' + state['applicationId'])
    assert application['id'] == state['applicationId']
    assert application['inn'] == '7701000019'
    assert request('/api/v1/auth/me')['boundInn'] == application['inn']
    print('PASS: frontend, assets, SPA routing, database health, catalog, API and application persistence after restart')
else:
    state = {'email': 'image.' + uuid.uuid4().hex[:12] + '@example.com', 'password': 'image-check-123'}
    request('/api/v1/auth/register', {**state, 'fullName': 'Тест контейнера'})
    assert request('/api/v1/auth/me')['email'] == state['email']
    company = request('/api/v1/companies/lookup', {'inn': '7701000019'})
    application = request('/api/v1/applications', {'inn': company['inn'], 'productId': 'demo-working-capital', 'principal': '1000000.00', 'termMonths': 24, 'purpose': 'working_capital'})
    assert application['company']['profileId'] == company['profileId']
    assert application['status'] == 'waiting_acceptance' and application['offer']['monthlyPayment']
    state['applicationId'] = application['id']
    state_path.write_text(json.dumps(state))
    state_path.chmod(0o600)
    print('PASS: frontend, assets, SPA routing, database health, catalog, cookie session, company lookup and application creation')
