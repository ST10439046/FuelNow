import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import OrdersScreen from './screens/OrdersScreen';
import DriversScreen from './screens/DriversScreen';
import RatesScreen from './screens/RatesScreen';
import ReviewsScreen from './screens/ReviewsScreen';
import SOSScreen from './screens/SOSScreen';
import ReportsScreen from './screens/ReportsScreen';
import SettingsScreen from './screens/SettingsScreen';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const nav = useNavigate();
  const loc = useLocation();
  const isAuthenticated = !!localStorage.getItem('admin_token');

  useEffect(() => {
    if (!isAuthenticated && loc.pathname !== '/login') {
      nav('/login', { replace: true });
    } else if (isAuthenticated && loc.pathname === '/login') {
      nav('/dashboard', { replace: true });
    }
  }, [isAuthenticated, loc.pathname, nav]);

  if (!isAuthenticated && loc.pathname !== '/login') return null;

  if (loc.pathname === '/login') return <>{children}</>;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100%' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: 'var(--sidebar-width)', display: 'flex', flexDirection: 'column' }}>
        <TopBar />
        <main style={{ flex: 1, padding: 32, background: 'var(--warm-ash)' }}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthGuard>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/dashboard" element={<DashboardScreen />} />
          <Route path="/orders" element={<OrdersScreen />} />
          <Route path="/drivers" element={<DriversScreen />} />
          <Route path="/rates" element={<RatesScreen />} />
          <Route path="/reviews" element={<ReviewsScreen />} />
          <Route path="/sos" element={<SOSScreen />} />
          <Route path="/reports" element={<ReportsScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthGuard>
    </BrowserRouter>
  );
}
