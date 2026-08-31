import React from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantStyles: Record<Variant, React.CSSProperties> = {
  primary: { background: 'var(--petrol-deep)', color: '#fff', border: '2px solid transparent' },
  secondary: { background: 'var(--diesel-blue)', color: '#fff', border: '2px solid transparent' },
  danger: { background: 'var(--signal-red)', color: '#fff', border: '2px solid transparent' },
  ghost: { background: 'transparent', color: 'var(--petrol-deep)', border: '2px solid transparent' },
  outline: { background: 'transparent', color: 'var(--petrol-deep)', border: '2px solid var(--petrol-deep)' },
};

const sizeStyles: Record<Size, React.CSSProperties> = {
  sm: { padding: '6px 12px', fontSize: 13, borderRadius: 'var(--radius-sm)', gap: 6 },
  md: { padding: '9px 18px', fontSize: 14, borderRadius: 'var(--radius-md)', gap: 8 },
  lg: { padding: '12px 24px', fontSize: 15, borderRadius: 'var(--radius-md)', gap: 8 },
};

export default function Button({ variant = 'primary', size = 'md', loading, icon, children, disabled, style, ...props }: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <button
      disabled={isDisabled}
      style={{
        display: 'inline-flex', alignItems: 'center', fontWeight: 600,
        fontFamily: 'Inter, sans-serif', cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.55 : 1, transition: 'opacity 0.15s, transform 0.1s',
        whiteSpace: 'nowrap',
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...style,
      }}
      onMouseEnter={e => { if (!isDisabled) (e.currentTarget as HTMLButtonElement).style.opacity = '0.88'; }}
      onMouseLeave={e => { if (!isDisabled) (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
      {...props}
    >
      {loading ? <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> : icon}
      {children}
    </button>
  );
}
