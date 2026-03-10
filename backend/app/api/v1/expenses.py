from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import date, timedelta
from app.database.session import get_db
from app.database.models import Expense, User, InvoiceItem, Card
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
    db_expense = Expense(**expense.dict(), user_id=current_user.id)
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


@router.post("/process-recurring")
def process_recurring(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Processa despesas e itens de fatura recorrentes.
    Copia itens marcados como is_recurring=True + frequency='monthly' do mês anterior
    para o mês atual, evitando duplicatas.
    """
    today = date.today()
    cur_year = today.year
    cur_month = today.month

    # Mês anterior
    first_of_month = date(cur_year, cur_month, 1)
    last_month_date = first_of_month - timedelta(days=1)
    prev_year = last_month_date.year
    prev_month = last_month_date.month

    created_expenses = 0
    created_items = 0

    # --- 1) Despesas recorrentes ---
    recurring_expenses = (
        db.query(Expense)
        .filter(
            Expense.user_id == current_user.id,
            Expense.is_recurring.is_(True),
            Expense.frequency == "monthly",
        )
        .all()
    )

    # Filtrar somente as do mês anterior (date é string "YYYY-MM-DD")
    prev_prefix = f"{prev_year}-{prev_month:02d}-"
    cur_prefix = f"{cur_year}-{cur_month:02d}-"

    prev_month_expenses = [e for e in recurring_expenses if e.date.startswith(prev_prefix)]

    # Despesas já existentes no mês atual (para evitar duplicatas)
    existing_current = (
        db.query(Expense)
        .filter(
            Expense.user_id == current_user.id,
            Expense.is_recurring.is_(True),
        )
        .all()
    )
    existing_keys = {
        (e.description, e.category, e.amount, e.owner)
        for e in existing_current
        if e.date.startswith(cur_prefix)
    }

    for exp in prev_month_expenses:
        key = (exp.description, exp.category, exp.amount, exp.owner)
        if key in existing_keys:
            continue
        # Cria cópia no mês atual mantendo o mesmo dia
        try:
            day = int(exp.date.split("-")[2])
        except (IndexError, ValueError):
            day = 1
        # Ajusta dia para meses com menos dias
        import calendar
        max_day = calendar.monthrange(cur_year, cur_month)[1]
        day = min(day, max_day)
        new_date = f"{cur_year}-{cur_month:02d}-{day:02d}"

        new_expense = Expense(
            user_id=current_user.id,
            date=new_date,
            description=exp.description,
            category=exp.category,
            amount=exp.amount,
            owner=exp.owner,
            is_recurring=True,
            frequency=exp.frequency,
        )
        db.add(new_expense)
        existing_keys.add(key)
        created_expenses += 1

    # --- 2) Itens de fatura recorrentes ---
    user_cards = db.query(Card).filter(Card.user_id == current_user.id).all()

    for card in user_cards:
        recurring_items = (
            db.query(InvoiceItem)
            .filter(
                InvoiceItem.card_id == card.id,
                InvoiceItem.is_recurring.is_(True),
                InvoiceItem.frequency == "monthly",
            )
            .all()
        )

        prev_items = [i for i in recurring_items if i.date.startswith(prev_prefix)]

        existing_cur_items = (
            db.query(InvoiceItem)
            .filter(
                InvoiceItem.card_id == card.id,
                InvoiceItem.is_recurring.is_(True),
            )
            .all()
        )
        existing_item_keys = {
            (i.description, i.category, i.amount, i.owner)
            for i in existing_cur_items
            if i.date.startswith(cur_prefix)
        }

        for item in prev_items:
            key = (item.description, item.category, item.amount, item.owner)
            if key in existing_item_keys:
                continue
            try:
                day = int(item.date.split("-")[2])
            except (IndexError, ValueError):
                day = 1
            import calendar
            max_day = calendar.monthrange(cur_year, cur_month)[1]
            day = min(day, max_day)
            new_date = f"{cur_year}-{cur_month:02d}-{day:02d}"

            new_item = InvoiceItem(
                card_id=card.id,
                date=new_date,
                description=item.description,
                category=item.category,
                amount=item.amount,
                owner=item.owner,
                is_recurring=True,
                frequency=item.frequency,
            )
            db.add(new_item)
            existing_item_keys.add(key)
            created_items += 1

    db.commit()

    return {
        "processed": True,
        "created_expenses": created_expenses,
        "created_invoice_items": created_items,
        "month": f"{cur_year}-{cur_month:02d}",
    }
