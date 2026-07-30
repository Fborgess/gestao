export function formatCurrency(val) {
  const num = Number(val || 0);
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatNumber(val, decimals = 2) {
  const num = Number(val || 0);
  return num.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function formatPercent(val) {
  const num = Number(val || 0);
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';
}

export function getTodayLocal() {
  return new Date().toISOString().split('T')[0];
}
