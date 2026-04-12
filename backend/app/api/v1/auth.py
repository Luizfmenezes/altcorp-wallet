from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode
import logging

import requests
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from jose import JWTError, jwt

from app.database.session import get_db
from app.database.models import User, UserRole, VerificationType
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.config import settings
from app.schemas.schemas import (
    RegisterRequest, VerifyEmailRequest, ResendCodeRequest,
    ForgotPasswordRequest, ResetPasswordRequest, GoogleLoginRequest, NativeGoogleLogin,
    GoogleRedirectUrlResponse,
    Token
)
from app.services.email_service import (
    create_verification_code, verify_code,
    send_verification_email, send_password_reset_email
)

router = APIRouter()
logger = logging.getLogger(__name__)


def _build_google_state_token() -> str:
    payload = {
        "purpose": "google_oauth_state",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=10),
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def _validate_google_state_token(state: str) -> None:
    try:
        payload = jwt.decode(state, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("purpose") != "google_oauth_state":
            raise JWTError("Token de state inválido")
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="State OAuth inválido ou expirado"
        ) from exc


def _upsert_google_user(db: Session, google_id: str, email: str, name: str, picture: str) -> User:
    user = db.query(User).filter(
        (User.google_id == google_id) | (User.email == email)
    ).first()

    if user:
        if not user.google_id:
            user.google_id = google_id
        if picture:
            user.avatar_url = picture
        db.commit()
        return user

    user_count = db.query(User).count()
    role = UserRole.admin if user_count == 0 else UserRole.user

    base_username = email.split("@")[0].lower()
    username = base_username
    counter = 1
    while db.query(User).filter(User.username == username).first():
        username = f"{base_username}{counter}"
        counter += 1

    user = User(
        username=username,
        email=email,
        name=name,
        google_id=google_id,
        avatar_url=picture,
        role=role,
        is_active=True,
        email_verified=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _build_frontend_redirect(**params: str) -> str:
    query = urlencode(params)
    return f"{settings.FRONTEND_URL.rstrip('/')}/?{query}"


# ======================== LOGIN ========================

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Login com username ou email + senha"""
    identifier = form_data.username.strip().lower()
    
    # Tentar buscar por username ou email
    user = db.query(User).filter(
        (User.username == identifier) | (User.email == identifier)
    ).first()
    
    if not user or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais incorretas",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais incorretas",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Conta desativada"
        )
    
    if not user.email_verified and user.email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email não verificado. Verifique seu email para continuar.",
            headers={"X-Email-Unverified": "true"},
        )
    
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}


# ======================== REGISTER ========================

@router.post("/register", response_model=dict)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    """Criar conta com email, username e senha"""
    # Verificar se username já existe
    existing_user = db.query(User).filter(User.username == data.username.strip().lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este username já está em uso"
        )
    
    # Verificar se email já existe
    existing_email = db.query(User).filter(User.email == data.email.strip().lower()).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este email já está cadastrado"
        )
    
    # Determinar role (primeiro usuário vira admin)
    user_count = db.query(User).count()
    role = UserRole.admin if user_count == 0 else UserRole.user
    is_verified = user_count == 0  # Primeiro usuário não precisa verificar
    
    # Criar o usuário
    user = User(
        username=data.username.strip().lower(),
        email=data.email.strip().lower(),
        name=data.name.strip(),
        hashed_password=get_password_hash(data.password),
        role=role,
        is_active=True,
        email_verified=is_verified,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Se não é o primeiro usuário, enviar código de verificação
    if not is_verified:
        code = create_verification_code(db, user.email, VerificationType.email_verify, user.id)
        email_sent = send_verification_email(user.email, code, user.name)
        if not email_sent:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Não foi possível enviar o email de verificação. Tente novamente em instantes."
            )
        return {
            "message": "Conta criada! Verifique seu email para ativar.",
            "email": user.email,
            "requires_verification": True
        }
    
    return {
        "message": "Conta de administrador criada com sucesso!",
        "email": user.email,
        "requires_verification": False
    }


# ======================== VERIFY EMAIL ========================

@router.post("/verify-email", response_model=Token)
def verify_email(data: VerifyEmailRequest, db: Session = Depends(get_db)):
    """Verificar email com código de 6 dígitos"""
    email = data.email.strip().lower()
    
    if not verify_code(db, email, data.code.strip(), VerificationType.email_verify):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Código inválido ou expirado"
        )
    
    # Ativar email do usuário
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    user.email_verified = True
    db.commit()
    
    # Gerar token de acesso automaticamente após verificação
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}


# ======================== RESEND CODE ========================

@router.post("/resend-code", response_model=dict)
def resend_verification_code(data: ResendCodeRequest, db: Session = Depends(get_db)):
    """Reenviar código de verificação de email"""
    email = data.email.strip().lower()
    
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Não revelar se o email existe ou não
        return {"message": "Se o email estiver cadastrado, um novo código será enviado."}
    
    if user.email_verified:
        return {"message": "Este email já está verificado."}
    
    code = create_verification_code(db, email, VerificationType.email_verify, user.id)
    email_sent = send_verification_email(email, code, user.name)
    if not email_sent:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Não foi possível reenviar o código agora. Tente novamente em instantes."
        )
    
    return {"message": "Novo código enviado para seu email."}


# ======================== FORGOT PASSWORD ========================

@router.post("/forgot-password", response_model=dict)
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Solicitar código de redefinição de senha"""
    email = data.email.strip().lower()
    
    user = db.query(User).filter(User.email == email).first()
    if not user:
        # Não revelar se o email existe
        return {"message": "Se o email estiver cadastrado, um código de redefinição será enviado."}
    
    code = create_verification_code(db, email, VerificationType.password_reset, user.id)
    email_sent = send_password_reset_email(email, code, user.name)
    if not email_sent:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Não foi possível enviar o código de redefinição agora. Tente novamente em instantes."
        )
    
    return {"message": "Código de redefinição enviado para seu email."}


