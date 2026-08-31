import { useEffect, useState } from 'react';
import { getAdminUsers, createAdminUser, type AdminUser } from '../services/mockApi';
import Card from '../components/Card';
import DataTable, { type Column } from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Button from '../components/Button';
import Input from '../components/Input';

export default function SettingsScreen() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<{name: string, email: string, role: 'Super Admin' | 'Ops Manager' | 'Support Agent'}>({
    name: '',
    email: '',
    role: 'Support Agent',
  });

  const fetchUsers = () => getAdminUsers().then(setUsers);

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createAdminUser(formData);
      await fetchUsers();
      setIsModalOpen(false);
      setFormData({ name: '', email: '', role: 'Support Agent' });
    } catch (err) {
      console.error(err);
      alert('Failed to invite user');
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<AdminUser>[] = [
    { key: 'name', label: 'Name', sortable: true, render: (v) => <span style={{ fontWeight: 600 }}>{v}</span> },
    { key: 'email', label: 'Email Address' },
    { key: 'role', label: 'Role', render: (v) => <span style={{ padding: '2px 8px', background: 'var(--petrol-faint)', color: 'var(--petrol-deep)', borderRadius: 4, fontSize: 12, fontWeight: 600 }}>{v}</span> },
    { key: 'lastLogin', label: 'Last Login', sortable: true, render: (v) => new Date(v).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' }) },
    { key: 'active', label: 'Status', render: (v) => <StatusBadge status={v ? 'active' : 'offline'} customLabel={v ? 'Active' : 'Suspended'} /> },
    { key: 'actions', label: '', width: 80, render: () => <Button variant="ghost" size="sm">Edit</Button> }
  ];

  return (
    <div style={{ animation: 'fadeIn 0.3s ease', position: 'relative' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <Card padding={0}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--divider)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>System Administrators</h3>
              <p style={{ fontSize: 13, color: 'var(--ink-faint)', marginTop: 4 }}>Manage staff access to the FuelNow Admin Console.</p>
            </div>
            <Button icon="➕" onClick={() => setIsModalOpen(true)}>Invite User</Button>
          </div>
          <DataTable columns={columns} data={users} rowKey="id" />
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Card>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Platform Settings</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Auto-Assign Orders</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>Route to nearest active driver</div>
                </div>
                <div style={{ width: 44, height: 24, background: 'var(--diesel-green)', borderRadius: 99, position: 'relative' }}>
                  <div style={{ width: 20, height: 20, background: '#fff', borderRadius: '50%', position: 'absolute', top: 2, right: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </div>
              </div>
              <div style={{ height: 1, background: 'var(--divider)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Customer SMS Notifications</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-faint)' }}>Send OTP and status updates</div>
                </div>
                <div style={{ width: 44, height: 24, background: 'var(--diesel-green)', borderRadius: 99, position: 'relative' }}>
                  <div style={{ width: 20, height: 20, background: '#fff', borderRadius: '50%', position: 'absolute', top: 2, right: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Invite User Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'var(--overlay)', zIndex: 999,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: 'var(--white)', width: 400, borderRadius: 'var(--radius-lg)',
            padding: 32, boxShadow: 'var(--shadow-lg)'
          }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Invite Admin User</h2>
            <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Input label="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              <Input label="Email Address" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-light)' }}>Role</label>
                <select
                  value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as 'Super Admin' | 'Ops Manager' | 'Support Agent'})}
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-md)',
                    border: '1.5px solid var(--divider)', background: 'var(--white)',
                    fontSize: 14, fontFamily: 'Inter, sans-serif'
                  }}
                >
                  <option value="Super Admin">Super Admin</option>
                  <option value="Ops Manager">Ops Manager</option>
                  <option value="Support Agent">Support Agent</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} disabled={loading}>Cancel</Button>
                <Button type="submit" variant="primary" loading={loading}>Send Invite</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
