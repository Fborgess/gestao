export const currencyToDigits = (str) => (str || '').toString().replace(/\D/g, '');

export const WEIGHT_ABBR = ['kg', 'g', 'mg', 'cg', 'dg', 'hg', 't', 'ton'];

export const isWeightUnit = (unit) => {
  const abbr = (unit?.abbreviation || '').toLowerCase().replace('.', '');
  const name = (unit?.name || '').toLowerCase();
  return WEIGHT_ABBR.includes(abbr) || /\b(quilo|grama|tonelada)\b/.test(name);
};

export const isWeightAbbr = (abbr) => {
  const a = String(abbr ?? '').toLowerCase().replace('.', '').trim();
  return WEIGHT_ABBR.includes(a);
};

export const unitDecimals = (unit) => (isWeightUnit(unit) ? 3 : 2);

export const qtyDecimals = (unit) => (typeof unit === 'object' && unit ? (isWeightUnit(unit) ? 3 : 0) : (isWeightAbbr(unit) ? 3 : 0));

export const qtyStep = (unit) => (qtyDecimals(unit) > 0 ? 0.001 : 1);

export const qtyMin = (unit) => (qtyDecimals(unit) > 0 ? 0.001 : 1);

export const roundQty = (v, unit) => {
  const n = parseFloat(String(v ?? '').replace(',', '.'));
  if (isNaN(n)) return 0;
  return qtyDecimals(unit) > 0 ? Math.round(n * 1000) / 1000 : Math.round(n);
};

export const parseQty = (v) => parseFloat(String(v ?? '').replace(',', '.')) || 0;

export function formatDigitsToCurrency(digits, decimals = 2) {
  if (!digits) return '';
  let d = String(digits);
  while (d.length <= decimals) d = '0' + d;
  const frac = d.slice(-decimals);
  const whole = (d.slice(0, -decimals).replace(/^0+/, '') || '0').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${whole},${frac}`;
}

export const parseCurrencyToNumber = (str, decimals = 2) => {
  const digits = currencyToDigits(str);
  return digits ? parseFloat(digits) / Math.pow(10, decimals) : 0;
};

export const formatNumberToCurrency = (num, decimals = 2) => {
  if (num == null || isNaN(num)) return '';
  return formatDigitsToCurrency(String(Math.round(Number(num) * Math.pow(10, decimals))), decimals);
};

export function maskDecimalInput(raw, maxDecimals = 2) {
  let out = '';
  let hasSep = false;
  for (const ch of String(raw ?? '')) {
    if (ch === ',' || ch === '.') {
      if (hasSep) continue;
      hasSep = true;
      out += ',';
    } else if (ch >= '0' && ch <= '9') {
      out += ch;
    }
  }
  const [whole, dec] = out.split(',');
  return dec !== undefined ? whole + ',' + dec.slice(0, maxDecimals) : out;
}

export const parseDecimal = (v) => parseFloat(String(v ?? '0').replace(',', '.')) || 0;

export const maskPercentInput = (raw) => maskDecimalInput(raw, 2);

export const parsePercent = (v) => parseDecimal(v);

export const formatValue = (num, decimals = 2) =>
  num == null ? '-' : Number(num).toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
