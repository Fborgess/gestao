from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.database import get_db
from app.models.sale import SaleType, Sale, SaleItem
from app.models.contact import Contact
from app.models.product import Product
from app.models.price_table import PriceTable
from app.schemas.sale import (
    SaleTypeCreate, SaleTypeUpdate, SaleTypeResponse,
    SaleCreate, SaleUpdate, SaleResponse, SaleItemResponse,
)
from app.utils.security import get_current_user, require_module
from app.utils.helpers import product_label


def _prod_label(p):
    return product_label(p)


def _sale_to_response(s: Sale) -> SaleResponse:
    items = [
        SaleItemResponse(
            id=it.id, product_id=it.product_id, quantity=it.quantity,
            unit_price=it.unit_price, total_price=it.total_price,
            product_name=_prod_label(it.product),
        )
        for it in s.items
    ]
    return SaleResponse(
        id=s.id, contact_id=s.contact_id, sale_type_id=s.sale_type_id,
        total_amount=s.total_amount, status=s.status, notes=s.notes,
        created_at=s.created_at, updated_at=s.updated_at,
        contact_name=s.contact.name if s.contact else None,
        sale_type_name=s.sale_type.name if s.sale_type else None,
        items=items,
    )


def _client_table_prices(db: Session, contact_id: int):
    contact = db.query(Contact).filter(Contact.id == contact_id).first()
    if not contact or not contact.price_table_id:
        return {}
    tbl = db.query(PriceTable).filter(
        PriceTable.id == contact.price_table_id,
        PriceTable.is_active == True,
    ).first()
    if not tbl:
        return {}
    return {it.product_id: it.price for it in tbl.items}


def _resolve_price(db: Session, contact_id: int, product_id: int, sent_price: float) -> float:
    table_prices = _client_table_prices(db, contact_id)
    if not table_prices:
        return sent_price
    if product_id in table_prices:
        return table_prices[product_id]
    product = db.query(Product).filter(Product.id == product_id).first()
    return product.price if product and product.price else sent_price


# ─── Sale Types ───

sale_type_router = APIRouter(prefix="/api/sale-types", tags=["Tipos de Lançamento"])


@sale_type_router.get("/", response_model=List[SaleTypeResponse])
def list_sale_types(
    db: Session = Depends(get_db),
    _=Depends(require_module("sale_types")),
):
    return db.query(SaleType).filter(SaleType.is_active == True).all()


@sale_type_router.post("/", response_model=SaleTypeResponse)
def create_sale_type(
    data: SaleTypeCreate,
    db: Session = Depends(get_db),
    _=Depends(require_module("sale_types", "edit")),
):
    st = SaleType(**data.model_dump())
    db.add(st)
    db.commit()
    db.refresh(st)
    return st


@sale_type_router.put("/{st_id}", response_model=SaleTypeResponse)
def update_sale_type(
    st_id: int,
    data: SaleTypeUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_module("sale_types", "edit")),
):
    st = db.query(SaleType).filter(SaleType.id == st_id).first()
    if not st:
        raise HTTPException(status_code=404, detail="Tipo de lançamento não encontrado")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(st, key, value)
    db.commit()
    db.refresh(st)
    return st


@sale_type_router.delete("/{st_id}")
def delete_sale_type(
    st_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_module("sale_types", "edit")),
):
    st = db.query(SaleType).filter(SaleType.id == st_id).first()
    if not st:
        raise HTTPException(status_code=404, detail="Tipo de lançamento não encontrado")
    st.is_active = False
    db.commit()
    return {"message": "Tipo de lançamento removido"}


# ─── Sales ───

sale_router = APIRouter(prefix="/api/sales", tags=["Lançamentos"])


@sale_router.get("/", response_model=List[SaleResponse])
def list_sales(
    db: Session = Depends(get_db),
    _=Depends(require_module("sales")),
):
    sales = (
        db.query(Sale)
        .options(joinedload(Sale.contact), joinedload(Sale.sale_type), joinedload(Sale.items).joinedload(SaleItem.product).joinedload(Product.unit))
        .order_by(Sale.created_at.desc())
        .all()
    )
    return [_sale_to_response(s) for s in sales]


