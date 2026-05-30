import { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { AUTH_CHANGED_EVENT, getAuthToken, getCurrentUser, logout } from './utils/api';
import {
  LayoutDashboard,
  Users,
  Compass,
  FileText,
  Activity,
  Upload,
  Settings as SettingsIcon,
  LogOut,
  CircleCheck,
} from 'lucide-react';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Bookings from './pages/Bookings';
import Invoices from './pages/Invoices';
import ActivityLogs from './pages/ActivityLogs';
import ImportsPage from './pages/Imports';
import SettingsPage from './pages/Settings';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/customers', icon: Users, label: 'Customers' },
  { to: '/bookings', icon: Compass, label: 'Bookings' },
  { to: '/invoices', icon: FileText, label: 'Invoices' },
  { to: '/imports', icon: Upload, label: 'Imports' },
  { to: '/activity-logs', icon: Activity, label: 'Activity Logs', adminOnly: true },
  { to: '/settings', icon: SettingsIcon, label: 'Settings' },
];

function AuthenticatedLayout() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const userInitials = (user?.fullName || 'Agency User')
    .split(' ')
    .map((part: string) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <img
            className="sidebar-brand-logo"
            src="/branding/riadh-voyages-logo.png"
            alt="Riadh Voyages"
          />
          <div>
            <div className="sidebar-logo">RIADH</div>
            <div className="sidebar-brand-subtitle">VOYAGES</div>
          </div>
        </div>

        <p className="sidebar-section-label">Workspace</p>
        <ul className="sidebar-menu">
          {NAV_ITEMS.filter((item) => !item.adminOnly || user?.role === 'ADMIN').map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `sidebar-link${isActive ? ' active' : ''}`
                }
              >
                <item.icon size={18} />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="sidebar-user">
          <div className="user-card">
            <span className="user-avatar">{userInitials}</span>
            <div className="user-info">
              <span className="user-name">{user?.fullName || 'User'}</span>
              <span className="user-role">{user?.role || 'Agent'}</span>
            </div>
          </div>
          <button className="btn sidebar-logout" onClick={handleLogout}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="app-topbar">
          <div>
            <p className="topbar-eyebrow">Agency workspace</p>
            <p className="topbar-title">Travel operations center</p>
          </div>
          <div className="topbar-status">
            <CircleCheck size={16} />
            <span>Live workspace</span>
          </div>
        </header>

        <div className="page-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/bookings" element={<Bookings />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/imports" element={<ImportsPage />} />
            <Route
              path="/activity-logs"
              element={user?.role === 'ADMIN' ? <ActivityLogs /> : <Navigate to="/" replace />}
            />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function AppRoutes() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!getAuthToken());

  useEffect(() => {
    const checkAuth = () => setIsAuthenticated(!!getAuthToken());

    window.addEventListener('storage', checkAuth);
    window.addEventListener(AUTH_CHANGED_EVENT, checkAuth);
    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener(AUTH_CHANGED_EVENT, checkAuth);
    };
  }, []);

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/" replace />
          ) : (
            <Login onLoginSuccess={() => setIsAuthenticated(true)} />
          )
        }
      />
      <Route
        path="/*"
        element={
          isAuthenticated ? (
            <AuthenticatedLayout />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  );
}
