import { useEffect, useState } from 'react';
import { getOrders, type Order } from '../services/mockApi';
import Card from '../components/Card';
import DataTable, { type Column } from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Button from '../components/Button';
import Input from '../components/Input';

function fmtZAR(n: number) {
  return 'R ' + n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    getOrders().then(setOrders);
  }, []);

  const filtered = orders.filter(o => {
    const matchesSearch = o.id.toLowerCase().includes(search.toLowerCase()) || o.customerName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns: Column<Order>[] = [
    { key: 'id', label: 'Order ID', sortable: true },
    {
      key: 'customerName', label: 'Customer', sortable: true,
      render: (_, row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.customerName}</div>
          <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 2 }}>{row.phone}</div>
        </div>
      ),
    },
    { key: 'fuelType', label: 'Fuel & Vol', render: (_, row) => `${row.fuelType} (${row.litres}L)` },
    { key: 'totalZAR', label: 'Amount', sortable: true, render: (v) => <span style={{ fontWeight: 600 }}>{fmtZAR(v)}</span> },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    { key: 'driverName', label: 'Driver', render: (v) => v ?? <span style={{ color: 'var(--ink-faint)' }}>Unassigned</span> },
    { key: 'placedAt', label: 'Placed Date', sortable: true, render: (v) => fmtDate(v) },
  ];

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <Card padding={0}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--divider)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 16, flex: 1, minWidth: 300 }}>
            <Input
              placeholder="Search by ID or Name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              icon="🔍"
              style={{ width: 260 }}
            />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{
                padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--divider)',
                background: 'var(--white)', color: 'var(--charcoal-ink)', fontSize: 14, outline: 'none',
              }}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="en_route">En Route</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <Button variant="outline" icon="⬇️">Export to Excel</Button>
        </div>
        
        <DataTable columns={columns} data={filtered} rowKey="id" />
      </Card>
    </div>
  );
}
