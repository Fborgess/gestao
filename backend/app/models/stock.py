from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class StockMovement(Base):
    __tablename__ = "stock_movements"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    deposit_id = Column(Integer, ForeignKey("deposits.id"), nullable=False)
    movement_type = Column(String(20), nullable=False)
    movement_date = Column(DateTime, nullable=False, server_default=func.now())
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, default=0)
    total_value = Column(Float, default=0)
    reason = Column(String(255))
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user_id = Column(Integer, ForeignKey("users.id"))

    product = relationship("Product", back_populates="stock_movements")
    deposit = relationship("Deposit")
