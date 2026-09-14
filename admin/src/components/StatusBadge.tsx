
type OrderStatus = 'pending' | 'assigned' | 'in_transit' | 'arriving' | 'delivered' | 'cancelled';
type ComplianceStatus = 'valid' | 'expiring_soon' | 'expired';
type DriverStatus = 'active' | 'offline' | 'suspended';
type AlertSeverity = 'critical' | 'high' | 'medium' | 'resolved';

type BadgeVariant = OrderStatus | ComplianceStatus | DriverStatus | AlertSeverity | 'flagged' | 'resolved';

const CONFIG: Record<string, { bg: string; color: string; label: string }> = {
  pending:        { bg: '#FEF9C3', color: '#854D0E', label: 'Pending' },
  accepted:       { bg: '#DBEAFE', color: '#1D4ED8', label: 'Accepted' },
  en_route:       { bg: '#FFEDD5', color: '#C2410C', label: 'En Route' },
  delivered:      { bg: '#DCFCE7', color: '#15803D', label: 'Delivered' },
  cancelled:      { bg: '#FEE2E2', color: '#B91C1C', label: 'Cancelled' },
  valid:          { bg: '#DCFCE7', color: '#15803D', label: 'Valid' },
  expiring_soon:  { bg: '#FEF9C3', color: '#854D0E', label: 'Expiring Soon' },
  expired:        { bg: '#FEE2E2', color: '#B91C1C', label: 'Expired' },
  active:         { bg: '#DCFCE7', color: '#15803D', label: 'Active' },
  offline:        { bg: '#F3F4F6', color: '#6B7280', label: 'Offline' },
  on_delivery:    { bg: '#FFEDD5', color: '#C2410C', label: 'On Delivery' },
  critical:       { bg: '#FEE2E2', color: '#B91C1C', label: 'Critical' },
  warning:        { bg: '#FEF9C3', color: '#854D0E', label: 'Warning' },
  flagged:        { bg: '#FEE2E2', color: '#B91C1C', label: 'Flagged' },
  resolved:       { bg: '#DCFCE7', color: '#15803D', label: 'Resolved' },
};

interface StatusBadgeProps {
  status: BadgeVariant | string;
  customLabel?: string;
}

export default function StatusBadge({ status, customLabel }: StatusBadgeProps) {
  const cfg = CONFIG[status] ?? { bg: '#F3F4F6', color: '#6B7280', label: status };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: cfg.bg, color: cfg.color, padding: '3px 10px',
      borderRadius: 99, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
      {customLabel ?? cfg.label}
    </span>
  );
}
