from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AccountCreate(BaseModel):
    name: str
    account_type: str  # "banco", "caixa", "cartao_credito"
    bank_name: Optional[str] = None
    agency: Optional[str] = None
    account_number: Optional[str] = None
    balance: Optional[float] = 0
    flag: Optional[str] = None
    closing_day: Optional[int] = None
    due_day: Optional[int] = None
    best_purchase_day: Optional[int] = None
    credit_limit: Optional[float] = None


class AccountUpdate(BaseModel):
    name: Optional[str] = None
    account_type: Optional[str] = None
    bank_name: Optional[str] = None
    agency: Optional[str] = None
    account_number: Optional[str] = None
    balance: Optional[float] = None
    flag: Optional[str] = None
    closing_day: Optional[int] = None
    due_day: Optional[int] = None
    best_purchase_day: Optional[int] = None
    credit_limit: Optional[float] = None
    is_active: Optional[bool] = None


class AccountResponse(BaseModel):
    id: int
    name: str
    account_type: str
    bank_name: Optional[str] = None
    agency: Optional[str] = None
    account_number: Optional[str] = None
    balance: float
    flag: Optional[str] = None
    closing_day: Optional[int] = None
    due_day: Optional[int] = None
    best_purchase_day: Optional[int] = None
    credit_limit: Optional[float] = None
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
