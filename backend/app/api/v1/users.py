from typing import Any, List
from fastapi import APIRouter, Body, Depends, HTTPException, status
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
from app.database import models
from app.schemas import schemas

# === CORREÇÃO DOS IMPORTS ===
# Usando os caminhos que sabemos que funcionam no seu projeto
from app.database.session import get_db
from app.core.dependencies import get_current_user
from app.core.security import get_password_hash

router = APIRouter()

# Função auxiliar para garantir que é superusuário (adaptada)
def get_current_active_superuser(current_user: models.User = Depends(get_current_user)) -> models.User:
    if not current_user.role == "admin":
        raise HTTPException(status_code=400, detail="The user doesn't have enough privileges")
    return current_user

# === ROTA PÚBLICA / USUÁRIO COMUM ===

@router.get("/me", response_model=schemas.UserResponse)
def read_user_me(
    current_user: models.User = Depends(get_current_user),
) -> Any:
    """
    Get current user.
    """
    return current_user

# ROTA DE ATUALIZAÇÃO DO PRÓPRIO USUÁRIO (A QUE O ONBOARDING PRECISA)
@router.put("/me", response_model=schemas.UserResponse)
def update_user_me(
    *,
    db: Session = Depends(get_db),
    user_in: schemas.UserUpdate,
    current_user: models.User = Depends(get_current_user),
) -> Any:
    """
    Update own user.
    """
    user_data = jsonable_encoder(current_user)
    update_data = user_in.dict(exclude_unset=True)
    
    # Se tentar mudar a senha, precisamos encriptar
    if "password" in update_data and update_data["password"]:
        hashed_password = get_password_hash(update_data["password"])
        del update_data["password"]
        current_user.hashed_password = hashed_password
    
    # Atualiza os campos
    for field in user_data:
        if field in update_data:
            setattr(current_user, field, update_data[field])
            
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user

# === ROTAS DE ADMIN ===

@router.get("/", response_model=List[schemas.UserResponse])
def read_users(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(get_current_active_superuser),
) -> Any:
    """
    Retrieve users.
    """
    users = db.query(models.User).offset(skip).limit(limit).all()
    return users

@router.post("/", response_model=schemas.UserResponse)
def create_user(
    *,
    db: Session = Depends(get_db),
    user_in: schemas.UserCreate,
    current_user: models.User = Depends(get_current_active_superuser),
) -> Any:
    """
    Create new user.
    """
    user = db.query(models.User).filter(models.User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system.",
        )
    user = models.User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        name=user_in.name,
        username=user_in.username,
        role=user_in.role,
        is_active=True,
        onboarding_completed=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.put("/{user_id}", response_model=schemas.UserResponse)
def update_user(
    *,
    db: Session = Depends(get_db),
    user_id: int,
    user_in: schemas.UserUpdate,
    current_user: models.User = Depends(get_current_active_superuser),
) -> Any:
    """
    Update a user.
    """
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this id does not exist in the system",
        )
    user_data = jsonable_encoder(user)
    update_data = user_in.dict(exclude_unset=True)
    
    if "password" in update_data and update_data["password"]:
        hashed_password = get_password_hash(update_data["password"])
        del update_data["password"]
        user.hashed_password = hashed_password
        
    for field in user_data:
        if field in update_data:
            setattr(user, field, update_data[field])
            
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
