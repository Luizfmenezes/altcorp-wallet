from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

# Enums
class IncomeType(str, Enum):
    fixed = "fixed"
    extra = "extra"

class CardType(str, Enum):
    credit = "credit"
    debit = "debit"
    bank = "bank"

class FrequencyType(str, Enum):
    monthly = "monthly"
    weekly = "weekly"

class UserRole(str, Enum):
    admin = "admin"
    user = "user"
    temp = "temp"

# User Schemas
class UserBase(BaseModel):
    username: str
    name: str

class UserCreate(UserBase):
    password: str
    email: Optional[EmailStr] = None
    role: UserRole = UserRole.user

class UserUpdate(BaseModel):
    username: Optional[str] = None
    name: Optional[str] = None
    email: Optional[str] = None  # Accept any string, validate in validator
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    onboarding_completed: Optional[bool] = None
    profile_photo: Optional[str] = None
    
    @field_validator('email', mode='before')
    @classmethod
    def empty_string_to_none(cls, v):
        if v is None or v == '':
            return None
        return v

class UserResponse(UserBase):
    id: int
    email: Optional[str] = None
    role: UserRole
    is_active: bool
    onboarding_completed: bool
    profile_photo: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    username: str
    password: str

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

# CardResponse needs to be defined AFTER InvoiceItemResponse
class CardResponse(CardBase):
    id: int
    user_id: int
    created_at: datetime
    invoice_items: List[InvoiceItemResponse] = []
    
    class Config:
        from_attributes = True

# Budget Schemas
class BudgetBase(BaseModel):
    category: str
    amount_limit: float
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
