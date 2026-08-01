import { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { Plus, Edit, Trash2, Search, Upload } from 'lucide-react';
import SearchableSelect from '../components/SearchableSelect';
import SortableHeader from '../components/SortableHeader';
import ImportExcelModal from '../components/ImportExcelModal';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formError, setFormError] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [showImport, setShowImport] = useState(false);
  const [form, setForm] = useState({
    name: '', sku: '', description: '', price: '', cost_price: '', markup: '',
    unit_id: '', category_id: '', subcategory_id: '', barcode: '', deposit_id: '',
  });
  const [lastEdited, setLastEdited] = useState('markup');

  const parentCategories = allCategories.filter(c => !c.parent_id);
  const subcategories = form.category_id
    ? allCategories.filter(c => c.parent_id === parseInt(form.category_id))
    : [];

  const loadProducts = () => {
    const params = search ? { search } : {};
    api.get('/products/', { params }).then(res => setProducts(res.data)).catch(() => {});
  };

  useEffect(() => {
    api.get('/categories/all').then(res => setAllCategories(res.data)).catch(() => {});
    api.get('/units/').then(res => setUnits(res.data)).catch(() => {});
  }, []);

  useEffect(() => { loadProducts(); }, [search]);

  const sortedProducts = useMemo(() => {
    const arr = [...products];
    arr.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      if (aVal == null) aVal = '';
      if (bVal == null) bVal = '';
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [products, sortConfig]);

  const handleSort = (key, direction) => setSortConfig({ key, direction });

  const round2 = (n) => Math.round(n * 100) / 100;
  const round4 = (n) => Math.round(n * 10000) / 10000;

  const handlePriceChange = (v) => {
    const cost = parseFloat(form.cost_price);
    setForm({
      ...form, price: v,
      markup: cost > 0 && parseFloat(v) > 0 ? String(round4(parseFloat(v) / cost)) : form.markup,
    });
    setLastEdited('price');
  };

  const handleMarkupChange = (v) => {
    const cost = parseFloat(form.cost_price);
    setForm({
      ...form, markup: v,
      price: cost > 0 && parseFloat(v) > 0 ? String(round2(cost * parseFloat(v))) : form.price,
    });
    setLastEdited('markup');
  };

  const handleCostChange = (v) => {
    const cost = parseFloat(v);
    const f = { ...form, cost_price: v };
    if (cost > 0) {
      const markup = parseFloat(f.markup);
      const price = parseFloat(f.price);
      if (lastEdited === 'markup' && markup > 0) {
        f.price = String(round2(cost * markup));
      } else if (lastEdited === 'price' && price > 0) {
        f.markup = String(round4(price / cost));
      } else if (markup > 0) {
        f.price = String(round2(cost * markup));
      } else if (price > 0) {
        f.markup = String(round4(price / cost));
      }
    }
    setForm(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    const data = {
      name: form.name, sku: form.sku, description: form.description || null,
      barcode: form.barcode || null, price: form.price ? parseFloat(form.price) : null,
      cost_price: form.cost_price ? parseFloat(form.cost_price) : null,
      markup: form.markup ? parseFloat(form.markup) : null,
      unit_id: form.unit_id ? parseInt(form.unit_id) : null,
      category_id: form.subcategory_id ? parseInt(form.subcategory_id) : (form.category_id ? parseInt(form.category_id) : null),
      deposit_id: form.deposit_id ? parseInt(form.deposit_id) : null,
    };
    try {
      if (editingProduct) { await api.put(`/products/${editingProduct.id}`, data); }
      else { await api.post('/products/', data); }
      setShowModal(false); setEditingProduct(null); resetForm(); loadProducts();
    } catch (err) { setFormError(err.response?.data?.detail || 'Erro ao salvar produto'); }
  };

  const handleEdit = (p) => {
    const cat = allCategories.find(c => c.id === p.category_id);
    const parentCat = cat?.parent_id ? allCategories.find(c => c.id === cat.parent_id) : null;
    setEditingProduct(p);
    setForm({
      name: p.name, sku: p.sku, description: p.description || '',
      price: p.price ?? '', cost_price: p.cost_price ?? '', markup: p.markup ?? '',
      unit_id: p.unit_id || '', category_id: parentCat ? parentCat.id : (cat ? cat.id : ''),
      subcategory_id: cat?.parent_id ? cat.id : '', barcode: p.barcode || '', deposit_id: p.deposit_id || '',
    });
    setLastEdited('markup');
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Remover este produto?')) return;
    try { await api.delete(`/products/${id}`); loadProducts(); }
    catch (err) { alert(err.response?.data?.detail || 'Erro ao remover produto'); }
  };

  const resetForm = () => {
    setForm({ name: '', sku: '', description: '', price: '', cost_price: '', markup: '', unit_id: '', category_id: '', subcategory_id: '', barcode: '', deposit_id: '' });
    setLastEdited('markup');
    setFormError('');
  };

  const getCategoryName = (p) => {
    if (!p.category) return '-';
    const parent = p.category.parent_id ? allCategories.find(c => c.id === p.category.parent_id) : null;
    if (parent) return `${parent.name} / ${p.category.name}`;
    return p.category.name;
  };

  const getProductName = (p) => p.display_name || (p.unit?.abbreviation ? `${p.name} ${p.unit.abbreviation}` : p.name);

  const isWeightUnit = (u) => !!u && (
    ['kg', 'g', 'mg', 'cg', 'dg', 'hg', 't', 'ton'].includes((u.abbreviation || '').toLowerCase().replace('.', ''))
    || /\b(quilo|grama|tonelada)\b/.test((u.name || '').toLowerCase())
  );

  const fmtVal = (n, u) => n == null ? '-' : Number(n).toLocaleString('pt-BR', {
    minimumFractionDigits: isWeightUnit(u) ? 3 : 2,
    maximumFractionDigits: isWeightUnit(u) ? 3 : 2,
  });

  const formUnit = units.find(u => u.id === parseInt(form.unit_id));
  const formDecimals = isWeightUnit(formUnit) ? 3 : 2;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Produtos</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowImport(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700">
            <Upload size={18} /> Importar Excel
          </button>
          <button onClick={() => { resetForm(); setEditingProduct(null); setShowModal(true); }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
            <Plus size={18} /> Novo Produto
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <div className="flex items-center gap-2">
          <Search size={18} className="text-gray-400" />
          <input type="text" placeholder="Buscar produto..." value={search}
            onChange={(e) => setSearch(e.target.value)} className="flex-1 outline-none text-sm" />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <SortableHeader label="Nome" sortKey="name" currentSort={sortConfig} onSort={handleSort} />
              <SortableHeader label="SKU" sortKey="sku" currentSort={sortConfig} onSort={handleSort} />
              <SortableHeader label="Categoria" sortKey="category_id" currentSort={sortConfig} onSort={handleSort} />
              <SortableHeader label="Preço Venda" sortKey="price" currentSort={sortConfig} onSort={handleSort} align="right" />
              <SortableHeader label="Markup" sortKey="markup" currentSort={sortConfig} onSort={handleSort} align="right" />
              <SortableHeader label="Preço Custo" sortKey="cost_price" currentSort={sortConfig} onSort={handleSort} align="right" />
              <th className="text-center p-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {sortedProducts.map(p => (
              <tr key={p.id} className="border-t hover:bg-gray-50">
                <td className="p-3 font-medium">{getProductName(p)}</td>
                <td className="p-3 text-gray-500">{p.sku}</td>
                <td className="p-3 text-gray-500 text-xs">{getCategoryName(p)}</td>
                <td className="p-3 text-right">{fmtVal(p.price, p.unit)}</td>
                <td className="p-3 text-right">{p.markup != null ? Number(p.markup).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) : '-'}</td>
                <td className="p-3 text-right">{fmtVal(p.cost_price, p.unit)}</td>
                <td className="p-3 text-center">
                  <button onClick={() => handleEdit(p)} className="text-blue-600 hover:text-blue-800 mr-2"><Edit size={16} /></button>
                  <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:text-red-800"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {sortedProducts.length === 0 && (
              <tr><td colSpan={7} className="p-8 text-center text-gray-500">Nenhum produto cadastrado</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <ImportExcelModal open={showImport} onClose={() => setShowImport(false)} onImported={loadProducts} />

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-auto">
            <h2 className="text-lg font-bold mb-4">{editingProduct ? 'Editar' : 'Novo'} Produto</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              {formError && (
                <div className="bg-red-50 border border-red-300 text-red-700 text-sm px-3 py-2 rounded-lg">{formError}</div>
              )}
              <input placeholder="Nome do produto *" value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg text-sm" required />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="SKU *" value={form.sku}
                  onChange={e => setForm({...form, sku: e.target.value})}
                  className="px-3 py-2 border rounded-lg text-sm" required />
                <input placeholder="Código de barras" value={form.barcode}
                  onChange={e => setForm({...form, barcode: e.target.value})}
                  className="px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Categoria</label>
                  <SearchableSelect options={parentCategories.map(c => ({ value: c.id, label: c.name }))}
                    value={form.category_id ? parseInt(form.category_id) : ''}
                    onChange={v => setForm({...form, category_id: String(v), subcategory_id: ''})}
                    placeholder="Selecione..." />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Subcategoria</label>
                  <SearchableSelect options={subcategories.map(c => ({ value: c.id, label: c.name }))}
                    value={form.subcategory_id ? parseInt(form.subcategory_id) : ''}
                    onChange={v => setForm({...form, subcategory_id: String(v)})}
                    placeholder="Selecione..." disabled={!form.category_id} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Unidade de Medida</label>
                <SearchableSelect options={units.map(u => ({ value: u.id, label: `${u.name} (${u.abbreviation})` }))}
                  value={form.unit_id ? parseInt(form.unit_id) : ''}
                  onChange={v => setForm({...form, unit_id: String(v)})}
                  placeholder="Selecione..." />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Preço de Venda</label>
                  <input type="number" step={formDecimals === 3 ? '0.001' : '0.01'} placeholder="R$ 0,00" value={form.price}
                    onChange={e => handlePriceChange(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Preço de Custo</label>
                  <input type="number" step={formDecimals === 3 ? '0.001' : '0.01'} placeholder="R$ 0,00" value={form.cost_price}
                    onChange={e => handleCostChange(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Markup</label>
                  <input type="number" step="0.0001" placeholder="Ex.: 1,50" value={form.markup}
                    onChange={e => handleMarkupChange(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              {form.cost_price && (form.markup || form.price) && (
                <p className="text-xs text-gray-400">
                  {form.markup && form.cost_price ? `Preço de venda = custo × markup → R$ ${(round2(parseFloat(form.cost_price) * parseFloat(form.markup))).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}
                  {form.price && form.cost_price && !form.markup ? `Markup = venda ÷ custo → ${(round4(parseFloat(form.price) / parseFloat(form.cost_price))).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}` : ''}
                </p>
              )}
              <textarea placeholder="Descrição do produto" value={form.description} rows={4}
                onChange={e => setForm({...form, description: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg text-sm" />
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">Cancelar</button>
                <button type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
