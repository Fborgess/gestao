from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models.stock import StockMovement
from app.models.product import Product
from app.models.deposit import Deposit
from app.schemas.stock import (
    StockMovementCreate, StockMovementUpdate, StockMovementResponse,
    StockBalanceItem, StockMovementReportItem, StockTransferCreate, StockTransferItem,
    StockAvariaCreate, TransferReportItem,
)
from app.utils.security import get_current_user, require_module
from app.utils.helpers import product_label

router = APIRouter(prefix="/api/stock", tags=["Estoque"])


def recalculate_product_stock(db: Session, product_id: int):
    db.flush()
    entrada = db.query(func.coalesce(func.sum(StockMovement.quantity), 0)).filter(
        StockMovement.product_id == product_id,
        StockMovement.movement_type == "entrada",
    ).scalar()
    saida = db.query(func.coalesce(func.sum(StockMovement.quantity), 0)).filter(
        StockMovement.product_id == product_id,
        StockMovement.movement_type == "saida",
    ).scalar()
    product = db.query(Product).filter(Product.id == product_id).first()
    if product:
        product.current_stock = entrada - saida
        db.commit()


@router.get("/movements/", response_model=List[StockMovementResponse])
def list_movements(
    skip: int = 0,
    limit: int = 200,
    product_id: Optional[int] = None,
    deposit_id: Optional[int] = None,
    movement_type: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    _=Depends(require_module("stock_movements")),
):
    query = db.query(StockMovement)
    if deposit_id:
        query = query.filter(StockMovement.deposit_id == deposit_id)
    if product_id:
        query = query.filter(StockMovement.product_id == product_id)
    if movement_type:
        query = query.filter(StockMovement.movement_type == movement_type)
    if start_date:
        start = datetime.fromisoformat(start_date)
        query = query.filter(StockMovement.movement_date >= start)
    if end_date:
        end = datetime.fromisoformat(end_date + "T23:59:59")
        query = query.filter(StockMovement.movement_date <= end)
    return query.order_by(StockMovement.movement_date.desc()).offset(skip).limit(limit).all()


@router.post("/movements/", response_model=StockMovementResponse)
def create_movement(
    movement: StockMovementCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    _=Depends(require_module("stock_movements", "edit")),
):
    product = db.query(Product).filter(Product.id == movement.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    deposit = db.query(Deposit).filter(Deposit.id == movement.deposit_id).first()
    if not deposit:
        raise HTTPException(status_code=404, detail="Depósito não encontrado")

    if movement.movement_type == "saida" and not movement.reason:
        raise HTTPException(status_code=400, detail="Requisição de saída deve informar o motivo/destino")

    movement_date = None
    if movement.movement_date:
        movement_date = datetime.fromisoformat(movement.movement_date)
    else:
        movement_date = datetime.utcnow()

    total_value = movement.quantity * movement.unit_price
    db_movement = StockMovement(
        product_id=movement.product_id,
        deposit_id=movement.deposit_id,
        movement_type=movement.movement_type,
        movement_date=movement_date,
        quantity=movement.quantity,
        unit_price=movement.unit_price,
        total_value=total_value,
        reason=movement.reason,
        notes=movement.notes,
        user_id=current_user.id,
    )
    db.add(db_movement)
    db.commit()
    db.refresh(db_movement)
    recalculate_product_stock(db, movement.product_id)
    return db_movement


@router.put("/movements/{movement_id}", response_model=StockMovementResponse)
def update_movement(
    movement_id: int,
    movement: StockMovementUpdate,
    db: Session = Depends(get_db),
    _=Depends(require_module("stock_movements", "edit")),
):
    db_movement = db.query(StockMovement).filter(StockMovement.id == movement_id).first()
    if not db_movement:
        raise HTTPException(status_code=404, detail="Movimentação não encontrada")
    if db_movement.source == "requisicao":
        raise HTTPException(status_code=400, detail="Movimentação gerada por requisição não pode ser editada")

    data = movement.model_dump(exclude_unset=True)

    if "product_id" in data:
        product = db.query(Product).filter(Product.id == data["product_id"]).first()
        if not product:
            raise HTTPException(status_code=404, detail="Produto não encontrado")
    if "deposit_id" in data:
        deposit = db.query(Deposit).filter(Deposit.id == data["deposit_id"]).first()
        if not deposit:
            raise HTTPException(status_code=404, detail="Depósito não encontrado")

    old_product_id = db_movement.product_id

    for key, value in data.items():
        setattr(db_movement, key, value)

    if "movement_date" in data and data["movement_date"]:
        db_movement.movement_date = datetime.fromisoformat(data["movement_date"])

    if "quantity" in data or "unit_price" in data:
        qty = data.get("quantity", db_movement.quantity)
        price = data.get("unit_price", db_movement.unit_price)
        db_movement.total_value = qty * price

    db.commit()
    db.refresh(db_movement)
    recalculate_product_stock(db, old_product_id)
    if "product_id" in data and data["product_id"] != old_product_id:
        recalculate_product_stock(db, data["product_id"])
    return db_movement


@router.delete("/movements/{movement_id}")
def delete_movement(
    movement_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_module("stock_movements", "edit")),
):
    db_movement = db.query(StockMovement).filter(StockMovement.id == movement_id).first()
    if not db_movement:
        raise HTTPException(status_code=404, detail="Movimentação não encontrada")
    if db_movement.source == "requisicao":
        raise HTTPException(status_code=400, detail="Movimentação gerada por requisição não pode ser excluída")
    product_id = db_movement.product_id
    db.delete(db_movement)
    db.commit()
    recalculate_product_stock(db, product_id)
    return {"message": "Movimentação removida"}


