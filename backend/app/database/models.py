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

# SQLAlchemy Enum definitions that match PostgreSQL enum names
IncomeTypeEnum = Enum(IncomeType, name='income_type', values_callable=lambda obj: [e.value for e in obj])
CardTypeEnum = Enum(CardType, name='card_type', values_callable=lambda obj: [e.value for e in obj])
FrequencyTypeEnum = Enum(FrequencyType, name='frequency_type', values_callable=lambda obj: [e.value for e in obj])
UserRoleEnum = Enum(UserRole, name='user_role', values_callable=lambda obj: [e.value for e in obj])

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=True)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(UserRoleEnum, nullable=False, default=UserRole.user)
    is_active = Column(Boolean, default=True, nullable=False)
    onboarding_completed = Column(Boolean, default=False, nullable=False)
    profile_photo = Column(String, nullable=True)  # Base64 encoded image
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    incomes = relationship("Income", back_populates="user", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="user", cascade="all, delete-orphan")
    cards = relationship("Card", back_populates="user", cascade="all, delete-orphan")
    budgets = relationship("Budget", back_populates="user", cascade="all, delete-orphan")

class Income(Base):
    __tablename__ = "incomes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    description = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    type = Column(IncomeTypeEnum, nullable=False)
    month = Column(Integer, nullable=True)
    year = Column(Integer, nullable=True)
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
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="cards")
    invoice_items = relationship("InvoiceItem", back_populates="card", cascade="all, delete-orphan")

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
