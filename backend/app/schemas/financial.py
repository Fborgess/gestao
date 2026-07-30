from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class Payment简(BaseModel):
    id: int
    amount: float
    interest: float
    payment_date: datetime
    notes: Optional[str] = None
    class Config:
        from_attributes = True


class FinancialCategory简(BaseModel):
    id: int
    name: str
    type: Optional[str] = None
    parent_id: Optional[int] = None
    class Config:
        from_attributes = True


class PaymentType简(BaseModel):
    id: int
    name: str
    requires_installments: Optional[bool] = None
    class Config:
        from_attributes = True


class Account简(BaseModel):
    id: int
    name: str
    account_type: Optional[str] = None
    bank_name: Optional[str] = None
    flag: Optional[str] = None
    class Config:
        from_attributes = True


class Contact简(BaseModel):
    id: int
    name: str
    class Config:
        from_attributes = True


class TransactionCreate(BaseModel):
    type: str
    financial_category_id: Optional[int] = None
    description: str
    amount: float
    date: datetime
    due_date: Optional[datetime] = None
    payment_type_id: Optional[int] = None
    account_id: Optional[int] = None
    contact_id: Optional[int] = None
    installments: Optional[int] = 1
    current_installment: Optional[int] = 1
    recurrence_frequency: Optional[str] = None
    notes: Optional[str] = None


class TransactionUpdate(BaseModel):
    type: Optional[str] = None
    financial_category_id: Optional[int] = None
    description: Optional[str] = None
    amount: Optional[float] = None
    date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    payment_type_id: Optional[int] = None
    account_id: Optional[int] = None
    contact_id: Optional[int] = None
    installments: Optional[int] = None
    current_installment: Optional[int] = None
    recurrence_frequency: Optional[str] = None
    notes: Optional[str] = None


class TransactionResponse(BaseModel):
    id: int
    type: str
    financial_category_id: Optional[int] = None
    description: str
    amount: float
    date: datetime
    due_date: Optional[datetime] = None
    payment_type_id: Optional[int] = None
    account_id: Optional[int] = None
    contact_id: Optional[int] = None
    installments: int
    current_installment: int
    recurrence_frequency: Optional[str] = None
    status: Optional[str] = "pendente"
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    financial_category: Optional[FinancialCategory简] = None
    payment_type: Optional[PaymentType简] = None
    account: Optional[Account简] = None
    contact: Optional[Contact简] = None
    payments: Optional[List[Payment简]] = []

    class Config:
        from_attributes = True
