import { useState, useEffect, useMemo, useRef } from 'react';
import api from '../services/api';
import { Calculator, Save, Trash2, Package, Percent, Edit, Tag } from 'lucide-react';

const PERCENT_FIELDS = ['avarias_pct', 'comissao_pct', 'frete_pct', 'outros_custos_pct', 'recursos_humanos_pct', 'taxa_cartao_pct', 'taxas_antecipacao_pct', 'margem_alvo', 'impostos_pct'];

const PERCENT_LABELS = {
  avarias_pct: 'Avarias', comissao_pct: 'Comissão', frete_pct: 'Frete',
  outros_custos_pct: 'Outros custos', recursos_humanos_pct: 'Recursos humanos',
  taxa_cartao_pct: 'Taxa cartão crédito', taxas_antecipacao_pct: 'Taxas antecipação/cartão',
  margem_alvo: 'Margem de Lucro Alvo', impostos_pct: 'Impostos',
};

const DEFAULTS = {
  acquisition_price: '',
  lote: 1,
  avarias_pct: 6, comissao_pct: 0, frete_pct: 5, outros_custos_pct: 0,
  recursos_humanos_pct: 5, taxa_cartao_pct: 0, taxas_antecipacao_pct: 0,
  margem_alvo: 20, impostos_pct: 6,
};

const fmtMoney = (n) => n == null ? '-' : Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPct = (n) => n == null ? '-' : (Number(n) * 100).toFixed(2).replace('.', ',') + '%';

function toPayload(f) {
  const p = { acquisition_price: parseFloat(f.acquisition_price) || 0, lote: parseFloat(f.lote) || 1 };
  PERCENT_FIELDS.forEach(k => { p[k] = (parseFloat(f[k]) || 0) / 100; });
  return p;
}

function fromConfig(obj) {
  const f = { ...DEFAULTS };
  PERCENT_FIELDS.forEach(k => {
    if (obj && obj[k] !== undefined && obj[k] !== null) f[k] = Math.round(obj[k] * 10000) / 100;
  });
  if (obj) {
    if (obj.acquisition_price !== undefined && obj.acquisition_price !== null) f.acquisition_price = obj.acquisition_price;
    if (obj.lote !== undefined && obj.lote !== null) f.lote = obj.lote;
  }
  return f;
}

