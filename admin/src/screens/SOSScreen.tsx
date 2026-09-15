import { useEffect, useState } from 'react';
import { sosRepository, type SOSAlertModel as SOSAlert } from '../repositories/SOSRepository';
import Card from '../components/Card';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import MockMap from '../components/MockMap';

function timeAgoMin(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  return `${mins} min${mins !== 1 ? 's' : ''} ago`;
}

export default function SOSScreen() {
  const [alerts, setAlerts] = useState<SOSAlert[]>([]);
  const [resolving, setResolving] = useState<string | null>(null);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = () => sosRepository.getAlerts().then(setAlerts);

  const handleResolve = async (id: string) => {
    setResolving(id);
    await sosRepository.markAsResolved(id);
    await fetchAlerts();
    setResolving(null);
  };

  const handleDispatchSupport = async (alert: SOSAlert) => {
    const dispatchTeam = window.prompt(`Dispatch emergency roadside / hazmat team to ${alert.driverName} at ${alert.locationAddress}? Enter dispatch unit notes:`, 'Southgate Durban Rapid Response Unit #4 Dispatched with mobile fuel tanker.');
    if (dispatchTeam) {
      await sosRepository.dispatchSupport(alert.id, `[DISPATCHED: ${dispatchTeam}] ${alert.notes}`);
      await fetchAlerts();
      window.alert(`Emergency response dispatched. Driver ${alert.driverName} notified via SMS.`);
    }
  };

  const activeAlerts = alerts.filter(a => a.status !== 'resolved');
  const resolvedAlerts = alerts.filter(a => a.status === 'resolved');

  return (
    <div style={{ display: 'flex', gap: 24, animation: 'fadeIn 0.3s ease' }}>
      
      {/* List Column */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Active */}
        <Card padding={0}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--divider)', background: 'var(--red-light)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#991B1B', display: 'flex', alignItems: 'center', gap: 8 }}>
              🚨 Active Alerts ({activeAlerts.length})
            </h3>
          </div>
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {activeAlerts.length === 0 ? (
              <div style={{ color: 'var(--ink-faint)', textAlign: 'center', padding: 40 }}>No active alerts. All clear.</div>
            ) : (
              activeAlerts.map(alert => (
                <div key={alert.id} style={{ border: '1px solid var(--divider)', borderRadius: 'var(--radius-md)', padding: 16, background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-light)', marginBottom: 4 }}>{alert.id} · {timeAgoMin(alert.reported_at)}</div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--charcoal-ink)' }}>{alert.driverName}</div>
                      <div style={{ fontSize: 13, color: 'var(--ink-light)', marginTop: 2 }}>📍 {alert.locationAddress}, {alert.suburb}</div>
                    </div>
                    <StatusBadge status={alert.severity} />
                  </div>
                  <div style={{ padding: 12, background: 'var(--warm-ash)', borderRadius: 'var(--radius-sm)', fontSize: 13, color: 'var(--charcoal-ink)', marginBottom: 16 }}>
                    <strong>Note:</strong> {alert.notes}
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <Button variant="primary" loading={resolving === alert.id} onClick={() => handleResolve(alert.id)}>Mark as Resolved</Button>
                    <Button variant="outline" onClick={() => handleDispatchSupport(alert)}>Dispatch Support</Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Resolved */}
        <Card padding={0}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--divider)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--charcoal-ink)' }}>Recently Resolved ({resolvedAlerts.length})</h3>
          </div>
          <div>
            {resolvedAlerts.map(alert => (
              <div key={alert.id} style={{ padding: '16px 24px', borderBottom: '1px solid var(--divider)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{alert.driverName}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-light)' }}>{alert.notes}</div>
                </div>
                <StatusBadge status="resolved" />
              </div>
            ))}
          </div>
        </Card>

      </div>

      {/* Map Column */}
      <div style={{ width: 400 }}>
        <Card padding={0} style={{ overflow: 'hidden', position: 'sticky', top: 88 }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--divider)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--charcoal-ink)' }}>Live Driver Locations</h3>
          </div>
          <MockMap height={500} pins={
            activeAlerts.map(a => ({
              x: a.severity === 'critical' ? 45 : 70, // mock coords
              y: a.severity === 'critical' ? 30 : 60,
              color: 'var(--signal-red)',
              label: a.driverName,
              pulse: true
            }))
          } />
        </Card>
      </div>
      
    </div>
  );
}
