import { useEffect } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useFinance } from '../../context/FinanceContext';
import { useLang } from '../../context/LangContext';
import { LibSm } from '../../components/LibSVG';
import ChatBot from '../../components/ChatBot';
import LibTour from '../../components/LibTour';
import LibPop from '../../components/LibPop';
import { Home, Receipt, CreditCard, PiggyBank, Compass, UserCircle } from 'lucide-react';

export default function Layout() {
  const { fetchAll } = useFinance();
  const { t } = useLang();
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => { fetchAll(); }, []);

  const NAV = [
    { id: 'inicio',    Icon: Home,       label: t('nav_inicio'),    path: '/app' },
    { id: 'servicios', Icon: Receipt,    label: t('nav_servicios'), path: '/app/servicios' },
    { id: 'deudas',    Icon: CreditCard, label: t('nav_deudas'),    path: '/app/deudas' },
    { id: 'ahorros',   Icon: PiggyBank,  label: t('nav_ahorro'),    path: '/app/ahorros' },
    { id: 'plan',      Icon: Compass,    label: t('nav_plan'),      path: '/app/plan' },
  ];

  const isActive = (path) =>
    path === '/app' ? loc.pathname === '/app' : loc.pathname.startsWith(path);

  return (
    <div className="shell">
      <nav className="sidebar">
        <div className="logo-badge pulse-anim" onClick={() => nav('/app')} title="Inicio">
          <LibSm size={24} />
        </div>
        {NAV.map((item) => (
          <button
            key={item.id}
            className={`nav-btn ${isActive(item.path) ? 'active' : ''}`}
            onClick={() => nav(item.path)}
          >
            <item.Icon size={20} strokeWidth={isActive(item.path) ? 2.5 : 1.8} />
            <span className="nav-tip">{item.label}</span>
          </button>
        ))}
        <div className="sidebar-spacer" />
        <button
          className={`nav-btn ${isActive('/app/perfil') ? 'active' : ''}`}
          onClick={() => nav('/app/perfil')}
        >
          <UserCircle size={20} strokeWidth={isActive('/app/perfil') ? 2.5 : 1.8} />
          <span className="nav-tip">{t('nav_perfil')}</span>
        </button>
      </nav>

      <main className="main">
        <Outlet />
      </main>

      <ChatBot />
      <LibTour />
      <LibPop />

      <nav className="mob-nav">
        {NAV.map((item) => (
          <button
            key={item.id}
            className={`mob-btn ${isActive(item.path) ? 'active' : ''}`}
            onClick={() => nav(item.path)}
          >
            <item.Icon size={22} strokeWidth={isActive(item.path) ? 2.5 : 1.8} />
            {item.label}
          </button>
        ))}
        <button
          className={`mob-btn ${isActive('/app/perfil') ? 'active' : ''}`}
          onClick={() => nav('/app/perfil')}
        >
          <UserCircle size={22} strokeWidth={isActive('/app/perfil') ? 2.5 : 1.8} />
          {t('nav_perfil')}
        </button>
      </nav>
    </div>
  );
}
