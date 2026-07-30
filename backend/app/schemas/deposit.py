from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class DepositCreate(BaseModel):
    name: str
    description: Optional[str] = None
    address: Optional[str] = None
    parent_id: Optional[int] = None


class DepositUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    parent_id: Optional[int] = None
    is_active: Optional[bool] = None


class DepositResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    address: Optional[str] = None
    parent_id: Optional[int] = None
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
