from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class ContactCreate(BaseModel):
    name: str
    contact_type: str  # "cliente", "fornecedor" ou "both"
    cpf_cnpj: Optional[str] = None
    segment: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    cep: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    price_table_id: Optional[int] = None
    notes: Optional[str] = None


class ContactUpdate(BaseModel):
    name: Optional[str] = None
    contact_type: Optional[str] = None
    cpf_cnpj: Optional[str] = None
    segment: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    cep: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    price_table_id: Optional[int] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class ContactResponse(BaseModel):
    id: int
    name: str
    contact_type: str
    cpf_cnpj: Optional[str] = None
    segment: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    cep: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    price_table_id: Optional[int] = None
    notes: Optional[str] = None
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