export default function Pricing() {
  const [products, setProducts] = useState([]);
  const [pricings, setPricings] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [form, setForm] = useState({ ...DEFAULTS });
  const [result, setResult] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const timer = useRef(null);

  const loadPricings = () => api.get('/pricing/').then(res => setPricings(res.data)).catch(() => {});
  useEffect(() => {
    api.get('/products/').then(res => setProducts(res.data)).catch(() => {});
    loadPricings();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter(p => (p.display_name || p.name).toLowerCase().includes(q));
  }, [products, search]);

  const selected = useMemo(() => products.find(p => String(p.id) === String(selectedProductId)) || null, [products, selectedProductId]);

  const handleSelect = (e) => {
    const pid = e.target.value;
    setSelectedProductId(pid);
    const config = pricings.find(p => String(p.product_id) === String(pid));
    const prod = products.find(p => String(p.id) === String(pid));
    if (config) {
      setForm(fromConfig(config));
    } else {
      const f = { ...DEFAULTS };
      if (prod && (prod.cost_price != null || prod.price != null)) f.acquisition_price = prod.cost_price ?? prod.price ?? '';
      setForm(f);
    }
    setResult(null);
    setMsg(null);
  };

  useEffect(() => {
    if (!selectedProductId) return;
    setCalcLoading(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        const payload = toPayload(form);
        payload.product_id = parseInt(selectedProductId, 10);
        const res = await api.post('/pricing/calculate', payload);
        setResult(res.data);
      } catch (e) { setResult(null); }
      finally { setCalcLoading(false); }
    }, 300);
    return () => clearTimeout(timer.current);
  }, [form, selectedProductId]);

  const handleSave = async () => {
    if (!selectedProductId) { alert('Selecione um produto'); return; }
    try {
      const payload = toPayload(form);
      payload.product_id = parseInt(selectedProductId, 10);
      await api.post('/pricing/', payload);
      loadPricings();
      setMsg('Precificação salva.');
    } catch (err) { alert(err.response?.data?.detail || 'Erro ao salvar'); }
  };

  const handleDelete = async (pid) => {
    if (!confirm('Remover esta precificação?')) return;
    try { await api.delete(`/pricing/${pid}`); loadPricings(); } catch (err) { alert(err.response?.data?.detail || 'Erro ao remover'); }
  };

  const handleEdit = (p) => {
    setSelectedProductId(String(p.product_id));
    setSearch(p.display_name || p.product_name || '');
    setForm(fromConfig(p));
    setResult(null);
    setMsg(null);
  };

  const setNum = (k) => (e) => {
    const v = e.target.value;
    if (v === '') { setForm(f => ({ ...f, [k]: '' })); return; }
    const n = Number(v);
    if (!isNaN(n)) setForm(f => ({ ...f, [k]: n }));
  };

  const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm';
  const labelCls = 'block text-xs font-medium text-gray-500 mb-1';

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Calculator size={28} className="text-blue-600" />
        <h1 className="text-2xl font-bold">Precificação de Produtos</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex items-end gap-3 flex-wrap">
          <div className="flex-1 min-w-[220px]">
            <label className={labelCls}>Produto</label>
            <input placeholder="Buscar produto..." value={search} onChange={e => setSearch(e.target.value)}
              className={inputCls} />
          </div>
          <div className="flex-1 min-w-[220px]">
            <label className={labelCls}>Selecionar produto</label>
            <select value={selectedProductId} onChange={handleSelect} className={inputCls}>
              <option value="">Selecione...</option>
              {filtered.map(p => <option key={p.id} value={p.id}>{p.display_name || p.name}</option>)}
            </select>
          </div>
        </div>
        {selected && (
          <div className="mt-3 text-sm text-gray-500 flex gap-4 flex-wrap">
            <span className="flex items-center gap-1"><Package size={14} className="text-gray-400" /> {selected.display_name || selected.name}</span>
            {selected.cost_price != null && <span>Preço de custo: <b>R$ {fmtMoney(selected.cost_price)}</b></span>}
            {selected.price != null && <span>Preço atual: <b>R$ {fmtMoney(selected.price)}</b></span>}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Tag size={16} className="text-blue-600" /> Custos Diretos & Deduções Variáveis</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Preço de Aquisição / Matéria-Prima (R$)</label>
              <input type="number" step="0.01" min="0" value={form.acquisition_price} onChange={setNum('acquisition_price')} className={inputCls} placeholder="0,00" />
            </div>
            <div>
              <label className={labelCls}>Lote (quantidade)</label>
              <input type="number" step="1" min="1" value={form.lote} onChange={setNum('lote')} className={inputCls} />
            </div>
            {PERCENT_FIELDS.slice(0, 7).map(k => (
              <div key={k}>
                <label className={labelCls}>{PERCENT_LABELS[k]} (%)</label>
                <div className="relative">
                  <input type="number" step="0.1" min="0" value={form[k]} onChange={setNum(k)} className={inputCls + ' pr-7'} />
                  <Percent size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Percent size={16} className="text-blue-600" /> Estratégia de Margem & Impostos</h3>
            <div className="grid grid-cols-2 gap-3">
              {PERCENT_FIELDS.slice(7).map(k => (
                <div key={k}>
                  <label className={labelCls}>{PERCENT_LABELS[k]} (%)</label>
                  <div className="relative">
                    <input type="number" step="0.1" min="0" value={form[k]} onChange={setNum(k)} className={inputCls + ' pr-7'} />
                    <Percent size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Calculator size={16} className="text-green-600" /> Preço de Venda Final</h3>
            {calcLoading ? (
              <p className="text-sm text-gray-400">Calculando...</p>
            ) : result ? (
              <div className="text-3xl font-bold text-green-600 mb-4">R$ {fmtMoney(result.preco_venda)}</div>
            ) : (
              <p className="text-sm text-gray-400">Selecione um produto para calcular.</p>
            )}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Custo unitário</span><span className="font-medium">R$ {fmtMoney(result?.custo_unitario)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">% deduções variáveis</span><span className="font-medium">{fmtPct(result?.total_deducoes_pct)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Custos variáveis</span><span className="font-medium">R$ {fmtMoney(result?.custos_variaveis)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Total custos</span><span className="font-medium">R$ {fmtMoney(result?.total_custos)}</span></div>
            </div>
            {result && (
              <div className="mt-4 border-t pt-3 text-sm">
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Confronto</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex justify-between"><span className="text-gray-500">(-) Custos diretos</span><span className="font-medium">R$ {fmtMoney(result.custos_diretos)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">(-) Despesas variáveis</span><span className="font-medium">R$ {fmtMoney(result.despesas_variaveis)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">(-) Impostos</span><span className="font-medium">R$ {fmtMoney(result.impostos_rs)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">(-) Total custos</span><span className="font-medium">R$ {fmtMoney(result.total_custos_rs)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500 font-medium">(=) Margem R$</span><span className="font-bold text-green-600">R$ {fmtMoney(result.margem_rs)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500 font-medium">(=) % Margem</span><span className="font-bold text-green-600">{fmtPct(result.margem_pct)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Markup multiplicador</span><span className="font-medium">{result.markup_multiplicador.toFixed(2).replace('.', ',')}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Markup resultado</span><span className="font-medium">R$ {fmtMoney(result.markup_resultado)}</span></div>
                </div>
              </div>
            )}
            <div className="flex gap-2 mt-4">
              <button onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2">
                <Save size={16} /> Salvar Precificação
              </button>
            </div>
            {msg && <p className="mt-3 text-sm text-green-600">{msg}</p>}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 font-semibold text-sm">Precificações Salvas</div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Produto</th>
              <th className="text-right p-3">Aquisição</th>
              <th className="text-center p-3">Lote</th>
              <th className="text-center p-3">Margem Alvo</th>
              <th className="text-right p-3">Preço aplicado</th>
              <th className="text-center p-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {pricings.map(p => (
              <tr key={p.id} className="border-t hover:bg-gray-50">
                <td className="p-3 font-medium">{p.display_name || p.product_name}</td>
                <td className="p-3 text-right">R$ {fmtMoney(p.acquisition_price)}</td>
                <td className="p-3 text-center">{p.lote}</td>
                <td className="p-3 text-center">{fmtPct(p.margem_alvo)}</td>
                <td className="p-3 text-right">{p.price != null ? `R$ ${fmtMoney(p.price)}` : '-'}</td>
                <td className="p-3 text-center">
                  <button onClick={() => handleEdit(p)} className="text-blue-600 hover:text-blue-800 mr-2" title="Editar"><Edit size={16} /></button>
                  <button onClick={() => handleDelete(p.product_id)} className="text-red-600 hover:text-red-800" title="Remover"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {pricings.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-gray-400">Nenhuma precificação salva</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
