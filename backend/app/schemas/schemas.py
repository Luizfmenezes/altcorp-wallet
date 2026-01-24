from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

# === 1. ENUMS ===
class IncomeType(str, Enum):
    FIXED = "fixed"
    EXTRA = "extra"
    
    @classmethod
    def _missing_(cls, value):
        """Handle case-insensitive matching"""
        if isinstance(value, str):
            value = value.lower()
            for member in cls:
                if member.value == value:
                    return member
        return None

class CardType(str, Enum):
    CREDIT = "credit"
    DEBIT = "debit"
    BANK = "bank"
    
    @classmethod
    def _missing_(cls, value):
        """Handle case-insensitive matching"""
        if isinstance(value, str):
            value = value.lower()
            for member in cls:
                if member.value == value:
                    return member
        return None

class FrequencyType(str, Enum):
    MONTHLY = "monthly"
    WEEKLY = "weekly"
    
    @classmethod
    def _missing_(cls, value):
        """Handle case-insensitive matching"""
        if isinstance(value, str):
            value = value.lower()
            for member in cls:
                if member.value == value:
                    return member
        return None

class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"
    TEMP = "temp"
    
    @classmethod
    def _missing_(cls, value):
        """Handle case-insensitive matching"""
        if isinstance(value, str):
            value = value.lower()
            for member in cls:
                if member.value == value:
                    return member
        return None

# === 2. USER SCHEMAS ===
class UserBase(BaseModel):
    username: str
    name: str

class UserCreate(UserBase):
    password: str
    email: Optional[EmailStr] = None
    role: UserRole = UserRole.USER

class UserUpdate(BaseModel):
    username: Optional[str] = None
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    onboarding_completed: Optional[bool] = None
    profile_photo: Optional[str] = None

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

# === 3. INCOME SCHEMAS ===
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

# === 4. EXPENSE SCHEMAS ===
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

# === 5. INVOICE ITEM SCHEMAS (IMPORTANTE: VEM ANTES DE CARD) ===
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

# === 6. CARD SCHEMAS (AGORA PODE USAR InvoiceItemResponse) ===
class CardBase(BaseModel):
    name: str
    type: CardType
    color: str

class CardCreate(CardBase):
    pass

class Card(CardBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    # AQUI: Lista de itens agora funciona porque InvoiceItemResponse já foi lido acima
    invoice_items: List[InvoiceItemResponse] = [] 

    class Config:
        from_attributes = True

class CardResponse(Card):
    pass

# === 7. BUDGET SCHEMAS ===
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

# === 8. TOKEN SCHEMAS ===
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
