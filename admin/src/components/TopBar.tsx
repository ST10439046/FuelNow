
import { useLocation } from 'react-router-dom';

const TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/orders': 'Orders Management',
  '/drivers': 'Driver Management',
  '/rates': 'Fuel Rate Management',
  '/reviews': 'Reviews & Ratings',
  '/sos': 'SOS Alerts Monitor',
  '/reports': 'Reports & Export',
  '/settings': 'Admin Settings',
};

export default function TopBar() {
  const { pathname } = useLocation();
  const title = TITLES[pathname] ?? 'FuelNow Admin';
  const now = new Date().toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <header style={{
      height: 'var(--topbar-height)', background: 'var(--white)',
      borderBottom: '1px solid var(--divider)', display: 'flex',
      alignItems: 'center', justifyContent: 'space-between',
      padding: '0 32px', position: 'sticky', top: 0, zIndex: 50,
    }}>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--charcoal-ink)', lineHeight: 1.1 }}>{title}</h1>
        <p style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 2 }}>{now}</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Live indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--green-light)', padding: '4px 12px', borderRadius: 99 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--diesel-green)', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#15803D' }}>Live</span>
        </div>
        {/* Notification bell */}
        <div style={{ position: 'relative', cursor: 'pointer' }}>
          <span style={{ fontSize: 20 }}>🔔</span>
          <span style={{ position: 'absolute', top: -2, right: -2, width: 14, height: 14, background: 'var(--signal-red)', borderRadius: '50%', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#fff', fontWeight: 700 }}>2</span>
        </div>
      </div>
    </header>
  );
}
