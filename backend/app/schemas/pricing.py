from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class PricingInput(BaseModel):
    product_id: Optional[int] = None
    acquisition_price: float = Field(default=0, ge=0)
    lote: float = Field(default=1, gt=0)
    avarias_pct: float = Field(default=0.06, ge=0)
    comissao_pct: float = Field(default=0, ge=0)
    frete_pct: float = Field(default=0.05, ge=0)
    outros_custos_pct: float = Field(default=0, ge=0)
    recursos_humanos_pct: float = Field(default=0.05, ge=0)
    taxa_cartao_pct: float = Field(default=0, ge=0)
    taxas_antecipacao_pct: float = Field(default=0, ge=0)
    margem_alvo: float = Field(default=0.20, ge=0)
    impostos_pct: float = Field(default=0.06, ge=0)


class PricingResult(BaseModel):
    custo_unitario: float
    total_deducoes_pct: float
    custos_variaveis: float
    total_custos: float
    preco_venda: float
    custos_diretos: float
    despesas_variaveis: float
    impostos_rs: float
    total_custos_rs: float
    margem_rs: float
    margem_pct: float
    markup_multiplicador: float
    markup_resultado: float


class PricingResponse(PricingInput):
    id: int
    product_name: Optional[str] = None
    display_name: Optional[str] = None
    cost_price: Optional[float] = None
    price: Optional[float] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class ApplyResult(BaseModel):
    result: PricingResult
    product: Optional[dict] = None
