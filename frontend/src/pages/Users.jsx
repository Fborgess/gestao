import { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { Plus, Edit, Trash2, Users as UsersIcon, Shield, User, Lock, KeyRound, Warehouse } from 'lucide-react';

const emptyForm = { name: '', email: '', password: '', confirmPassword: '', role: '', deposit_ids: [] };

function randPass() {
  return Math.random().toString(36).slice(2, 8);
}

export default function Users() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [loading, setLoading] = useState(false);

  const roleLabels = useMemo(() => {
    const m = {};
    roles.forEach(r => { m[r.name] = r.name + (r.is_admin ? ' (Admin)' : ''); });
    return m;
  }, [roles]);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/auth/users'),
      api.get('/roles/'),
      api.get('/deposits/'),
    ]).then(([u, r, d]) => {
      setUsers(u.data);
      setRoles(r.data);
      setDeposits(d.data);
      if (!emptyForm.role) {
        const def = r.data.find(ro => ro.is_default);
        if (def) emptyForm.role = def.name;
      }
    }).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const toggleDeposit = (id) => {
    setForm(f => ({
      ...f,
      deposit_ids: f.deposit_ids.includes(id) ? f.deposit_ids.filter(d => d !== id) : [...f.deposit_ids, id],
    }));
  };

  const sorted = useMemo(() =>
    [...users].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    [users]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (form.password && form.password !== form.confirmPassword) {
        alert('Senha e confirmação não conferem');
        return;
      }
      const data = { name: form.name, email: form.email, role: form.role, deposit_ids: form.deposit_ids };
      if (editing) {
        if (form.password) data.password = form.password;
        await api.put(`/auth/users/${editing.id}`, data);
      } else {
        data.password = form.password;
        await api.post('/auth/register', data);
      }
      setShowModal(false); setEditing(null); setForm(emptyForm); load();
    } catch (err) {
      alert(err.response?.data?.detail || 'Erro ao salvar usuário');
    }
  };

  const handleEdit = (u) => {
    setEditing(u);
    setForm({ name: u.name, email: u.email, password: '', confirmPassword: '', role: u.role, deposit_ids: u.deposit_ids || [] });
    setShowModal(true);
  };

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const handleGeneratePass = () => {
    const p = randPass();
    setForm(f => ({ ...f, password: p, confirmPassword: p }));
  };

  const handleDelete = async (id) => {
    if (!confirm('Remover este usuário?')) return;
    try {
      await api.delete(`/auth/users/${id}`);
      load();
    } catch (err) {
      alert(err.response?.data?.detail || 'Erro ao remover usuário');
    }
  };

  const handleToggle = async (u) => {
    try {
      await api.put(`/auth/users/${u.id}`, { is_active: !u.is_active });
      load();
    } catch (err) {
      alert(err.response?.data?.detail || 'Erro ao alterar status');
    }
  };

  if (loading && users.length === 0) return <div className="flex items-center justify-center h-64 text-gray-500">Carregando...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <UsersIcon size={28} className="text-blue-600" />
          <h1 className="text-2xl font-bold">Usuários</h1>
        </div>
        <button onClick={openNew}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 text-sm">
          <Plus size={18} /> Novo Usuário
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Nome</th>
              <th className="text-left p-3">Email</th>
              <th className="text-center p-3">Perfil</th>
              <th className="text-center p-3">Senha</th>
              <th className="text-center p-3">Status</th>
              <th className="text-center p-3">Criado em</th>
              <th className="text-center p-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(u => (
              <tr key={u.id} className="border-t hover:bg-gray-50">
                <td className="p-3 font-medium flex items-center gap-2">
                  {u.role === 'admin' ? <Shield size={14} className="text-purple-500" /> : <User size={14} className="text-gray-400" />}
                  {u.name}
                </td>
                <td className="p-3 text-gray-500">{u.email}</td>
                <td className="p-3 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                    {roleLabels[u.role] || u.role}
                  </span>
                </td>
                <td className="p-3 text-center">
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${u.has_password !== false ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    <Lock size={12} />
                    {u.has_password !== false ? 'Definida' : 'Pendente'}
                  </span>
                </td>
                <td className="p-3 text-center">
                  <button onClick={() => handleToggle(u)}
                    className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${u.is_active ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                    {u.is_active ? 'Ativo' : 'Inativo'}
                  </button>
                </td>
                <td className="p-3 text-center text-gray-400 text-xs">
                  {u.created_at ? new Date(u.created_at).toLocaleDateString('pt-BR') : '-'}
                </td>
                <td className="p-3 text-center whitespace-nowrap">
                  <button onClick={() => handleEdit(u)} className="text-blue-600 hover:text-blue-800 mr-2" title="Editar"><Edit size={16} /></button>
                  <button onClick={() => handleDelete(u.id)} className="text-red-600 hover:text-red-800" title="Remover"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr><td colSpan={7} className="p-6 text-center text-gray-400">Nenhum usuário cadastrado</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-100 text-blue-600">
                <UsersIcon size={20} />
              </div>
              <h2 className="text-lg font-bold text-gray-900">{editing ? 'Editar' : 'Novo'} Usuário</h2>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
              <div className="px-6 py-4 space-y-4 overflow-y-auto">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Nome *</label>
                  <input placeholder="Nome completo" value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Email *</label>
                  <input type="email" placeholder="email@exemplo.com" value={form.email}
                    onChange={e => setForm({...form, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" required />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-gray-500">
                      {editing ? 'Nova senha' : 'Senha *'}
                    </label>
                    {editing && (
                      <button type="button" onClick={handleGeneratePass}
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1">
                        <KeyRound size={12} /> Gerar senha
                      </button>
                    )}
                  </div>
                  <input type="text" placeholder={editing ? 'Deixe vazio para manter a atual' : 'Mínimo 6 caracteres'} value={form.password}
                    onChange={e => setForm({...form, password: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required={!editing} minLength={editing ? 0 : 6} />
                </div>
                {form.password && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Confirmar senha</label>
                    <input type="text" placeholder="Repita a senha" value={form.confirmPassword}
                      onChange={e => setForm({...form, confirmPassword: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Perfil *</label>
                  <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" required>
                    <option value="">Selecione</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.name}>{r.name}{r.is_admin ? ' (Admin)' : ''}{r.is_default ? ' (padrão)' : ''}</option>
                    ))}
                  </select>
                </div>
                {deposits.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Depósitos com Acesso</label>
                    <p className="text-xs text-gray-400 mb-1">Apenas depósitos pai (filhos são liberados automaticamente)</p>
                    <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto p-1">
                      {deposits.filter(d => !d.parent_id).map(d => (
                        <label key={d.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer text-sm">
                          <input type="checkbox" checked={form.deposit_ids.includes(d.id)}
                            onChange={() => toggleDeposit(d.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                          <Warehouse size={14} className="text-gray-400" />
                          {d.name}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50 rounded-b-2xl">
                <button type="button" onClick={() => { setShowModal(false); setEditing(null); setForm(emptyForm); }}
                  className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
                  Cancelar
                </button>
                <button type="submit"
                  className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
                  {editing ? 'Atualizar' : 'Criar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
