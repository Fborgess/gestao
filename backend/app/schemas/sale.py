from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class SaleTypeCreate(BaseModel):
    name: str
    description: Optional[str] = None


class SaleTypeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class SaleTypeResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SaleItemCreate(BaseModel):
    product_id: int
    quantity: float = Field(gt=0)
    unit_price: float = Field(gt=0)


class SaleItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: float
    unit_price: float
    total_price: float
    product_name: Optional[str] = None

    class Config:
        from_attributes = True


class SaleCreate(BaseModel):
    contact_id: int
    sale_type_id: int
    notes: Optional[str] = None
    items: List[SaleItemCreate]


class SaleUpdate(BaseModel):
    contact_id: Optional[int] = None
    sale_type_id: Optional[int] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    items: Optional[List[SaleItemCreate]] = None


class SaleResponse(BaseModel):
    id: int
    contact_id: int
    sale_type_id: int
    total_amount: float
    status: str
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    contact_name: Optional[str] = None
    sale_type_name: Optional[str] = None
    items: List[SaleItemResponse] = []

    class Config:
        from_attributes = True
