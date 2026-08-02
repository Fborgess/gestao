import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const me = await api.get('/auth/me');
      setUser(me.data);
      let foundRole = false;
      try {
        const roles = await api.get('/roles/');
        const role = roles.data.find(r => r.name === me.data.role);
        if (role) {
          foundRole = true;
          const perms = {};
          (role.modules || []).forEach(m => { perms[m.module] = m.access_level; });
          if (role.is_admin) {
            const allMods = ['dashboard','contacts','deposits','deposits_manage','products','stock_reports','requisicoes','categories','units','stock_movements','accounts','financial','financial_categories','payment_types','recurrence_frequencies','financial_reports','sale_types','sales','price_tables','users','roles','precificacao','settings'];
            allMods.forEach(mod => { perms[mod] = 'edit'; });
          }
          setPermissions(perms);
        }
      } catch {
        /* roles table may not exist yet */
      }
      if (!foundRole) {
        setPermissions({});
      }
    } catch {
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', res.data.access_token);
    await loadUser();
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setPermissions(null);
  };

  return (
    <AuthContext.Provider value={{ user, permissions, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
};
