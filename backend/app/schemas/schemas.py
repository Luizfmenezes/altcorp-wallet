from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum

# Enums
class IncomeType(str, Enum):
    FIXED = "fixed"
    EXTRA = "extra"

class CardType(str, Enum):
    CREDIT = "credit"
    DEBIT = "debit"
    BANK = "bank"

class FrequencyType(str, Enum):
    MONTHLY = "monthly"
    WEEKLY = "weekly"

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Income Schemas
class IncomeBase(BaseModel):
    description: str
    amount: float
    type: IncomeType
    month: Optional[int] = None
    year: Optional[int] = None

class IncomeCreate(IncomeBase):
    pass

class IncomeResponse(IncomeBase):
    id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Expense Schemas
class ExpenseBase(BaseModel):
    date: str
    description: str
    category: str
    amount: float
    owner: str
    is_recurring: bool = False
    frequency: Optional[FrequencyType] = None

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseUpdate(BaseModel):
    date: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    amount: Optional[float] = None
    owner: Optional[str] = None
    is_recurring: Optional[bool] = None
    frequency: Optional[FrequencyType] = None

class ExpenseResponse(ExpenseBase):
    id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Card Schemas
class CardBase(BaseModel):
    name: str
    type: CardType
    color: str

class CardCreate(CardBase):
    pass

class CardResponse(CardBase):
    id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Invoice Item Schemas
class InstallmentInfo(BaseModel):
    current_installment: int
    total_installments: int
    original_amount: float

class InvoiceItemBase(BaseModel):
    date: str
    description: str
    category: str
    amount: float
    owner: str
    is_recurring: bool = False
    frequency: Optional[FrequencyType] = None
    installment_info: Optional[InstallmentInfo] = None

class InvoiceItemCreate(InvoiceItemBase):
    installments: Optional[int] = None

class InvoiceItemUpdate(BaseModel):
    date: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    amount: Optional[float] = None
    owner: Optional[str] = None
    is_recurring: Optional[bool] = None
    frequency: Optional[FrequencyType] = None

class InvoiceItemResponse(InvoiceItemBase):
    id: int
    card_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Budget Schemas
class BudgetBase(BaseModel):
    category: str
    limit: float
    month: int
    year: int

class BudgetCreate(BudgetBase):
    pass

class BudgetResponse(BudgetBase):
    id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
