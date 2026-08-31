import React, { useState } from 'react';

export interface Column<T> {
  key: keyof T | string;
  label: string;
  width?: number | string;
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: keyof T;
  emptyMessage?: string;
}

export default function DataTable<T extends Record<string, any>>({ columns, data, rowKey, emptyMessage = 'No data found.' }: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [hovered, setHovered] = useState<string | null>(null);

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const sorted = sortKey
    ? [...data].sort((a, b) => {
        const av = a[sortKey]; const bv = b[sortKey];
        if (av < bv) return sortDir === 'asc' ? -1 : 1;
        if (av > bv) return sortDir === 'asc' ? 1 : -1;
        return 0;
      })
    : data;

  return (
    <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-lg)', border: '1px solid var(--divider)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: 'var(--ash-dark)', borderBottom: '1px solid var(--divider)' }}>
            {columns.map(col => (
              <th
                key={String(col.key)}
                onClick={() => col.sortable && handleSort(String(col.key))}
                style={{
                  padding: '11px 16px', textAlign: 'left', fontWeight: 600, fontSize: 12,
                  color: 'var(--ink-light)', whiteSpace: 'nowrap', letterSpacing: '0.03em',
                  width: col.width, cursor: col.sortable ? 'pointer' : 'default',
                  userSelect: 'none', textTransform: 'uppercase',
                }}
              >
                {col.label}
                {col.sortable && sortKey === String(col.key) && (
                  <span style={{ marginLeft: 4 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ padding: 40, textAlign: 'center', color: 'var(--ink-faint)', fontSize: 14 }}>
                {emptyMessage}
              </td>
            </tr>
          ) : sorted.map(row => {
            const key = String(row[rowKey]);
            return (
              <tr
                key={key}
                onMouseEnter={() => setHovered(key)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  background: hovered === key ? 'var(--petrol-faint)' : 'var(--white)',
                  borderBottom: '1px solid var(--divider)',
                  transition: 'background 0.12s',
                }}
              >
                {columns.map(col => (
                  <td key={String(col.key)} style={{ padding: '12px 16px', color: 'var(--charcoal-ink)', verticalAlign: 'middle' }}>
                    {col.render ? col.render(row[col.key as keyof T], row) : String(row[col.key as keyof T] ?? '—')}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