@router.get("/balance/", response_model=List[StockBalanceItem])
def stock_balance(
    deposit_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    _=Depends(require_module("stock_reports")),
):
    query = (
        db.query(StockMovement, Product.cost_price, Product.price)
        .join(Product, Product.id == StockMovement.product_id)
    )

    if deposit_id:
        query = query.filter(StockMovement.deposit_id == deposit_id)
    if start_date:
        start = datetime.fromisoformat(start_date)
        query = query.filter(StockMovement.movement_date >= start)
    if end_date:
        end = datetime.fromisoformat(end_date + "T23:59:59")
        query = query.filter(StockMovement.movement_date <= end)

    rows = query.all()

    products = {}
    for movement, cost_price, product_price in rows:
        pid = movement.product_id
        if pid not in products:
            products[pid] = {
                "product_id": pid,
                "product_name": product_label(movement.product),
                "quantity_entries": 0,
                "quantity_exits": 0,
                "total_value_entries": 0.0,
                "total_value_exits": 0.0,
            }

        p = products[pid]

        if movement.movement_type == "entrada":
            p["quantity_entries"] += movement.quantity
            effective_price = movement.unit_price
            if not effective_price or effective_price == 0:
                effective_price = cost_price or product_price or 0
            p["total_value_entries"] += movement.quantity * effective_price
        else:
            p["quantity_exits"] += movement.quantity
            p["total_value_exits"] += movement.total_value or 0

    sorted_products = sorted(products.values(), key=lambda x: x["product_name"])

    return [
        StockBalanceItem(
            product_id=p["product_id"],
            product_name=p["product_name"],
            quantity_entries=p["quantity_entries"],
            quantity_exits=p["quantity_exits"],
            balance=p["quantity_entries"] - p["quantity_exits"],
            total_value_entries=p["total_value_entries"],
            total_value_exits=p["total_value_exits"],
        )
        for p in sorted_products
    ]


@router.get("/report/", response_model=List[StockMovementReportItem])
def stock_movement_report(
    deposit_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    _=Depends(require_module("stock_reports")),
):
    query = (
        db.query(StockMovement, Product.cost_price, Product.price)
        .join(Product, Product.id == StockMovement.product_id)
        .join(Deposit, Deposit.id == StockMovement.deposit_id)
    )
    if deposit_id:
        query = query.filter(StockMovement.deposit_id == deposit_id)
    if start_date:
        start = datetime.fromisoformat(start_date)
        query = query.filter(StockMovement.movement_date >= start)
    if end_date:
        end = datetime.fromisoformat(end_date + "T23:59:59")
        query = query.filter(StockMovement.movement_date <= end)

    rows = query.order_by(StockMovement.movement_date.desc()).all()

    return [
        StockMovementReportItem(
            id=m.id,
            product_id=m.product_id,
            product_name=product_label(m.product),
            deposit_id=m.deposit_id,
            deposit_name=m.deposit.name,
            movement_type=m.movement_type,
            movement_date=m.movement_date,
            quantity=m.quantity,
            unit_price=m.unit_price if (m.unit_price and m.unit_price > 0) else (cost_price or product_price or 0),
            total_value=m.total_value if (m.unit_price and m.unit_price > 0) else (m.quantity * (cost_price or product_price or 0)),
            reason=m.reason,
            created_at=m.created_at,
        )
        for m, cost_price, product_price in rows
    ]


