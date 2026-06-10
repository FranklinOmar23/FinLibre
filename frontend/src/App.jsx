import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FinanceProvider } from './context/FinanceContext';
import { LangProvider } from './context/LangContext';

import Splash         from './pages/auth/Splash';
import Login          from './pages/auth/Login';
import Register       from './pages/auth/Register';
import Onboard        from './pages/auth/Onboard';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword  from './pages/auth/ResetPassword';
import Layout    from './pages/dashboard/Layout';
import Inicio    from './pages/dashboard/Inicio';
import Servicios from './pages/dashboard/Servicios';
import Deudas    from './pages/dashboard/Deudas';
import Ahorros   from './pages/dashboard/Ahorros';
import Plan      from './pages/dashboard/Plan';
import Perfil    from './pages/dashboard/Perfil';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontSize: 14 }}>
      Cargando...
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text3)', fontSize: 14 }}>
      Cargando...
    </div>
  );
  return !user ? children : <Navigate to="/app" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PublicRoute><Splash /></PublicRoute>} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password"  element={<ResetPassword />} />
      <Route path="/onboard" element={<PrivateRoute><Onboard /></PrivateRoute>} />
      <Route path="/app" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Inicio />} />
        <Route path="servicios" element={<Servicios />} />
        <Route path="deudas" element={<Deudas />} />
        <Route path="ahorros" element={<Ahorros />} />
        <Route path="plan" element={<Plan />} />
        <Route path="perfil" element={<Perfil />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LangProvider>
          <FinanceProvider>
            <AppRoutes />
          </FinanceProvider>
        </LangProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
