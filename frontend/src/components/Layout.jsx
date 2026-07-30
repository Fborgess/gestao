import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, Package, ArrowRightLeft, DollarSign, Users, LogOut,
    Tag, Building, Wallet, CreditCard, Banknote, ChevronDown, ChevronRight,
    ChevronLeft, Warehouse, Ruler, BarChart3, Menu, UserCog, Clock, FileText,
    ShoppingCart, ClipboardList, Shield
} from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import InactivityWarning from './InactivityWarning';
import InstallPrompt from './InstallPrompt';
import ConnectionStatus from './ConnectionStatus';

const INACTIVITY_MS = 25 * 60 * 1000;
const WARNING_SECONDS = 120;

const menuSections = [
  {
    label: 'Cadastros',
    items: [
      { path: '/contacts', label: 'Clientes/Fornecedores', icon: Users },
    ],
  },
  {
    label: 'Estoque',
    items: [
      { path: '/deposits', label: 'Depósitos', icon: Warehouse },
      { path: '/products', label: 'Produtos', icon: Package },
      { path: '/stock-reports', label: 'Relatórios', icon: BarChart3 },
      { path: '/requisicoes', label: 'Requisições', icon: ClipboardList },
      { path: '/categories', label: 'Categorias', icon: Tag },
      { path: '/units', label: 'Unidades', icon: Ruler },
      { path: '/stock', label: 'Movimentações', icon: ArrowRightLeft },
    ],
  },
  {
    label: 'Financeiro',
    items: [
      { path: '/accounts', label: 'Contas/Cartões', icon: CreditCard },
      { path: '/financial', label: 'Lançamentos', icon: DollarSign },
      { path: '/financial-categories', label: 'Categorias', icon: Tag },
      { path: '/payment-types', label: 'Tipos de Pagamento', icon: Banknote },
      { path: '/recurrence-frequencies', label: 'Frequências', icon: Clock },
      { path: '/financial-reports', label: 'Relatórios', icon: FileText },
    ],
  },
  {
    label: 'Vendas',
    items: [
      { path: '/sale-types', label: 'Tipos de Lançamento', icon: FileText },
      { path: '/sales', label: 'Lançamentos', icon: ShoppingCart },
    ],
  },
  {
    label: 'Geral',
    items: [
      { path: '/', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/users', label: 'Usuários', icon: UserCog },
      { path: '/roles', label: 'Perfis de Acesso', icon: Shield },
    ],
  },
];

const MODULE_MAP = {
  '/contacts': 'contacts',
  '/deposits': 'deposits', '/products': 'products', '/stock-reports': 'stock_reports',
  '/requisicoes': 'requisicoes', '/categories': 'categories', '/units': 'units', '/stock': 'stock_movements',
  '/accounts': 'accounts', '/financial': 'financial', '/financial-categories': 'financial_categories',
  '/payment-types': 'payment_types', '/recurrence-frequencies': 'recurrence_frequencies', '/financial-reports': 'financial_reports',
  '/sale-types': 'sale_types', '/sales': 'sales',
  '/': 'dashboard',
  '/users': 'users',
  '/roles': 'roles',
};

export default function Layout() {
  const { user, permissions, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const toggleSection = (label) => {
    setExpandedSections(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(WARNING_SECONDS);
  const warningTimerRef = useRef(null);
  const countdownRef = useRef(null);

  const resetInactivityTimer = useCallback(() => {
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    setShowWarning(false);
    setCountdown(WARNING_SECONDS);
    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      setCountdown(WARNING_SECONDS);
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
            logout();
            navigate('/login');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, INACTIVITY_MS);
  }, [logout, navigate]);

  const handleStayLoggedIn = useCallback(() => {
    resetInactivityTimer();
  }, [resetInactivityTimer]);

  useEffect(() => {
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    const handler = () => resetInactivityTimer();
    events.forEach(ev => window.addEventListener(ev, handler));
    resetInactivityTimer();
    return () => {
      events.forEach(ev => window.removeEventListener(ev, handler));
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [resetInactivityTimer]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const isPrintRoute = location.pathname.includes('/print');

  if (isPrintRoute) {
    return (
      <div className="h-screen bg-white">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-gray-900 text-white flex flex-col overflow-y-auto transition-all duration-300`}>
        <div className={`p-4 border-b border-gray-700 flex items-center ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
          {sidebarOpen && (
            <div>
              <h1 className="text-lg font-bold">Sistema de Gestão</h1>
              <p className="text-xs text-gray-400 mt-1">Estoque, Vendas e Financeiro</p>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-400 hover:text-white p-1 rounded"
            title={sidebarOpen ? 'Recolher menu' : 'Expandir menu'}
          >
            {sidebarOpen ? <ChevronLeft size={18} /> : <Menu size={18} />}
          </button>
        </div>
        <nav className="flex-1 p-2">
          {menuSections.map((section) => {
            const visibleItems = section.items.filter(it => {
              const mod = MODULE_MAP[it.path];
              return !mod || !permissions || permissions[mod];
            });
            if (visibleItems.length === 0 && section.label !== 'Geral') return null;
            return (
              <div key={section.label} className="mb-2">
              {sidebarOpen ? (
                <button
                  onClick={() => toggleSection(section.label)}
                  className="flex items-center justify-between w-full px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-300"
                >
                  {section.label}
                  {expandedSections[section.label] ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                </button>
              ) : (
                <div className="px-3 py-1.5 text-xs text-gray-500 text-center border-b border-gray-700 mb-1" title={section.label}>
                  {section.label.charAt(0)}
                </div>
              )}
              {sidebarOpen && !expandedSections[section.label] && visibleItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-lg mb-0.5 text-sm transition-colors ${
                      isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'
                    }`
                  }
                >
                  <item.icon size={16} />
                  {item.label}
                </NavLink>
              ))}
              {!sidebarOpen && visibleItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  title={item.label}
                  className={({ isActive }) =>
                    `flex items-center justify-center px-3 py-2 rounded-lg mb-0.5 transition-colors ${
                      isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800'
                    }`
                  }
                >
                  <item.icon size={18} />
                </NavLink>
              ))}
            </div>
            );
          })}
        </nav>
        <div className={`p-4 border-t border-gray-700 ${sidebarOpen ? '' : 'flex justify-center'}`}>
          {sidebarOpen && <div className="text-sm text-gray-400 mb-2">{user?.name}</div>}
          {!sidebarOpen && <div className="text-xs text-gray-400 mb-2 text-center" title={user?.name}>{user?.name?.charAt(0)?.toUpperCase()}</div>}
          <button onClick={handleLogout} className={`flex items-center gap-2 text-sm text-red-400 hover:text-red-300 ${!sidebarOpen ? 'justify-center' : ''}`} title="Sair">
            <LogOut size={16} />
            {sidebarOpen && 'Sair'}
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <ConnectionStatus />
        <div className="p-6"><Outlet /></div>
      </main>
      <InactivityWarning
        show={showWarning}
        countdown={countdown}
        onStayLoggedIn={handleStayLoggedIn}
        onLogout={handleLogout}
      />
      <InstallPrompt />
    </div>
  );
}
