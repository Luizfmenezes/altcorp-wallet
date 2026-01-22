from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.database.session import get_db
from app.database.models import User, UserRole
from app.schemas.schemas import UserCreate, UserResponse, UserUpdate
from app.core.security import get_password_hash
from app.core.dependencies import require_admin, get_current_user

router = APIRouter()

@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return current_user

@router.put("/me/photo", response_model=UserResponse)
def update_my_photo(
    photo_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user's profile photo"""
    profile_photo = photo_data.get("profile_photo")
    if profile_photo is not None:
        current_user.profile_photo = profile_photo
        db.commit()
        db.refresh(current_user)
    return current_user

@router.put("/me/onboarding", response_model=UserResponse)
def complete_onboarding(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Complete user onboarding and update profile"""
    try:
        # Update user profile with onboarding data
        if user_data.name is not None:
            current_user.name = user_data.name
        if user_data.email is not None:
            current_user.email = user_data.email
        
        # Mark onboarding as completed
        current_user.onboarding_completed = True
        
        db.commit()
        db.refresh(current_user)
        return current_user
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Error completing onboarding: {str(e)}"
        )

@router.get("/", response_model=List[UserResponse])
def list_users(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """List all users (Admin only)"""
    users = db.query(User).offset(skip).limit(limit).all()
    return users

@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get user by ID (Admin only)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_data: UserCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Create new user (Admin only)"""
    # Check if username already exists
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Check email if provided
    if user_data.email:
        existing_email = db.query(User).filter(User.email == user_data.email).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        username=user_data.username,
        email=user_data.email,
        name=user_data.name,
        hashed_password=hashed_password,
        role=user_data.role,
        is_active=True
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user

@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_update: UserUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Update user (Admin only)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent admin from deactivating themselves
    if user.id == current_user.id and user_update.is_active is False:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account"
        )
    
    # Prevent admin from changing their own role
    if user.id == current_user.id and user_update.role is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change your own role"
        )
    
    # Update fields
    if user_update.username is not None:
        # Check if new username is already taken
        existing = db.query(User).filter(
            User.username == user_update.username,
            User.id != user_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered"
            )
        user.username = user_update.username
    if user_update.name is not None:
        user.name = user_update.name
    if user_update.email is not None:
        # Check if new email is already taken
        existing = db.query(User).filter(
            User.email == user_update.email,
            User.id != user_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        user.email = user_update.email
    if user_update.role is not None:
        user.role = user_update.role
    if user_update.is_active is not None:
        user.is_active = user_update.is_active
    if user_update.profile_photo is not None:
        user.profile_photo = user_update.profile_photo
    
    db.commit()
    db.refresh(user)
    
    return user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Delete user (Admin only)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent admin from deleting themselves
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    db.delete(user)
    db.commit()
    
    return None
