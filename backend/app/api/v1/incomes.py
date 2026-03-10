from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database.session import get_db
from app.database.models import Income, User
from app.schemas.schemas import IncomeCreate, IncomeResponse, IncomeUpdate
from app.core.dependencies import get_current_user

router = APIRouter()

@router.get("/", response_model=List[IncomeResponse])
def get_incomes(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all incomes for the current user"""
    incomes = db.query(Income).filter(Income.user_id == current_user.id).offset(skip).limit(limit).all()
    return incomes

@router.get("/{income_id}", response_model=IncomeResponse)
def get_income(
    income_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific income by ID"""
    income = db.query(Income).filter(
        Income.id == income_id,
        Income.user_id == current_user.id
    ).first()
    
    if not income:
        raise HTTPException(status_code=404, detail="Income not found")
    
    return income

@router.post("/", response_model=IncomeResponse, status_code=status.HTTP_201_CREATED)
def create_income(
    income: IncomeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new income"""
    db_income = Income(**income.dict(), user_id=current_user.id)
    db.add(db_income)
    db.commit()
    db.refresh(db_income)
    return db_income

@router.put("/{income_id}", response_model=IncomeResponse)
def update_income(
    income_id: int,
    income_data: IncomeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an existing income"""
    income = db.query(Income).filter(
        Income.id == income_id,
        Income.user_id == current_user.id
    ).first()
    
    if not income:
        raise HTTPException(status_code=404, detail="Income not found")
    
    update_dict = income_data.dict(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(income, key, value)
    
    db.commit()
    db.refresh(income)
    return income

@router.post("/process-recurring", response_model=List[IncomeResponse])
def process_recurring_incomes(
    target_month: int,
    target_year: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Process recurring incomes: copy recurring incomes from the previous month
    to the target month if they don't already exist.
    """
    # Calculate previous month
    if target_month == 1:
        prev_month = 12
        prev_year = target_year - 1
    else:
        prev_month = target_month - 1
        prev_year = target_year
    
    # Get recurring incomes from the previous month
    recurring_incomes = db.query(Income).filter(
        Income.user_id == current_user.id,
        Income.is_recurring == True,
        Income.accounting_month == prev_month,
        Income.accounting_year == prev_year
    ).all()
    
    created_incomes = []
    
    for rec_income in recurring_incomes:
        # Check if already exists for target month
        existing = db.query(Income).filter(
            Income.user_id == current_user.id,
            Income.description == rec_income.description,
            Income.type == rec_income.type,
            Income.accounting_month == target_month,
            Income.accounting_year == target_year,
            Income.is_recurring == True
        ).first()
        
        if not existing:
            # Calculate new pay_day month/year
            new_pay_month = target_month
            new_pay_year = target_year
            
            # If original had pay_day in a different month than accounting,
            # maintain that same offset
            if rec_income.month and rec_income.accounting_month:
                month_offset = rec_income.month - rec_income.accounting_month
                new_pay_month = target_month + month_offset
                if new_pay_month <= 0:
                    new_pay_month += 12
                    new_pay_year -= 1
                elif new_pay_month > 12:
                    new_pay_month -= 12
                    new_pay_year += 1
            
            new_income = Income(
                user_id=current_user.id,
                description=rec_income.description,
                amount=rec_income.amount,
                type=rec_income.type,
                pay_day=rec_income.pay_day,
                month=new_pay_month,
                year=new_pay_year,
                accounting_month=target_month,
                accounting_year=target_year,
                is_recurring=True
            )
            db.add(new_income)
            created_incomes.append(new_income)
    
    if created_incomes:
        db.commit()
        for inc in created_incomes:
            db.refresh(inc)
    
    return created_incomes

@router.delete("/{income_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_income(
    income_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an income"""
    income = db.query(Income).filter(
        Income.id == income_id,
        Income.user_id == current_user.id
    ).first()
    
    if not income:
        raise HTTPException(status_code=404, detail="Income not found")
    
    db.delete(income)
    db.commit()
    return None
