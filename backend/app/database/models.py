from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.session import Base
import enum

class IncomeType(str, enum.Enum):
    fixed = "fixed"
    extra = "extra"

class CardType(str, enum.Enum):
    credit = "credit"
    debit = "debit"
    bank = "bank"

class FrequencyType(str, enum.Enum):
    monthly = "monthly"
    weekly = "weekly"

class UserRole(str, enum.Enum):
    admin = "admin"
    user = "user"
    temp = "temp"
    
    def __str__(self):
        return self.value

class VerificationType(str, enum.Enum):
    email_verify = "email_verify"
    password_reset = "password_reset"

# SQLAlchemy Enum definitions that match PostgreSQL enum names
IncomeTypeEnum = Enum(IncomeType, name='income_type', values_callable=lambda obj: [e.value for e in obj])
CardTypeEnum = Enum(CardType, name='card_type', values_callable=lambda obj: [e.value for e in obj])
FrequencyTypeEnum = Enum(FrequencyType, name='frequency_type', values_callable=lambda obj: [e.value for e in obj])
UserRoleEnum = Enum(UserRole, name='user_role', values_callable=lambda obj: [e.value for e in obj])
VerificationTypeEnum = Enum(VerificationType, name='verification_type', values_callable=lambda obj: [e.value for e in obj])

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=True)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=True)  # Nullable for Google OAuth users
    role = Column(UserRoleEnum, nullable=False, default=UserRole.user)
    is_active = Column(Boolean, default=True, nullable=False)
    onboarding_completed = Column(Boolean, default=False, nullable=False)
    email_verified = Column(Boolean, default=False, nullable=False)
    google_id = Column(String, unique=True, nullable=True)
    avatar_url = Column(String, nullable=True)
    profile_photo = Column(String, nullable=True)  # Base64 encoded image
    people = Column(JSON, nullable=True, default=list)  # Lista de pessoas do usuário
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    incomes = relationship("Income", back_populates="user", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="user", cascade="all, delete-orphan")
    cards = relationship("Card", back_populates="user", cascade="all, delete-orphan")
    budgets = relationship("Budget", back_populates="user", cascade="all, delete-orphan")
    paid_invoices = relationship("PaidInvoice", back_populates="user")

class Income(Base):
    __tablename__ = "incomes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    description = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    type = Column(IncomeTypeEnum, nullable=False)
    pay_day = Column(Integer, nullable=True)          # Dia do pagamento (1-31)
    month = Column(Integer, nullable=True)             # Mês do pagamento (0-11) - quando recebe
    year = Column(Integer, nullable=True)              # Ano do pagamento
    accounting_month = Column(Integer, nullable=True)  # Mês que contabiliza (0-11)
    accounting_year = Column(Integer, nullable=True)   # Ano que contabiliza
    is_recurring = Column(Boolean, default=False)      # Se repete todo mês
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="incomes")

class Expense(Base):
    __tablename__ = "expenses"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(String, nullable=False)
    description = Column(String, nullable=False)
    category = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    owner = Column(String, nullable=False)
    is_recurring = Column(Boolean, default=False)
    is_paid = Column(Boolean, default=False)
    frequency = Column(FrequencyTypeEnum, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="expenses")

class Card(Base):
    __tablename__ = "cards"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    type = Column(CardTypeEnum, nullable=False)
    color = Column(String, nullable=False)
    icon = Column(String, nullable=True)           # Ícone/banco do cartão (ex: 'nubank', 'itau')
    closing_day = Column(Integer, nullable=True)  # Dia de fechamento da fatura (1-31)
    due_day = Column(Integer, nullable=True)       # Dia de vencimento/pagamento (1-31)
    credit_limit = Column(Float, nullable=True)    # Limite do cartão
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="cards")
    invoice_items = relationship("InvoiceItem", back_populates="card", cascade="all, delete-orphan")
    paid_invoices = relationship("PaidInvoice", back_populates="card", cascade="all, delete-orphan")

class InvoiceItem(Base):
    __tablename__ = "invoice_items"
    
    id = Column(Integer, primary_key=True, index=True)
    card_id = Column(Integer, ForeignKey("cards.id"), nullable=False)
    date = Column(String, nullable=False)
    description = Column(String, nullable=False)
    category = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    owner = Column(String, nullable=False)
    is_recurring = Column(Boolean, default=False)
    frequency = Column(FrequencyTypeEnum, nullable=True)
    installment_info = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    card = relationship("Card", back_populates="invoice_items")

class PaidInvoice(Base):
    __tablename__ = "paid_invoices"
    
    id = Column(Integer, primary_key=True, index=True)
    card_id = Column(Integer, ForeignKey("cards.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    month = Column(Integer, nullable=False)   # 0-11
    year = Column(Integer, nullable=False)
    paid_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    card = relationship("Card", back_populates="paid_invoices")
    user = relationship("User", back_populates="paid_invoices")

class Budget(Base):
    __tablename__ = "budgets"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category = Column(String, nullable=False)
    amount_limit = Column(Float, nullable=False)
    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="budgets")

class VerificationCode(Base):
    __tablename__ = "verification_codes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    email = Column(String, nullable=False, index=True)
    code = Column(String(6), nullable=False, index=True)
    type = Column(VerificationTypeEnum, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
