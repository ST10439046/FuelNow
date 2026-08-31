import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/dashboard',  label: 'Dashboard',      icon: '⊞' },
  { to: '/orders',     label: 'Orders',          icon: '📋' },
  { to: '/drivers',    label: 'Drivers',         icon: '🚛' },
  { to: '/rates',      label: 'Fuel Rates',      icon: '⛽' },
  { to: '/reviews',    label: 'Reviews',         icon: '⭐' },
  { to: '/sos',        label: 'SOS Alerts',      icon: '🚨' },
  { to: '/reports',    label: 'Reports',         icon: '📊' },
  { to: '/settings',   label: 'Settings',        icon: '⚙️' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const [hoveredItem, setHoveredItem] = React.useState<string | null>(null);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    navigate('/login');
  };

  return (
    <aside style={{
      width: 'var(--sidebar-width)', minHeight: '100vh', background: 'var(--sidebar-bg)',
      display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'fixed',
      top: 0, left: 0, bottom: 0, zIndex: 100, overflowY: 'auto',
    }}>
      {/* Logo */}
      <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: 'var(--petrol-deep)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0,
          }}>⛽</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 17, lineHeight: 1.2 }}>FuelNow</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Admin Console</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 12px' }}>
        <div style={{ marginBottom: 8, padding: '0 12px', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Main Menu
        </div>
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            onMouseEnter={() => setHoveredItem(item.to)}
            onMouseLeave={() => setHoveredItem(null)}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
              borderRadius: 'var(--radius-md)', marginBottom: 2, textDecoration: 'none',
              background: isActive ? 'var(--petrol-deep)' : hoveredItem === item.to ? 'rgba(255,255,255,0.07)' : 'transparent',
              color: isActive ? '#fff' : 'rgba(255,255,255,0.65)',
              fontWeight: isActive ? 600 : 400, fontSize: 14, transition: 'all 0.15s',
            })}
          >
            <span style={{ fontSize: 16, width: 20, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
            {item.label}
            {item.to === '/sos' && (
              <span style={{ marginLeft: 'auto', background: 'var(--signal-red)', color: '#fff', borderRadius: 99, fontSize: 10, fontWeight: 700, padding: '1px 6px' }}>2</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', background: 'var(--petrol-deep)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0,
          }}>MS</div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ color: '#fff', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Muhammed Safwaan</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>Super Admin</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-md)',
            color: 'rgba(255,255,255,0.6)', fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
