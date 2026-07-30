from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class PaymentTypeCreate(BaseModel):
    name: str
    description: Optional[str] = None
    requires_installments: Optional[bool] = False


class PaymentTypeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    requires_installments: Optional[bool] = None
    is_active: Optional[bool] = None


class PaymentTypeResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    requires_installments: bool
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
