from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class RecurrenceFrequencyCreate(BaseModel):
    name: str
    days_interval: int
    is_active: Optional[bool] = True


class RecurrenceFrequencyUpdate(BaseModel):
    name: Optional[str] = None
    days_interval: Optional[int] = None
    is_active: Optional[bool] = None


class RecurrenceFrequencyResponse(BaseModel):
    id: int
    name: str
    days_interval: int
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
