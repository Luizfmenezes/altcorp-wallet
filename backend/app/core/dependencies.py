from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError
from app.database.session import get_db
from app.database.models import User, UserRole
from app.core.security import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user from JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    
    # O token pode conter username (novo) ou user_id (legado)
    sub = payload.get("sub")
    if sub is None:
        raise credentials_exception
    
    # Tentar buscar por username primeiro, depois por ID (compatibilidade)
    user = db.query(User).filter(User.username == sub).first()
    if user is None:
        # Fallback: tentar como ID numérico (tokens antigos)
        try:
            user_id = int(sub)
            user = db.query(User).filter(User.id == user_id).first()
        except (ValueError, TypeError):
            pass
    
    if user is None:
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )
    
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Get current active user"""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def require_role(required_roles: list[UserRole]):
    """Dependency to check if user has required role"""
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied. Required roles: {[r.value for r in required_roles]}"
            )
        return current_user
    return role_checker

# Specific role dependencies
def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Require admin role"""
    if current_user.role != UserRole.admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

def require_user_or_admin(current_user: User = Depends(get_current_user)) -> User:
    """Require user or admin role (not temp)"""
    if current_user.role == UserRole.temp:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Full user access required"
        )
    return current_user
