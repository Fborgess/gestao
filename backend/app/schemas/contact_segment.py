from pydantic import BaseModel
from typing import Optional


class ContactSegmentCreate(BaseModel):
    name: str


class ContactSegmentUpdate(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None


class ContactSegmentResponse(BaseModel):
    id: int
    name: str
    is_active: bool

    class Config:
        from_attributes = True
