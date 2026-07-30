from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class FinancialCategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    type: str  # "receita" ou "despesa"
    parent_id: Optional[int] = None


class FinancialCategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None
    parent_id: Optional[int] = None


class FinancialCategoryResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    type: str
    parent_id: Optional[int] = None
    is_active: bool
    created_at: Optional[datetime] = None
    subcategories: List["FinancialCategoryResponse"] = []

    class Config:
        from_attributes = True


FinancialCategoryResponse.model_rebuild()
