from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class UnitCreate(BaseModel):
    name: str
    abbreviation: str


class UnitUpdate(BaseModel):
    name: Optional[str] = None
    abbreviation: Optional[str] = None


class UnitResponse(BaseModel):
    id: int
    name: str
    abbreviation: str
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
