from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum
import re

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
    email_verified: bool = False
    google_id: Optional[str] = None
    avatar_url: Optional[str] = None
    profile_photo: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    username: str  # Can be username or email
    password: str

# Auth - Registration
class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    username: str
    password: str
    confirm_password: str
    
    @field_validator('confirm_password')
    @classmethod
    def passwords_match(cls, v, info):
        if 'password' in info.data and v != info.data['password']:
            raise ValueError('As senhas não conferem')
        return v
    
    @field_validator('username')
    @classmethod
    def username_valid(cls, v):
        v = v.strip().lower()
        if len(v) < 3:
            raise ValueError('Username deve ter pelo menos 3 caracteres')
        if len(v) > 30:
            raise ValueError('Username deve ter no máximo 30 caracteres')
        if not re.match(r'^[a-z0-9_]+$', v):
            raise ValueError('Username pode conter apenas letras, números e _')
        return v

# Auth - Email Verification
class VerifyEmailRequest(BaseModel):
    email: EmailStr
    code: str

class ResendCodeRequest(BaseModel):
    email: EmailStr

# Auth - Password Reset
class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str
    new_password: str
    confirm_password: str
    
    @field_validator('confirm_password')
    @classmethod
    def passwords_match(cls, v, info):
        if 'new_password' in info.data and v != info.data['new_password']:
            raise ValueError('As senhas não conferem')
        return v

# Auth - Google Login
class GoogleLoginRequest(BaseModel):
    credential: str  # Google ID token

class GoogleRedirectUrlResponse(BaseModel):
    auth_url: str

class ImportedInvoiceItem(BaseModel):
    date: str
    description: str
    category: str
    amount: float
    owner: str
    notes: Optional[str] = None

class InvoiceImportTextRequest(BaseModel):
    content: str
    card_name: Optional[str] = None
    people: List[str] = []
    reference_month: Optional[int] = None
    reference_year: Optional[int] = None

class InvoiceImportResponse(BaseModel):
    raw_text: str
    items: List[ImportedInvoiceItem]

# Income Schemas
class IncomeBase(BaseModel):
    description: str
    amount: float
    type: IncomeType
    pay_day: Optional[int] = None
    month: Optional[int] = None
    year: Optional[int] = None
    accounting_month: Optional[int] = None
    accounting_year: Optional[int] = None
    is_recurring: bool = False

class IncomeCreate(IncomeBase):
    pass

class IncomeUpdate(BaseModel):
    description: Optional[str] = None
    amount: Optional[float] = None
    type: Optional[IncomeType] = None
    pay_day: Optional[int] = None
    month: Optional[int] = None
    year: Optional[int] = None
    accounting_month: Optional[int] = None
    accounting_year: Optional[int] = None
    is_recurring: Optional[bool] = None

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
    is_paid: bool = False
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
    is_paid: Optional[bool] = None
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
    icon: Optional[str] = None             # Ícone/banco do cartão
    closing_day: Optional[int] = None  # Dia de fechamento da fatura (1-31)
    due_day: Optional[int] = None      # Dia de vencimento/pagamento (1-31)
    credit_limit: Optional[float] = None  # Limite do cartão

class CardCreate(CardBase):
    pass

class CardUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[CardType] = None
    color: Optional[str] = None
    icon: Optional[str] = None
    closing_day: Optional[int] = None
    due_day: Optional[int] = None
    credit_limit: Optional[float] = None

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
    split_between: Optional[List[str]] = None

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
class PaidInvoiceResponse(BaseModel):
    id: int
    month: int
    year: int
    
    class Config:
        from_attributes = True

class CardResponse(CardBase):
    id: int
    user_id: int
    closing_day: Optional[int] = None
    due_day: Optional[int] = None
    credit_limit: Optional[float] = None
    created_at: datetime
    invoice_items: List[InvoiceItemResponse] = []
    paid_invoices: List[PaidInvoiceResponse] = []
    
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