# ======================== RESET PASSWORD ========================

@router.post("/reset-password", response_model=dict)
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Redefinir senha com código recebido por email"""
    email = data.email.strip().lower()
    
    if not verify_code(db, email, data.code.strip(), VerificationType.password_reset):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Código inválido ou expirado"
        )
    
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    user.hashed_password = get_password_hash(data.new_password)
    db.commit()
    
    return {"message": "Senha redefinida com sucesso! Faça login com sua nova senha."}


# ======================== GOOGLE LOGIN ========================

@router.post("/google-login-redirect-url", response_model=GoogleRedirectUrlResponse)
def google_login_redirect_url():
    """Gera URL do OAuth Google no modo redirect (ideal para PWA/WebView)."""
    if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google OAuth não está configurado no servidor"
        )

    state = _build_google_state_token()
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "prompt": "select_account",
    }
    auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
    return {"auth_url": auth_url}


@router.get("/google-callback")
def google_callback(code: str, state: str, db: Session = Depends(get_db)):
    """Callback OAuth Google para login em redirect mode."""
    try:
        _validate_google_state_token(state)

        token_response = requests.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "code": code,
                "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
            timeout=20,
        )
        token_response.raise_for_status()
        token_data = token_response.json()
        id_token_credential = token_data.get("id_token")
        if not id_token_credential:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Google não retornou credencial de login"
            )

        idinfo = id_token.verify_oauth2_token(
            id_token_credential,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID,
            clock_skew_in_seconds=300,
        )

        email = idinfo.get("email", "").lower()
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Não foi possível obter o email da conta Google"
            )

        user = _upsert_google_user(
            db=db,
            google_id=idinfo["sub"],
            email=email,
            name=idinfo.get("name", ""),
            picture=idinfo.get("picture", ""),
        )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Conta desativada"
            )

        access_token = create_access_token(data={"sub": user.username})
        return RedirectResponse(url=_build_frontend_redirect(auth_token=access_token, auth_provider="google"), status_code=302)
    except HTTPException as exc:
        logger.error("Falha no callback OAuth Google: %s", exc.detail)
        return RedirectResponse(
            url=_build_frontend_redirect(auth_error=str(exc.detail), auth_provider="google"),
            status_code=302,
        )
    except Exception as exc:
        logger.error("Erro inesperado no callback OAuth Google: %s", exc)
        return RedirectResponse(
            url=_build_frontend_redirect(auth_error="Falha no login com Google", auth_provider="google"),
            status_code=302,
        )

@router.post("/google-login", response_model=Token)
def google_login(data: GoogleLoginRequest, db: Session = Depends(get_db)):
    """Login/registro via Google OAuth"""
    try:
        # Verificar o token do Google (com tolerância de clock de 5 minutos)
        idinfo = id_token.verify_oauth2_token(
            data.credential,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID,
            clock_skew_in_seconds=300
        )
        
        google_id = idinfo["sub"]
        email = idinfo.get("email", "").lower()
        name = idinfo.get("name", "")
        picture = idinfo.get("picture", "")
        
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Não foi possível obter o email da conta Google"
            )
        
    except ValueError as e:
        logger.error(f"❌ Google OAuth error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token do Google inválido: {str(e)}"
        )
    except Exception as e:
        logger.error(f"❌ Google OAuth unexpected error: {type(e).__name__}: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Erro na verificação do Google: {str(e)}"
        )
    
    user = _upsert_google_user(db=db, google_id=google_id, email=email, name=name, picture=picture)
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Conta desativada"
        )
    
    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/google-native", response_model=Token)
def google_native_login(data: NativeGoogleLogin, db: Session = Depends(get_db)):
    """Login/registro via token nativo do Google (Android/iOS)."""
    try:
        idinfo = id_token.verify_oauth2_token(
            data.id_token,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID,
            clock_skew_in_seconds=300,
        )

        google_id = idinfo["sub"]
        email = idinfo.get("email", "").lower()
        name = idinfo.get("name", "")
        picture = idinfo.get("picture", "")

        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Token do Google sem e-mail.",
            )

    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token do Google invalido ou expirado.",
        )
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Erro inesperado no login Google nativo: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Erro na verificacao do Google.",
        )

    user = _upsert_google_user(db=db, google_id=google_id, email=email, name=name, picture=picture)

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Conta desativada"
        )

    access_token = create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}