@router.post("/transfer")
def transfer_stock(
    data: StockTransferCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    _=Depends(require_module("stock_movements", "edit")),
):
    if data.source_deposit_id == data.destination_deposit_id:
        raise HTTPException(400, "Depósitos de origem e destino devem ser diferentes")
    src = db.query(Deposit).filter(Deposit.id == data.source_deposit_id).first()
    if not src:
        raise HTTPException(404, "Depósito de origem não encontrado")
    dst = db.query(Deposit).filter(Deposit.id == data.destination_deposit_id).first()
    if not dst:
        raise HTTPException(404, "Depósito de destino não encontrado")
    if data.transfer_type not in ("abastecimento", "devolucao"):
        raise HTTPException(400, "Tipo deve ser 'abastecimento' ou 'devolucao'")

    type_label = "Abastecimento" if data.transfer_type == "abastecimento" else "Devolução"
    for it in data.items:
        product = db.query(Product).filter(Product.id == it.product_id).first()
        if not product:
            raise HTTPException(404, f"Produto {it.product_id} não encontrado")
        if it.quantity <= 0:
            raise HTTPException(400, f"Quantidade inválida para produto {it.product_id}")

        unit_price = it.unit_price or product.cost_price or product.price or 0

        # Saída da origem
        mov_out = StockMovement(
            product_id=it.product_id,
            deposit_id=data.source_deposit_id,
            movement_type="saida",
            quantity=it.quantity,
            unit_price=unit_price,
            total_value=it.quantity * unit_price,
            reason=f"Transferência: {type_label} → {dst.name}",
            user_id=current_user.id,
        )
        db.add(mov_out)

        # Entrada no destino
        mov_in = StockMovement(
            product_id=it.product_id,
            deposit_id=data.destination_deposit_id,
            movement_type="entrada",
            quantity=it.quantity,
            unit_price=unit_price,
            total_value=it.quantity * unit_price,
            reason=f"Transferência: {type_label} ← {src.name}",
            user_id=current_user.id,
        )
        db.add(mov_in)

        recalculate_product_stock(db, it.product_id)

    db.commit()
    return {"message": f"{type_label} realizado com sucesso", "items_count": len(data.items)}


@router.post("/avaria")
def register_avaria(
    data: StockAvariaCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
    _=Depends(require_module("stock_movements", "edit")),
):
    deposit = db.query(Deposit).filter(Deposit.id == data.deposit_id).first()
    if not deposit:
        raise HTTPException(404, "Depósito não encontrado")
    if not data.items:
        raise HTTPException(400, "Adicione pelo menos um item")

    # Build set of deposit IDs for stock validation (deposit + parent, or parent + children)
    validate_ids = {data.deposit_id}
    if deposit.parent_id:
        validate_ids.add(deposit.parent_id)
    else:
        for c in deposit.children:
            validate_ids.add(c.id)

    for it in data.items:
        product = db.query(Product).filter(Product.id == it.product_id).first()
        if not product:
            raise HTTPException(404, f"Produto {it.product_id} não encontrado")
        if it.quantity <= 0:
            raise HTTPException(400, f"Quantidade inválida para produto {it.product_id}")

        # Validate stock: sum of entradas - saidas across related deposits
        entrada = db.query(func.coalesce(func.sum(StockMovement.quantity), 0)).filter(
            StockMovement.product_id == it.product_id,
            StockMovement.deposit_id.in_(validate_ids),
            StockMovement.movement_type == "entrada",
        ).scalar()
        saida = db.query(func.coalesce(func.sum(StockMovement.quantity), 0)).filter(
            StockMovement.product_id == it.product_id,
            StockMovement.deposit_id.in_(validate_ids),
            StockMovement.movement_type == "saida",
        ).scalar()
        available = entrada - saida
        if it.quantity > available:
            raise HTTPException(400, f"Avariado para '{product.name}' ({it.quantity} und) excede o estoque disponível ({available} und)")

        unit_price = it.unit_price or product.cost_price or product.price or 0
        mov = StockMovement(
            product_id=it.product_id,
            deposit_id=data.deposit_id,
            movement_type="saida",
            quantity=it.quantity,
            unit_price=unit_price,
            total_value=it.quantity * unit_price,
            reason=f"Avaria: {data.description}",
            user_id=current_user.id,
        )
        db.add(mov)
        recalculate_product_stock(db, it.product_id)

    db.commit()
    return {"message": "Avaria registrada com sucesso", "items_count": len(data.items)}


@router.get("/avarias/", response_model=List[StockMovementResponse])
def list_avarias(
    deposit_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    _=Depends(require_module("stock_movements")),
):
    query = db.query(StockMovement).filter(
        StockMovement.movement_type == "saida",
        StockMovement.reason.like("Avaria:%"),
    )
    if deposit_id:
        query = query.filter(StockMovement.deposit_id == deposit_id)
    if start_date:
        start = datetime.fromisoformat(start_date)
        query = query.filter(StockMovement.movement_date >= start)
    if end_date:
        end = datetime.fromisoformat(end_date + "T23:59:59")
        query = query.filter(StockMovement.movement_date <= end)
    return query.order_by(StockMovement.movement_date.desc()).all()


