from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database.session import get_db
from app.database.models import Expense, User
from app.schemas.schemas import ExpenseCreate, ExpenseResponse, ExpenseUpdate
from app.core.dependencies import get_current_user

router = APIRouter()



@router.get("/", response_model=List[ExpenseResponse])
def get_expenses(current_user: User = Depends(get_current_user), 
    skip: int = 0,
    limit: int = 1000,
    month: int = None,
    year: int = None,
    category: str = None,
    db: Session = Depends(get_db)
):
    """Get all expenses for the current user with optional filters"""
    query = db.query(Expense).filter(Expense.user_id == current_user.id)
    
    if category:
        query = query.filter(Expense.category == category)
    
    expenses = query.offset(skip).limit(limit).all()
    
    # Filter by month and year in Python (since date is stored as string)
    if month is not None or year is not None:
        filtered_expenses = []
        for expense in expenses:
            expense_date = expense.date.split('-')
            expense_year = int(expense_date[0])
            expense_month = int(expense_date[1])
            
            if year is not None and expense_year != year:
                continue
            if month is not None and expense_month != month + 1:  # JS month is 0-based
                continue
                
            filtered_expenses.append(expense)
        
        return filtered_expenses
    
    return expenses

@router.get("/{expense_id}", response_model=ExpenseResponse)
def get_expense(expense_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get a specific expense by ID"""
    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.user_id == current_user.id
    ).first()
    
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    return expense

@router.post("/", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_expense(expense: ExpenseCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create a new expense"""
    expense_data = expense.model_dump(mode='json')
    db_expense = Expense(**expense_data, user_id=current_user.id)
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense

@router.put("/{expense_id}", response_model=ExpenseResponse)
def update_expense(expense_id: int, expense: ExpenseUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Update an expense"""
    db_expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.user_id == current_user.id
    ).first()
    
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    for key, value in expense.dict(exclude_unset=True).items():
        setattr(db_expense, key, value)
    
    db.commit()
    db.refresh(db_expense)
    return db_expense

@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(expense_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Delete an expense"""
    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.user_id == current_user.id
    ).first()
    
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    db.delete(expense)
    db.commit()
    return None