@sale_router.get("/{sale_id}", response_model=SaleResponse)
def get_sale(
    sale_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_module("sales")),
):
    s = (
        db.query(Sale)
        .options(joinedload(Sale.contact), joinedload(Sale.sale_type), joinedload(Sale.items).joinedload(SaleItem.product).joinedload(Product.unit))
        .filter(Sale.id == sale_id)
        .first()
    )
    if not s:
        raise HTTPException(status_code=404, detail="Lançamento não encontrado")
    return _sale_to_response(s)


@sale_router.put("/{sale_id}", response_model=SaleResponse)
def update_sale(
    sale_id: int,
    data: SaleUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_module("sales", "edit")),
):
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Lançamento não encontrado")
    if data.contact_id is not None:
        contact = db.query(Contact).filter(Contact.id == data.contact_id).first()
        if not contact:
            raise HTTPException(status_code=400, detail="Cliente não encontrado")
        sale.contact_id = data.contact_id
    if data.sale_type_id is not None:
        sale.sale_type_id = data.sale_type_id
    if data.status is not None:
        sale.status = data.status
    if data.notes is not None:
        sale.notes = data.notes
    if data.items is not None:
        db.query(SaleItem).filter(SaleItem.sale_id == sale.id).delete()
        total = 0
        for it_data in data.items:
            product = db.query(Product).filter(Product.id == it_data.product_id).first()
            if not product:
                raise HTTPException(status_code=400, detail=f"Produto id={it_data.product_id} não encontrado")
            unit_price = _resolve_price(db, sale.contact_id, it_data.product_id, it_data.unit_price)
            total_price = round(it_data.quantity * unit_price, 2)
            total += total_price
            db.add(SaleItem(sale_id=sale.id, product_id=it_data.product_id,
                           quantity=it_data.quantity, unit_price=unit_price,
                           total_price=total_price))
        sale.total_amount = total
    db.commit()
    db.refresh(sale)
    result = (
        db.query(Sale)
        .options(joinedload(Sale.contact), joinedload(Sale.sale_type), joinedload(Sale.items).joinedload(SaleItem.product).joinedload(Product.unit))
        .filter(Sale.id == sale.id)
        .first()
    )
    return _sale_to_response(result)


@sale_router.post("/", response_model=SaleResponse)
def create_sale(
    data: SaleCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    _=Depends(require_module("sales", "edit")),
):
    contact = db.query(Contact).filter(Contact.id == data.contact_id).first()
    if not contact:
        raise HTTPException(status_code=400, detail="Cliente não encontrado")

    total = 0
    items = []
    for it_data in data.items:
        product = db.query(Product).filter(Product.id == it_data.product_id).first()
        if not product:
            raise HTTPException(status_code=400, detail=f"Produto id={it_data.product_id} não encontrado")
        unit_price = _resolve_price(db, data.contact_id, it_data.product_id, it_data.unit_price)
        total_price = round(it_data.quantity * unit_price, 2)
        total += total_price
        items.append(SaleItem(
            product_id=it_data.product_id,
            quantity=it_data.quantity,
            unit_price=unit_price,
            total_price=total_price,
        ))

    sale = Sale(
        contact_id=data.contact_id,
        sale_type_id=data.sale_type_id,
        total_amount=total,
        notes=data.notes,
        user_id=current_user.id,
        items=items,
    )
    db.add(sale)
    db.commit()
    db.refresh(sale)
    # Reload with relationships
    result = (
        db.query(Sale)
        .options(joinedload(Sale.contact), joinedload(Sale.sale_type), joinedload(Sale.items).joinedload(SaleItem.product).joinedload(Product.unit))
        .filter(Sale.id == sale.id)
        .first()
    )
    return _sale_to_response(result)
