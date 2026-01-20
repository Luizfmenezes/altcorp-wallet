from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database.session import get_db
from app.database.models import Income
from app.schemas.schemas import IncomeCreate, IncomeResponse

router = APIRouter()

# Temporary: Using user_id = 1 for now (will add authentication later)
TEMP_USER_ID = 1

@router.get("/", response_model=List[IncomeResponse])
def get_incomes(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get all incomes for the current user"""
    incomes = db.query(Income).filter(Income.user_id == TEMP_USER_ID).offset(skip).limit(limit).all()
    return incomes

@router.get("/{income_id}", response_model=IncomeResponse)
def get_income(income_id: int, db: Session = Depends(get_db)):
    """Get a specific income by ID"""
    income = db.query(Income).filter(
        Income.id == income_id,
        Income.user_id == TEMP_USER_ID
    ).first()
    
    if not income:
        raise HTTPException(status_code=404, detail="Income not found")
    
    return income

@router.post("/", response_model=IncomeResponse, status_code=status.HTTP_201_CREATED)
def create_income(income: IncomeCreate, db: Session = Depends(get_db)):
    """Create a new income"""
    db_income = Income(**income.dict(), user_id=TEMP_USER_ID)
    db.add(db_income)
    db.commit()
    db.refresh(db_income)
    return db_income

@router.delete("/{income_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_income(income_id: int, db: Session = Depends(get_db)):
    """Delete an income"""
    income = db.query(Income).filter(
        Income.id == income_id,
        Income.user_id == TEMP_USER_ID
    ).first()
    
    if not income:
        raise HTTPException(status_code=404, detail="Income not found")
    
    db.delete(income)
    db.commit()
    return None