@router.get("/transfer-report/", response_model=List[TransferReportItem])
def transfer_report(
    deposit_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    _=Depends(require_module("stock_reports")),
):
    """
    Relatório de abastecimento vs devolução vs avarias vs vendas por sub-depósito.
    Venda = abastecimento - devolução - avaria.
    """
    # Get all sub-deposits (deposits with parent_id)
    query = db.query(Deposit).filter(Deposit.is_active == True, Deposit.parent_id.isnot(None))
    if deposit_id:
        query = query.filter(
            (Deposit.id == deposit_id) | (Deposit.parent_id == deposit_id)
        )
    sub_deposits = query.all()

    result = []

    for sub in sub_deposits:
        parent = db.query(Deposit).filter(Deposit.id == sub.parent_id).first()
        parent_name = parent.name if parent else "?"

        # Abastecimento: entradas no sub-depósito com reason contendo "Abastecimento"
        query_in = db.query(
            StockMovement.product_id,
            func.sum(StockMovement.quantity).label("total_qty"),
            func.avg(StockMovement.unit_price).label("avg_price"),
        ).filter(
            StockMovement.deposit_id == sub.id,
            StockMovement.movement_type == "entrada",
            StockMovement.reason.like(f"%Abastecimento%{parent_name}%"),
        )
        if start_date:
            query_in = query_in.filter(StockMovement.movement_date >= datetime.fromisoformat(start_date))
        if end_date:
            query_in = query_in.filter(StockMovement.movement_date <= datetime.fromisoformat(end_date + "T23:59:59"))
        abastecimento_data = {r.product_id: r for r in query_in.group_by(StockMovement.product_id).all()}

        # Devolução: saídas do sub-depósito com reason contendo "Devolução"
        query_out = db.query(
            StockMovement.product_id,
            func.sum(StockMovement.quantity).label("total_qty"),
            func.avg(StockMovement.unit_price).label("avg_price"),
        ).filter(
            StockMovement.deposit_id == sub.id,
            StockMovement.movement_type == "saida",
            StockMovement.reason.like(f"%Devolução%"),
        )
        if start_date:
            query_out = query_out.filter(StockMovement.movement_date >= datetime.fromisoformat(start_date))
        if end_date:
            query_out = query_out.filter(StockMovement.movement_date <= datetime.fromisoformat(end_date + "T23:59:59"))
        devolucao_data = {r.product_id: r for r in query_out.group_by(StockMovement.product_id).all()}

        # Avarias: saídas do sub-depósito com reason contendo "Avaria"
        query_av = db.query(
            StockMovement.product_id,
            func.sum(StockMovement.quantity).label("total_qty"),
        ).filter(
            StockMovement.deposit_id == sub.id,
            StockMovement.movement_type == "saida",
            StockMovement.reason.like(f"Avaria:%"),
        )
        if start_date:
            query_av = query_av.filter(StockMovement.movement_date >= datetime.fromisoformat(start_date))
        if end_date:
            query_av = query_av.filter(StockMovement.movement_date <= datetime.fromisoformat(end_date + "T23:59:59"))
        avaria_data = {r.product_id: r.total_qty for r in query_av.group_by(StockMovement.product_id).all()}

        all_product_ids = set(abastecimento_data.keys()) | set(devolucao_data.keys()) | set(avaria_data.keys())

        for pid in sorted(all_product_ids):
            product = db.query(Product).filter(Product.id == pid).first()
            pname = product_label(product) or f"Produto #{pid}"
            ab_qty = abastecimento_data[pid].total_qty if pid in abastecimento_data else 0
            dev_qty = devolucao_data[pid].total_qty if pid in devolucao_data else 0
            av_qty = avaria_data.get(pid, 0)
            venda_qty = ab_qty - dev_qty - av_qty
            avg_price = abastecimento_data[pid].avg_price if pid in abastecimento_data else (devolucao_data[pid].avg_price if pid in devolucao_data else 0)

            if ab_qty == 0 and dev_qty == 0 and av_qty == 0:
                continue

            result.append(TransferReportItem(
                deposit_id=sub.id,
                deposit_name=sub.name,
                product_id=pid,
                product_name=pname,
                abastecimento_qty=ab_qty,
                devolucao_qty=dev_qty,
                avaria_qty=av_qty,
                venda_qty=max(0, venda_qty),
                unit_price=avg_price or 0,
                venda_total=max(0, venda_qty) * (avg_price or 0),
            ))

    return result
