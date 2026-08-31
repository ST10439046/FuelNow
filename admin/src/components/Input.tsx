import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export default function Input({ label, error, icon, style, ...props }: InputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-light)' }}>{label}</label>}
      <div style={{ position: 'relative' }}>
        {icon && (
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)', display: 'flex', alignItems: 'center' }}>
            {icon}
          </span>
        )}
        <input
          style={{
            width: '100%', padding: icon ? '10px 12px 10px 38px' : '10px 12px',
            fontSize: 14, fontFamily: 'Inter, sans-serif',
            border: `1.5px solid ${error ? 'var(--signal-red)' : 'var(--divider)'}`,
            borderRadius: 'var(--radius-md)', background: 'var(--white)',
            color: 'var(--charcoal-ink)', outline: 'none', transition: 'border-color 0.15s',
            ...style,
          }}
          onFocus={e => { e.currentTarget.style.borderColor = error ? 'var(--signal-red)' : 'var(--petrol-deep)'; }}
          onBlur={e => { e.currentTarget.style.borderColor = error ? 'var(--signal-red)' : 'var(--divider)'; }}
          {...props}
        />
      </div>
      {error && <span style={{ fontSize: 12, color: 'var(--signal-red)' }}>{error}</span>}
    </div>
  );
}
