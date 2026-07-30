from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    parent_id: Optional[int] = None


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    parent_id: Optional[int] = None


class CategoryResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    parent_id: Optional[int] = None
    created_at: Optional[datetime] = None
    subcategories: List["CategoryResponse"] = []

    class Config:
        from_attributes = True


class UnitResponse(BaseModel):
    id: int
    name: str
    abbreviation: str

    class Config:
        from_attributes = True


class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    sku: str
    barcode: Optional[str] = None
    price: Optional[float] = None
    cost_price: Optional[float] = None
    unit_id: Optional[int] = None
    category_id: Optional[int] = None
    deposit_id: Optional[int] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    sku: Optional[str] = None
    barcode: Optional[str] = None
    price: Optional[float] = None
    cost_price: Optional[float] = None
    unit_id: Optional[int] = None
    category_id: Optional[int] = None
    deposit_id: Optional[int] = None
    is_active: Optional[bool] = None


class ProductResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    sku: str
    barcode: Optional[str] = None
    price: Optional[float] = None
    cost_price: Optional[float] = None
    current_stock: int
    min_stock: int
    unit_id: Optional[int] = None
    category_id: Optional[int] = None
    deposit_id: Optional[int] = None
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    category: Optional[CategoryResponse] = None
    unit: Optional[UnitResponse] = None

    class Config:
        from_attributes = True


CategoryResponse.model_rebuild()
