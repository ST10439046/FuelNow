import { useEffect, useState } from 'react';
import { driverRepository, type DriverModel as Driver } from '../repositories/DriverRepository';

const PROVINCES = [
  'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo',
  'Mpumalanga', 'Northern Cape', 'North West', 'Western Cape'
];
import Card from '../components/Card';
import DataTable, { type Column } from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Button from '../components/Button';
import Input from '../components/Input';

export default function DriversScreen() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    zone: '',
    province: 'KwaZulu-Natal',
    truck: ''
  });

  const fetchDrivers = () => driverRepository.getAllDrivers().then(setDrivers);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const openAddModal = () => {
    setEditingDriver(null);
    setFormData({ name: '', phone: '', email: '', zone: '', province: 'KwaZulu-Natal', truck: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (driver: Driver) => {
    setEditingDriver(driver);
    setFormData({
      name: driver.name, phone: driver.phone, email: driver.email,
      zone: driver.zone, province: driver.province, truck: driver.truck
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDriver(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingDriver) {
        await driverRepository.updateDriver(editingDriver.id, formData);
      } else {
        await driverRepository.addDriver(formData as any);
      }
      await fetchDrivers();
      closeModal();
    } catch (err) {
      console.error(err);
      alert('Failed to save driver');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!editingDriver) return;
    if (confirm('Are you sure you want to delete this driver?')) {
      setLoading(true);
      try {
        await driverRepository.deleteDriver(editingDriver.id);
        await fetchDrivers();
        closeModal();
      } catch (err) {
        console.error(err);
        alert('Failed to delete driver');
      } finally {
        setLoading(false);
      }
    }
  };

  const filtered = drivers.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) || 
    d.zone.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<Driver>[] = [
    {
      key: 'name', label: 'Driver', sortable: true,
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--petrol-deep)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>
            {row.avatar}
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>{row.name}</div>
            <div style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 2 }}>{row.id} · {row.phone}</div>
          </div>
        </div>
      ),
    },
    { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
    { key: 'zone', label: 'Zone & Province', render: (_, row) => <>{row.zone}<br/><span style={{ fontSize: 11, color: 'var(--ink-faint)' }}>{row.province}</span></> },
    { key: 'truck', label: 'Assigned Truck', render: (v) => <span style={{ fontSize: 13 }}>{v}</span> },
    { key: 'rating', label: 'Rating', sortable: true, render: (v) => <span style={{ fontWeight: 600, color: 'var(--ignition-amber)' }}>⭐ {v.toFixed(1)}</span> },
    {
      key: 'compliance', label: 'Compliance Status',
      render: (docs) => {
        if (!docs || docs.length === 0) return <StatusBadge status="valid" customLabel="N/A" />;
        const expired = docs.filter((d: any) => d.status === 'expired').length;
        const soon = docs.filter((d: any) => d.status === 'expiring_soon').length;
        if (expired > 0) return <StatusBadge status="expired" customLabel={`${expired} Expired`} />;
        if (soon > 0) return <StatusBadge status="expiring_soon" customLabel={`${soon} Expiring Soon`} />;
        return <StatusBadge status="valid" customLabel="All Valid" />;
      }
    },
    {
      key: 'actions', label: '', width: 140,
      render: (_, row) => (
        <Button variant="ghost" size="sm" onClick={() => openEditModal(row)}>Manage Driver</Button>
      )
    }
  ];

  return (
    <div style={{ animation: 'fadeIn 0.3s ease', position: 'relative' }}>
      <Card padding={0}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--divider)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <Input
            placeholder="Search drivers by name or zone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            icon="🔍"
            style={{ width: 320 }}
          />
          <Button icon="➕" onClick={openAddModal}>Add New Driver</Button>
        </div>
        
        <DataTable columns={columns} data={filtered} rowKey="id" />
      </Card>

      {/* Manage Driver Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'var(--overlay)', zIndex: 999,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: 'var(--white)', width: 500, borderRadius: 'var(--radius-lg)',
            padding: 32, boxShadow: 'var(--shadow-lg)'
          }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>
              {editingDriver ? 'Manage Driver' : 'Add New Driver'}
            </h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Input label="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}><Input label="Phone Number" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required /></div>
                <div style={{ flex: 1 }}><Input label="Email Address" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required /></div>
              </div>
              <Input label="Assigned Zone" value={formData.zone} onChange={e => setFormData({...formData, zone: e.target.value})} placeholder="e.g. Durban North" required />
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-light)' }}>Province</label>
                <select
                  value={formData.province} onChange={e => setFormData({...formData, province: e.target.value})}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)',
                    border: '1.5px solid var(--divider)', background: 'var(--white)',
                    fontSize: 14, fontFamily: 'Inter, sans-serif'
                  }}
                >
                  {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <Input label="Assigned Truck" value={formData.truck} onChange={e => setFormData({...formData, truck: e.target.value})} placeholder="e.g. FN-TRK-001 (Isuzu NMR)" />
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
                {editingDriver && (
                  <Button type="button" variant="danger" onClick={handleDelete} disabled={loading} style={{ marginRight: 'auto' }}>
                    Delete
                  </Button>
                )}
                <Button type="button" variant="ghost" onClick={closeModal} disabled={loading}>Cancel</Button>
                <Button type="submit" variant="primary" loading={loading}>
                  {editingDriver ? 'Save Changes' : 'Add Driver'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
