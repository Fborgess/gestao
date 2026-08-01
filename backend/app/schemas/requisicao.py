from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class RequisicaoItemCreate(BaseModel):
    product_id: int
    quantity_requested: float = Field(gt=0)
    unit_price: Optional[float] = None


class RequisicaoItemUpdate(BaseModel):
    product_id: Optional[int] = None
    quantity_requested: Optional[float] = None
    quantity_approved: Optional[float] = None
    unit_price: Optional[float] = None


class RequisicaoItemResponse(BaseModel):
    id: int
    requisicao_id: int
    product_id: int
    product_name: Optional[str] = None
    quantity_requested: float
    quantity_approved: Optional[float] = None
    quantity_fulfilled: float = 0
    quantity_received: float = 0
    unit_price: Optional[float] = None

    class Config:
        from_attributes = True


class RequisicaoCreate(BaseModel):
    deposit_requesting_id: int
    deposit_fulfilling_id: int
    reason: Optional[str] = None
    notes: Optional[str] = None
    items: List[RequisicaoItemCreate]


class RequisicaoUpdate(BaseModel):
    deposit_requesting_id: Optional[int] = None
    deposit_fulfilling_id: Optional[int] = None
    status: Optional[str] = None
    reason: Optional[str] = None
    notes: Optional[str] = None
    items: Optional[List[RequisicaoItemUpdate]] = None


class RequisicaoApprove(BaseModel):
    items: List[RequisicaoItemUpdate]


class RequisicaoItemFulfill(BaseModel):
    product_id: int
    quantity_fulfilled: float = Field(gt=0)


class RequisicaoFulfill(BaseModel):
    items: List[RequisicaoItemFulfill]


class RequisicaoItemReceive(BaseModel):
    product_id: int
    quantity_received: float = Field(gt=0)


class RequisicaoReceive(BaseModel):
    items: List[RequisicaoItemReceive]


class RequisicaoResponse(BaseModel):
    id: int
    requester_id: int
    requester_name: Optional[str] = None
    approver_id: Optional[int] = None
    approver_name: Optional[str] = None
    deposit_requesting_id: int
    deposit_requesting_name: Optional[str] = None
    deposit_fulfilling_id: int
    deposit_fulfilling_name: Optional[str] = None
    status: str
    reason: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    items: List[RequisicaoItemResponse] = []

    class Config:
        from_attributes = True
