from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database.session import get_db
from app.database.models import Budget, User
from app.schemas.schemas import BudgetCreate, BudgetResponse
from app.core.dependencies import get_current_user

router = APIRouter()

@router.get("/", response_model=List[BudgetResponse])
def get_budgets(
    skip: int = 0,
    limit: int = 100,
    month: int = None,
    year: int = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all budgets for the current user"""
    query = db.query(Budget).filter(Budget.user_id == current_user.id)
    
    if month is not None:
        query = query.filter(Budget.month == month)
    if year is not None:
        query = query.filter(Budget.year == year)
    
    budgets = query.offset(skip).limit(limit).all()
    return budgets

@router.post("/", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
def create_or_update_budget(
    budget: BudgetCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create or update a budget for a category in a specific month/year"""
    # Check if budget already exists
    existing_budget = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.category == budget.category,
        Budget.month == budget.month,
        Budget.year == budget.year
    ).first()
    
    if existing_budget:
        # Update existing budget
        existing_budget.limit = budget.limit
        db.commit()
        db.refresh(existing_budget)
        return existing_budget
    
    # Create new budget
    db_budget = Budget(**budget.dict(), user_id=current_user.id)
    db.add(db_budget)
    db.commit()
    db.refresh(db_budget)
    return db_budget

@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget(
    budget_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a budget"""
    budget = db.query(Budget).filter(
        Budget.id == budget_id,
        Budget.user_id == current_user.id
    ).first()
    
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    db.delete(budget)
    db.commit()
    return None

@router.delete("/category/{category}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget_by_category(
    category: str,
    month: int,
    year: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a budget by category and month/year"""
    budget = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.category == category,
        Budget.month == month,
        Budget.year == year
    ).first()
    
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    db.delete(budget)
    db.commit()
    return None
