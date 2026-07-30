import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Stock from './pages/Stock';
import Financial from './pages/Financial';
import Contacts from './pages/Contacts';
import Categories from './pages/Categories';
import FinancialCategories from './pages/FinancialCategories';
import Deposits from './pages/Deposits';
import Accounts from './pages/Accounts';
import PaymentTypes from './pages/PaymentTypes';
import Units from './pages/Units';
import StockReports from './pages/StockReports';
import Users from './pages/Users';
import Roles from './pages/Roles';
import RecurrenceFrequencies from './pages/RecurrenceFrequencies';
import FinancialReports from './pages/FinancialReports';
import SaleTypes from './pages/SaleTypes';
import SalesList from './pages/SalesList';
import SaleNew from './pages/SaleNew';
import SaleDetail from './pages/SaleDetail';
import SalePrint from './pages/SalePrint';
import Requisicoes from './pages/Requisicoes';
import TransferReport from './pages/TransferReport';
import Layout from './components/Layout';

function PrivateRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<PrivateRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/products" element={<Products />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/stock" element={<Stock />} />
              <Route path="/stock-reports" element={<StockReports />} />
              <Route path="/deposits" element={<Deposits />} />
              <Route path="/requisicoes" element={<Requisicoes />} />
              <Route path="/transfer-report" element={<TransferReport />} />
              <Route path="/financial" element={<Financial />} />
              <Route path="/financial-categories" element={<FinancialCategories />} />
              <Route path="/accounts" element={<Accounts />} />
              <Route path="/payment-types" element={<PaymentTypes />} />
              <Route path="/units" element={<Units />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="/users" element={<Users />} />
              <Route path="/roles" element={<Roles />} />
              <Route path="/recurrence-frequencies" element={<RecurrenceFrequencies />} />
              <Route path="/financial-reports" element={<FinancialReports />} />
              <Route path="/sale-types" element={<SaleTypes />} />
              <Route path="/sales" element={<SalesList />} />
              <Route path="/sales/new" element={<SaleNew />} />
              <Route path="/sales/:id" element={<SaleDetail />} />
              <Route path="/sales/:id/print" element={<SalePrint />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
