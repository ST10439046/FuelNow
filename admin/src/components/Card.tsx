import React from 'react';

interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  padding?: number | string;
  hoverable?: boolean;
}

export default function Card({ children, style, padding = 24, hoverable }: CardProps) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div
      onMouseEnter={() => hoverable && setHovered(true)}
      onMouseLeave={() => hoverable && setHovered(false)}
      style={{
        background: 'var(--card-bg)', borderRadius: 'var(--radius-lg)',
        boxShadow: hovered ? 'var(--shadow-md)' : 'var(--shadow-sm)',
        border: '1px solid var(--divider)', padding,
        transition: 'box-shadow 0.2s, transform 0.15s',
        transform: hovered ? 'translateY(-2px)' : 'none',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
