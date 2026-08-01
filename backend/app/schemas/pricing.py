from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class PricingInput(BaseModel):
    product_id: Optional[int] = None
    acquisition_price: float = 0
    lote: float = 1
    avarias_pct: float = 0.06
    comissao_pct: float = 0
    frete_pct: float = 0.05
    outros_custos_pct: float = 0
    recursos_humanos_pct: float = 0.05
    taxa_cartao_pct: float = 0
    taxas_antecipacao_pct: float = 0
    margem_alvo: float = 0.20
    impostos_pct: float = 0.06


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
