from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class PaymentCreate(BaseModel):
    transaction_id: int
    amount: float
    interest: Optional[float] = 0
    payment_date: datetime
    notes: Optional[str] = None


class PaymentResponse(BaseModel):
    id: int
    transaction_id: int
    amount: float
    interest: float
    payment_date: datetime
    notes: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
