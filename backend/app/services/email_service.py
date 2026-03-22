import resend
import random
import string
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.core.config import settings
from app.database.models import VerificationCode, VerificationType

# Configure Resend
resend.api_key = settings.RESEND_API_KEY


def generate_code(length: int = 6) -> str:
    """Gera um código numérico de verificação"""
    return ''.join(random.choices(string.digits, k=length))


def send_verification_email(email: str, code: str, name: str = "") -> bool:
    """Envia email de verificação de conta via Resend"""
    try:
        if not settings.RESEND_API_KEY:
            print(f"[DEV] Verification code for {email}: {code}")
            return True
        
        params = {
            "from": settings.RESEND_FROM_EMAIL,
            "to": [email],
            "subject": "Verifique seu email - AltCorp Wallet",
            "html": f"""
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f8fafc; border-radius: 16px;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <h1 style="color: #0f172a; font-size: 24px; margin: 0;">AltCorp Wallet</h1>
                    <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Verificação de Email</p>
                </div>
                <div style="background: white; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0;">
                    <p style="color: #334155; font-size: 15px; margin: 0 0 16px;">
                        Olá{' ' + name if name else ''}! Use o código abaixo para verificar seu email:
                    </p>
                    <div style="text-align: center; padding: 20px; background: #f1f5f9; border-radius: 8px; margin: 16px 0;">
                        <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #0f172a;">{code}</span>
                    </div>
                    <p style="color: #94a3b8; font-size: 13px; margin: 16px 0 0; text-align: center;">
                        Este código expira em 10 minutos.
                    </p>
                </div>
                <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 16px;">
                    Se você não solicitou este código, ignore este email.
                </p>
            </div>
            """,
        }
        resend.Emails.send(params)
        return True
    except Exception as e:
        print(f"Error sending verification email: {e}")
        return False


def send_password_reset_email(email: str, code: str, name: str = "") -> bool:
    """Envia email de reset de senha via Resend"""
    try:
        if not settings.RESEND_API_KEY:
            print(f"[DEV] Password reset code for {email}: {code}")
            return True
        
        params = {
            "from": settings.RESEND_FROM_EMAIL,
            "to": [email],
            "subject": "Redefinir senha - AltCorp Wallet",
            "html": f"""
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f8fafc; border-radius: 16px;">
                <div style="text-align: center; margin-bottom: 24px;">
                    <h1 style="color: #0f172a; font-size: 24px; margin: 0;">AltCorp Wallet</h1>
                    <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Redefinição de Senha</p>
                </div>
                <div style="background: white; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0;">
                    <p style="color: #334155; font-size: 15px; margin: 0 0 16px;">
                        Olá{' ' + name if name else ''}! Você solicitou a redefinição de senha. Use o código:
                    </p>
                    <div style="text-align: center; padding: 20px; background: #fef2f2; border-radius: 8px; margin: 16px 0;">
                        <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #dc2626;">{code}</span>
                    </div>
                    <p style="color: #94a3b8; font-size: 13px; margin: 16px 0 0; text-align: center;">
                        Este código expira em 10 minutos.
                    </p>
                </div>
                <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 16px;">
                    Se você não solicitou a redefinição de senha, ignore este email.
                </p>
            </div>
            """,
        }
        resend.Emails.send(params)
        return True
    except Exception as e:
        print(f"Error sending password reset email: {e}")
        return False


def create_verification_code(
    db: Session, 
    email: str, 
    code_type: VerificationType,
    user_id: int = None
) -> str:
    """Cria um código de verificação no banco de dados"""
    # Invalidar códigos anteriores do mesmo tipo/email
    db.query(VerificationCode).filter(
        VerificationCode.email == email,
        VerificationCode.type == code_type,
        VerificationCode.used == False
    ).update({"used": True})
    
    code = generate_code()
    
    verification = VerificationCode(
        user_id=user_id,
        email=email,
        code=code,
        type=code_type,
        expires_at=datetime.utcnow() + timedelta(minutes=10),
        used=False,
    )
    db.add(verification)
    db.commit()
    
    return code


def verify_code(
    db: Session, 
    email: str, 
    code: str, 
    code_type: VerificationType
) -> bool:
    """Verifica se o código é válido"""
    verification = db.query(VerificationCode).filter(
        VerificationCode.email == email,
        VerificationCode.code == code,
        VerificationCode.type == code_type,
        VerificationCode.used == False,
        VerificationCode.expires_at > datetime.utcnow()
    ).first()
    
    if not verification:
        return False
    
    # Marcar como usado
    verification.used = True
    db.commit()
    
    return True
