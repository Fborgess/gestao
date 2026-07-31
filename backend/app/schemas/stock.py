from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class StockMovementCreate(BaseModel):
    product_id: int
    deposit_id: int
    movement_type: str
    movement_date: Optional[str] = None
    quantity: int
    unit_price: Optional[float] = 0
    reason: Optional[str] = None
    notes: Optional[str] = None


class StockMovementUpdate(BaseModel):
    product_id: Optional[int] = None
    deposit_id: Optional[int] = None
    movement_type: Optional[str] = None
    movement_date: Optional[str] = None
    quantity: Optional[int] = None
    unit_price: Optional[float] = None
    reason: Optional[str] = None
    notes: Optional[str] = None


class StockMovementResponse(BaseModel):
    id: int
    product_id: int
    deposit_id: int
    movement_type: str
    movement_date: Optional[datetime] = None
    quantity: int
    unit_price: float
    total_value: float
    reason: Optional[str] = None
    notes: Optional[str] = None
    source: Optional[str] = None
    created_at: Optional[datetime] = None
    user_id: Optional[int] = None

    class Config:
        from_attributes = True


class StockTransferItem(BaseModel):
    product_id: int
    quantity: int
    unit_price: Optional[float] = 0


class StockTransferCreate(BaseModel):
    source_deposit_id: int
    destination_deposit_id: int
    transfer_type: str  # "abastecimento" or "devolucao"
    items: List[StockTransferItem]


class StockAvariaCreate(BaseModel):
    deposit_id: int
    items: List[StockTransferItem]
    description: str


class StockBalanceItem(BaseModel):
    product_id: int
    product_name: str
    quantity_entries: int
    quantity_exits: int
    balance: int
    total_value_entries: float
    total_value_exits: float


class StockMovementReportItem(BaseModel):
    id: int
    product_id: int
    product_name: str
    deposit_id: int
    deposit_name: str
    movement_type: str
    movement_date: Optional[datetime] = None
    quantity: int
    unit_price: float
    total_value: float
    reason: Optional[str] = None
    created_at: Optional[datetime] = None


class TransferReportItem(BaseModel):
    deposit_id: int
    deposit_name: str
    product_id: int
    product_name: str
    abastecimento_qty: int
    devolucao_qty: int
    avaria_qty: int
    venda_qty: int
    unit_price: float
    venda_total: float
