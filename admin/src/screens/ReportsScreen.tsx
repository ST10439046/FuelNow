import { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
// Removed mockApi dependency

export default function ReportsScreen() {
  const [fromDate, setFromDate] = useState('2025-01-01');
  const [toDate, setToDate] = useState('2025-01-31');
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setLoading(false);
    alert('Report downloaded successfully!');
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease', maxWidth: 800 }}>
      <Card>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Export System Reports</h2>
        <p style={{ color: 'var(--ink-light)', fontSize: 14, marginBottom: 32, lineHeight: 1.5 }}>
          Generate aggregated data reports for accounting and compliance. Select a date range and the required dataset.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
          <Input type="date" label="Start Date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
          <Input type="date" label="End Date" value={toDate} onChange={e => setToDate(e.target.value)} />
        </div>

        <div style={{ marginBottom: 32 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--ink-light)', marginBottom: 12 }}>Select Dataset</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px', border: '1px solid var(--petrol-deep)', borderRadius: 'var(--radius-md)', background: 'var(--petrol-faint)', cursor: 'pointer' }}>
              <input type="radio" name="dataset" defaultChecked style={{ accentColor: 'var(--petrol-deep)', transform: 'scale(1.2)' }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--petrol-deep)' }}>Complete Financial Ledger (Orders)</div>
                <div style={{ fontSize: 12, color: 'var(--ink-light)', marginTop: 2 }}>Includes all order statuses, gross revenue, fuel volumes, and tax data.</div>
              </div>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px', border: '1px solid var(--divider)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>
              <input type="radio" name="dataset" style={{ accentColor: 'var(--petrol-deep)', transform: 'scale(1.2)' }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Driver Performance & Earnings</div>
                <div style={{ fontSize: 12, color: 'var(--ink-light)', marginTop: 2 }}>Breakdown of delivery times, ratings, SOS incidents, and driver payouts.</div>
              </div>
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 16 }}>
          <Button icon="⬇️" onClick={handleExport} loading={loading}>Download CSV</Button>
          <Button variant="outline" icon="📊" onClick={handleExport} disabled={loading}>Export to Excel (.xlsx)</Button>
        </div>
      </Card>
    </div>
  );
}
