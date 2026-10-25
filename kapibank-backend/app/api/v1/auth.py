import uuid
from fastapi import APIRouter, Depends, Response
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select
from app.core.db import get_session
from app.core.errors import AppException
from app.core.config import settings
from app.models.user import UserModel
from app.schemas.auth import LoginRequest, RegisterRequest, ProfileUpdateRequest, TokenResponse, UserProfileResponse
from app.services.auth import create_access_token, get_current_user, verify_password, get_password_hash
router = APIRouter(prefix='/auth', tags=['Authentication'])

def profile_response(user):
    return UserProfileResponse(id=user.id, email=user.email, fullName=user.full_name, role=user.role, boundInn=user.bound_inn, profile=user.profile or {})

def token_response(user, response):
    token = create_access_token({'sub': user.id, 'role': user.role})
    response.set_cookie('kapibank_session', token, httponly=True, secure=settings.ENVIRONMENT == 'production', samesite='lax', max_age=8*3600, path='/')
    return TokenResponse(accessToken=token, role=user.role, fullName=user.full_name, email=user.email, boundInn=user.bound_inn)

@router.post('/login', response_model=TokenResponse, operation_id='loginUser')
def login(payload: LoginRequest, response: Response, session: Session = Depends(get_session)):
    user = session.exec(select(UserModel).where(UserModel.email == str(payload.email).lower())).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise AppException(401, 'UNAUTHORIZED', 'Неверный логин или пароль')
    return token_response(user, response)

@router.post('/register', response_model=TokenResponse, status_code=201, operation_id='registerClient')
def register(payload: RegisterRequest, response: Response, session: Session = Depends(get_session)):
    user = UserModel(id=f'user-{uuid.uuid4().hex}', email=str(payload.email).lower(), full_name=payload.fullName, role='client', hashed_password=get_password_hash(payload.password), profile={})
    session.add(user)
    try: session.commit()
    except IntegrityError:
        session.rollback()
        raise AppException(409, 'EMAIL_EXISTS', 'Эта почта уже зарегистрирована', [{'field':'email','message':'Используйте другую почту или войдите'}])
    session.refresh(user)
    return token_response(user, response)

@router.post('/logout', operation_id='logoutUser')
def logout(response: Response):
    response.delete_cookie('kapibank_session', path='/')
    return {'status':'signed_out'}

@router.get('/me', response_model=UserProfileResponse, operation_id='getCurrentUserProfile')
def me(user: UserModel = Depends(get_current_user)):
    return profile_response(user)

@router.patch('/me', response_model=UserProfileResponse, operation_id='updateCurrentUserProfile')
def update_me(payload: ProfileUpdateRequest, user: UserModel = Depends(get_current_user), session: Session = Depends(get_session)):
    user.full_name = payload.name.strip()
    user.email = str(payload.email).lower()
    user.profile = {**payload.model_dump(), 'name': user.full_name, 'email': user.email, 'company': payload.company.strip(), 'industryDescription': payload.industryDescription.strip() if payload.industry == 'other' else '', 'businessAgeMonths': str(int(payload.businessAgeMonths))}
    session.add(user)
    try: session.commit()
    except IntegrityError:
        session.rollback()
        raise AppException(409, 'EMAIL_EXISTS', 'Эта почта уже используется')
    session.refresh(user)
    return profile_response(user)
