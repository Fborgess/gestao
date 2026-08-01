from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class PriceTableItemCreate(BaseModel):
    product_id: int
    price: float = Field(gt=0)


class PriceTableCreate(BaseModel):
    name: str
    description: Optional[str] = None
    items: List[PriceTableItemCreate] = []


class PriceTableUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    items: Optional[List[PriceTableItemCreate]] = None


class PriceTableItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: Optional[str] = None
    price: float

    class Config:
        from_attributes = True


class PriceTableResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    items: List[PriceTableItemResponse] = []

    class Config:
        from_attributes = True
