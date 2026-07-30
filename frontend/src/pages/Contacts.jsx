import { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { Plus, Edit, Trash2, Search, User, Building } from 'lucide-react';

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '', contact_type: 'cliente', cpf_cnpj: '', email: '',
    phone: '', address: '', city: '', state: '', notes: '',
  });

  const loadContacts = () => {
    const params = {};
    if (search) params.search = search;
    if (filter) params.contact_type = filter;
    api.get('/contacts/', { params }).then(res => setContacts(res.data)).catch(() => {});
  };

  useEffect(() => { loadContacts(); }, [search, filter]);

  const sortedContacts = useMemo(() =>
    [...contacts].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    [contacts]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await api.put(`/contacts/${editing.id}`, form); }
      else { await api.post('/contacts/', form); }
      setShowModal(false); setEditing(null); resetForm(); loadContacts();
    } catch (err) {
      alert(err.response?.data?.detail || 'Erro ao salvar contato');
    }
  };

  const handleEdit = (c) => {
    setEditing(c);
    setForm({
      name: c.name, contact_type: c.contact_type, cpf_cnpj: c.cpf_cnpj || '',
      email: c.email || '', phone: c.phone || '', address: c.address || '',
      city: c.city || '', state: c.state || '', notes: c.notes || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Remover este contato?')) return;
    try { await api.delete(`/contacts/${id}`); loadContacts(); }
    catch (err) { alert(err.response?.data?.detail || 'Erro ao remover contato'); }
  };

  const resetForm = () => {
    setForm({ name: '', contact_type: 'cliente', cpf_cnpj: '', email: '', phone: '', address: '', city: '', state: '', notes: '' });
  };

  const typeLabels = { cliente: 'Cliente', fornecedor: 'Fornecedor', both: 'Cliente/Fornecedor' };
  const typeColors = { cliente: 'bg-blue-100 text-blue-700', fornecedor: 'bg-purple-100 text-purple-700', both: 'bg-teal-100 text-teal-700' };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Clientes e Fornecedores</h1>
        <button onClick={() => { resetForm(); setEditing(null); setShowModal(true); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
          <Plus size={18} /> Novo Contato
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        {[{ v: '', l: 'Todos' }, { v: 'cliente', l: 'Clientes' }, { v: 'fornecedor', l: 'Fornecedores' }].map(f => (
          <button key={f.v} onClick={() => setFilter(f.v)}
            className={`px-3 py-1 rounded-lg text-sm ${filter === f.v ? 'bg-blue-600 text-white' : 'bg-white border hover:bg-gray-50'}`}>
            {f.l}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <div className="flex items-center gap-2">
          <Search size={18} className="text-gray-400" />
          <input type="text" placeholder="Buscar contato..." value={search}
            onChange={(e) => setSearch(e.target.value)} className="flex-1 outline-none text-sm" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedContacts.map(c => (
          <div key={c.id} className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                {c.contact_type === 'fornecedor' ? <Building size={20} className="text-purple-600" /> : <User size={20} className="text-blue-600" />}
                <span className="font-semibold">{c.name}</span>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColors[c.contact_type]}`}>
                {typeLabels[c.contact_type]}
              </span>
            </div>
            <div className="space-y-1 text-sm text-gray-600 mb-3">
              {c.cpf_cnpj && <div>{c.cpf_cnpj}</div>}
              {c.email && <div>{c.email}</div>}
              {c.phone && <div>{c.phone}</div>}
              {c.city && c.state && <div>{c.city} - {c.state}</div>}
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => handleEdit(c)} className="text-blue-600 hover:text-blue-800"><Edit size={16} /></button>
              <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:text-red-800"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-auto">
            <h2 className="text-lg font-bold mb-4">{editing ? 'Editar' : 'Novo'} Contato</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="Nome *" value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  className="col-span-2 px-3 py-2 border rounded-lg text-sm" required />
                <select value={form.contact_type} onChange={e => setForm({...form, contact_type: e.target.value})}
                  className="px-3 py-2 border rounded-lg text-sm">
                  <option value="cliente">Cliente</option>
                  <option value="fornecedor">Fornecedor</option>
                  <option value="both">Cliente/Fornecedor</option>
                </select>
                <input placeholder="CPF/CNPJ" value={form.cpf_cnpj}
                  onChange={e => setForm({...form, cpf_cnpj: e.target.value})}
                  className="px-3 py-2 border rounded-lg text-sm" />
                <input placeholder="Email" type="email" value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})}
                  className="px-3 py-2 border rounded-lg text-sm" />
                <input placeholder="Telefone" value={form.phone}
                  onChange={e => setForm({...form, phone: e.target.value})}
                  className="px-3 py-2 border rounded-lg text-sm" />
                <input placeholder="Endereço" value={form.address}
                  onChange={e => setForm({...form, address: e.target.value})}
                  className="col-span-2 px-3 py-2 border rounded-lg text-sm" />
                <input placeholder="Cidade" value={form.city}
                  onChange={e => setForm({...form, city: e.target.value})}
                  className="px-3 py-2 border rounded-lg text-sm" />
                <input placeholder="UF" maxLength={2} value={form.state}
                  onChange={e => setForm({...form, state: e.target.value.toUpperCase()})}
                  className="px-3 py-2 border rounded-lg text-sm" />
              </div>
              <textarea placeholder="Observações" value={form.notes} rows={2}
                onChange={e => setForm({...form, notes: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg text-sm" />
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg text-sm">Cancelar</button>
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
