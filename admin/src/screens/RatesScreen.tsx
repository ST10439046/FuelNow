import { useEffect, useState } from 'react';
import { getRates, updateRate, type FuelRate } from '../services/mockApi';
import Card from '../components/Card';
import DataTable, { type Column } from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Button from '../components/Button';
import Input from '../components/Input';

function fmtZAR(n: number) {
  return 'R ' + n.toFixed(2);
}

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${mins} mins ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
}

export default function RatesScreen() {
  const [rates, setRates] = useState<FuelRate[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = () => getRates().then(setRates);

  const handleSave = async (fuelType: any) => {
    const num = parseFloat(editPrice);
    if (isNaN(num) || num <= 0) return alert('Invalid price');
    setLoading(true);
    try {
      await updateRate(fuelType, num);
      await fetchRates();
      setEditing(null);
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<FuelRate>[] = [
    {
      key: 'fuelType', label: 'Fuel Type',
      render: (v) => <span style={{ fontWeight: 600, color: v.includes('Diesel') ? 'var(--diesel-blue)' : 'var(--petrol-deep)' }}>{v}</span>
    },
    {
      key: 'pricePerLitre', label: 'Current Price (per Litre)',
      render: (v, row) => (
        editing === row.fuelType ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 600 }}>R</span>
            <Input
              type="number" step="0.01" value={editPrice}
              onChange={e => setEditPrice(e.target.value)}
              style={{ width: 100, padding: '6px 10px' }}
              autoFocus
            />
          </div>
        ) : (
          <span style={{ fontSize: 16, fontWeight: 700 }}>{fmtZAR(v)}</span>
        )
      )
    },
    {
      key: 'source', label: 'Source',
      render: (v) => <StatusBadge status={v === 'api' ? 'valid' : 'warning'} customLabel={v === 'api' ? 'Automated API Sync' : 'Manual Override'} />
    },
    {
      key: 'lastUpdated', label: 'Last Updated',
      render: (v) => <span style={{ color: 'var(--ink-light)' }}>{timeAgo(v)}</span>
    },
    {
      key: 'actions', label: '', width: 140,
      render: (_, row) => (
        editing === row.fuelType ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <Button size="sm" variant="primary" loading={loading} onClick={() => handleSave(row.fuelType)}>Save</Button>
            <Button size="sm" variant="ghost" disabled={loading} onClick={() => setEditing(null)}>Cancel</Button>
          </div>
        ) : (
          <Button size="sm" variant="outline" onClick={() => { setEditing(row.fuelType); setEditPrice(String(row.pricePerLitre)); }}>
            Override Price
          </Button>
        )
      )
    }
  ];

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <Card padding={0}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--divider)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600 }}>Fuel Pricing</h3>
            <p style={{ fontSize: 13, color: 'var(--ink-faint)', marginTop: 4 }}>Manage current retail rates per litre.</p>
          </div>
          <Button variant="secondary" icon="🔄">Force API Sync</Button>
        </div>
        <DataTable columns={columns} data={rates} rowKey="fuelType" />
      </Card>
    </div>
  );
}
