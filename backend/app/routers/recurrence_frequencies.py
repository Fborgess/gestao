from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.recurrence_frequency import RecurrenceFrequency
from app.schemas.recurrence_frequency import (
    RecurrenceFrequencyCreate,
    RecurrenceFrequencyUpdate,
    RecurrenceFrequencyResponse,
)
from app.utils.security import get_current_user

router = APIRouter(prefix="/api/recurrence-frequencies", tags=["Frequências de Recorrência"])


@router.get("/", response_model=List[RecurrenceFrequencyResponse])
def list_frequencies(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return db.query(RecurrenceFrequency).order_by(RecurrenceFrequency.days_interval).all()


@router.get("/active", response_model=List[RecurrenceFrequencyResponse])
def list_active_frequencies(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return db.query(RecurrenceFrequency).filter(RecurrenceFrequency.is_active == True).order_by(RecurrenceFrequency.days_interval).all()


@router.post("/", response_model=RecurrenceFrequencyResponse)
def create_frequency(
    frequency: RecurrenceFrequencyCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    existing = db.query(RecurrenceFrequency).filter(RecurrenceFrequency.name == frequency.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Frequência já cadastrada")
    db_freq = RecurrenceFrequency(**frequency.model_dump())
    db.add(db_freq)
    db.commit()
    db.refresh(db_freq)
    return db_freq


@router.put("/{frequency_id}", response_model=RecurrenceFrequencyResponse)
def update_frequency(
    frequency_id: int,
    frequency: RecurrenceFrequencyUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    db_freq = db.query(RecurrenceFrequency).filter(RecurrenceFrequency.id == frequency_id).first()
    if not db_freq:
        raise HTTPException(status_code=404, detail="Frequência não encontrada")
    for key, value in frequency.model_dump(exclude_unset=True).items():
        setattr(db_freq, key, value)
    db.commit()
    db.refresh(db_freq)
    return db_freq


@router.delete("/{frequency_id}")
def delete_frequency(
    frequency_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    db_freq = db.query(RecurrenceFrequency).filter(RecurrenceFrequency.id == frequency_id).first()
    if not db_freq:
        raise HTTPException(status_code=404, detail="Frequência não encontrada")
    db_freq.is_active = False
    db.commit()
    return {"message": "Frequência removida"}
