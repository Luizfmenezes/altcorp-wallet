from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from datetime import datetime
from dateutil.relativedelta import relativedelta
from app.database.session import get_db
from app.database.models import Card, InvoiceItem, User, PaidInvoice
from app.schemas.schemas import (
    CardCreate, CardUpdate, CardResponse,
    InvoiceItemCreate, InvoiceItemResponse, InvoiceItemUpdate,
    PaidInvoiceResponse
)
from app.core.dependencies import get_current_user

router = APIRouter()

@router.get("/", response_model=List[CardResponse])
def get_cards(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all cards for the current user"""
    cards = db.query(Card).options(joinedload(Card.invoice_items)).filter(Card.user_id == current_user.id).offset(skip).limit(limit).all()
    return cards

@router.get("/{card_id}", response_model=CardResponse)
def get_card(
    card_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific card by ID"""
    card = db.query(Card).options(joinedload(Card.invoice_items)).filter(
        Card.id == card_id,
        Card.user_id == current_user.id
    ).first()
    
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    return card

@router.post("/", response_model=CardResponse, status_code=status.HTTP_201_CREATED)
def create_card(
    card: CardCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new card"""
    db_card = Card(**card.dict(), user_id=current_user.id)
    db.add(db_card)
    db.commit()
    db.refresh(db_card)
    # Recarrega com invoice_items para garantir que a relação está disponível
    db_card = db.query(Card).options(joinedload(Card.invoice_items)).filter(Card.id == db_card.id).first()
    return db_card

@router.put("/{card_id}", response_model=CardResponse)
def update_card(
    card_id: int,
    card_update: CardUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a card"""
    card = db.query(Card).options(joinedload(Card.invoice_items)).filter(
        Card.id == card_id,
        Card.user_id == current_user.id
    ).first()
    
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    for key, value in card_update.dict(exclude_unset=True).items():
        setattr(card, key, value)
    
    db.commit()
    # Recarrega com invoice_items para garantir que a relação está disponível
    card = db.query(Card).options(joinedload(Card.invoice_items)).filter(Card.id == card_id).first()
    return card

@router.delete("/{card_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_card(
    card_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a card"""
    card = db.query(Card).filter(
        Card.id == card_id,
        Card.user_id == current_user.id
    ).first()
    
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    db.delete(card)
    db.commit()
    return None

# Invoice Items endpoints
@router.get("/{card_id}/items", response_model=List[InvoiceItemResponse])
def get_invoice_items(
    card_id: int,
    skip: int = 0,
    limit: int = 1000,
    month: int = None,
    year: int = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all invoice items for a card"""
    # Verify card exists and belongs to user
    card = db.query(Card).filter(
        Card.id == card_id,
        Card.user_id == current_user.id
    ).first()
    
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    query = db.query(InvoiceItem).filter(InvoiceItem.card_id == card_id)
    items = query.offset(skip).limit(limit).all()
    
    # Filter by month and year if provided
    if month is not None or year is not None:
        filtered_items = []
        for item in items:
            item_date = item.date.split('-')
            item_year = int(item_date[0])
            item_month = int(item_date[1])
            
            if year is not None and item_year != year:
                continue
            if month is not None and item_month != month + 1:  # JS month is 0-based
                continue
                
            filtered_items.append(item)
        
        return filtered_items
    
    return items

@router.post("/{card_id}/items", response_model=List[InvoiceItemResponse], status_code=status.HTTP_201_CREATED)
def create_invoice_item(
    card_id: int,
    item: InvoiceItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new invoice item (with optional installments)"""
    # Verify card exists and belongs to user
    card = db.query(Card).filter(
        Card.id == card_id,
        Card.user_id == current_user.id
    ).first()
    
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    # Validar valor máximo (DECIMAL(15,2) suporta até 9.999.999.999.999,99)
    if item.amount > 9999999999999.99 or item.amount < -9999999999999.99:
        raise HTTPException(status_code=400, detail="Valor excede o limite permitido")
    
    created_items = []
    item_data = item.dict(exclude={'installments'})
    
    # Handle installments
    if item.installments and item.installments > 1:
        installment_amount = round(item.amount / item.installments, 2)
        base_date = datetime.fromisoformat(item.date)
        
        for i in range(item.installments):
            installment_date = base_date + relativedelta(months=i)
            
            db_item = InvoiceItem(
                **{**item_data, 
                   'date': installment_date.strftime('%Y-%m-%d'),
                   'description': f"{item.description} ({i+1}/{item.installments})",
                   'amount': installment_amount,
                   'installment_info': {
                       'current_installment': i + 1,
                       'total_installments': item.installments,
                       'original_amount': item.amount
                   }
                },
                card_id=card_id
            )
            db.add(db_item)
            created_items.append(db_item)
    else:
        db_item = InvoiceItem(**item_data, card_id=card_id)
        db.add(db_item)
        created_items.append(db_item)
    
    db.commit()
    for item in created_items:
        db.refresh(item)
    
    return created_items

@router.put("/{card_id}/items/{item_id}", response_model=InvoiceItemResponse)
def update_invoice_item(
    card_id: int,
    item_id: int,
    item: InvoiceItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an invoice item"""
    # Verify card exists and belongs to user
    card = db.query(Card).filter(
        Card.id == card_id,
        Card.user_id == current_user.id
    ).first()
    
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    db_item = db.query(InvoiceItem).filter(
        InvoiceItem.id == item_id,
        InvoiceItem.card_id == card_id
    ).first()
    
    if not db_item:
        raise HTTPException(status_code=404, detail="Invoice item not found")
    
    for key, value in item.dict(exclude_unset=True).items():
        setattr(db_item, key, value)
    
    db.commit()
    db.refresh(db_item)
    return db_item

@router.delete("/{card_id}/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_invoice_item(
    card_id: int,
    item_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an invoice item"""
    # Verify card exists and belongs to user
    card = db.query(Card).filter(
        Card.id == card_id,
        Card.user_id == current_user.id
    ).first()
    
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    item = db.query(InvoiceItem).filter(
        InvoiceItem.id == item_id,
        InvoiceItem.card_id == card_id
    ).first()
    
    if not item:
        raise HTTPException(status_code=404, detail="Invoice item not found")
    
    db.delete(item)
    db.commit()
    return None


# Paid Invoices endpoints
@router.post("/{card_id}/paid-invoices", response_model=PaidInvoiceResponse, status_code=status.HTTP_201_CREATED)
def mark_invoice_paid(
    card_id: int,
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a card invoice month as paid"""
    card = db.query(Card).filter(
        Card.id == card_id,
        Card.user_id == current_user.id
    ).first()

    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    month = data.get("month")
    year = data.get("year")

    if month is None or year is None:
        raise HTTPException(status_code=400, detail="month and year are required")

    # Return existing record if already marked as paid
    existing = db.query(PaidInvoice).filter(
        PaidInvoice.card_id == card_id,
        PaidInvoice.month == month,
        PaidInvoice.year == year
    ).first()
    if existing:
        return existing

    paid = PaidInvoice(
        card_id=card_id,
        user_id=current_user.id,
        month=month,
        year=year
    )
    db.add(paid)
    db.commit()
    db.refresh(paid)
    return paid


@router.delete("/{card_id}/paid-invoices/{month}/{year}", status_code=status.HTTP_204_NO_CONTENT)
def unmark_invoice_paid(
    card_id: int,
    month: int,
    year: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Unmark a card invoice month as paid"""
    card = db.query(Card).filter(
        Card.id == card_id,
        Card.user_id == current_user.id
    ).first()

    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    paid = db.query(PaidInvoice).filter(
        PaidInvoice.card_id == card_id,
        PaidInvoice.month == month,
        PaidInvoice.year == year
    ).first()

    if paid:
        db.delete(paid)
        db.commit()
    return None
