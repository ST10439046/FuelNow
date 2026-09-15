import { useEffect, useState } from "react";
import {
  orderRepository,
  type KPISummary,
} from "../repositories/OrderRepository";
import {
  sosRepository,
  type SOSAlertModel,
} from "../repositories/SOSRepository";
import { type OrderModel } from "../repositories/OrderRepository";
import Card from "../components/Card";
import StatusBadge from "../components/StatusBadge";
import OrderDensityMap from "../components/OrderDensityMap";

function KPICard({
  label,
  value,
  change,
  icon,
  accent,
}: {
  label: string;
  value: string;
  change: number;
  icon: string;
  accent: string;
}) {
  const positive = change >= 0;
  return (
    <Card style={{ flex: 1, minWidth: 200 }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "var(--radius-md)",
            background: accent + "22",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
          }}
        >
          {icon}
        </div>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            padding: "3px 8px",
            borderRadius: 99,
            background: positive ? "var(--green-light)" : "var(--red-light)",
            color: positive ? "#15803D" : "var(--signal-red)",
          }}
        >
          {positive ? "↑" : "↓"} {Math.abs(change)}%
        </span>
      </div>
      <div
        style={{
          fontSize: 30,
          fontWeight: 700,
          color: "var(--charcoal-ink)",
          lineHeight: 1,
          marginBottom: 6,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 13, color: "var(--ink-faint)", fontWeight: 500 }}>
        {label}
      </div>
    </Card>
  );
}

function fmtZAR(n: number) {
  return (
    "R " +
    n.toLocaleString("en-ZA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DashboardScreen() {
  const [kpi, setKpi] = useState<KPISummary | null>(null);
  const [orders, setOrders] = useState<OrderModel[]>([]);
  const [alerts, setAlerts] = useState<SOSAlertModel[]>([]);

  useEffect(() => {
    orderRepository.getKPISummary().then(setKpi);
    orderRepository
  .getAllAdminOrders()
  .then(setOrders);
    sosRepository
      .getAlerts()
      .then((a) => setAlerts(a.filter((x) => x.status !== "resolved")));
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 28,
        animation: "fadeIn 0.3s ease",
      }}
    >
      {/* SOS Banner */}
      {alerts.length > 0 && (
        <div
          style={{
            background: "linear-gradient(90deg, #FEE2E2 0%, #FECACA 100%)",
            border: "1px solid #FECACA",
            borderRadius: "var(--radius-md)",
            padding: "12px 20px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span style={{ fontSize: 20 }}>🚨</span>
          <span style={{ fontWeight: 600, color: "#991B1B", fontSize: 14 }}>
            {alerts.length} active SOS alert{alerts.length > 1 ? "s" : ""}{" "}
            require attention
          </span>
          <a
            href="/sos"
            style={{
              marginLeft: "auto",
              fontSize: 13,
              fontWeight: 600,
              color: "#B91C1C",
              textDecoration: "underline",
            }}
          >
            View alerts →
          </a>
        </div>
      )}

      {/* KPI Strip */}
      {kpi && (
        <div style={{ display: "flex", gap: 20 }}>
          <KPICard
            label="Today's Orders"
            value={String(kpi.todayOrders)}
            change={kpi.ordersChange}
            icon="📋"
            accent="#F97316"
          />
          <KPICard
            label="Today's Revenue"
            value={fmtZAR(kpi.todayRevenue)}
            change={kpi.revenueChange}
            icon="💰"
            accent="#22C55E"
          />
          <KPICard
            label="Active Drivers"
            value={String(kpi.activeDrivers)}
            change={kpi.driversChange}
            icon="🚛"
            accent="#2563EB"
          />
          <KPICard
            label="Avg Delivery Time"
            value={`${kpi.avgDeliveryMinutes} min`}
            change={kpi.avgTimeChange}
            icon="⏱️"
            accent="#FACC15"
          />
        </div>
      )}

      {/* Map + Recent Orders */}
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 420px", gap: 20 }}
      >
        {/* Demand Heatmap */}
        <Card padding={0} style={{ overflow: "hidden" }}>
          <div
            style={{
              padding: "20px 24px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid var(--divider)",
            }}
          >
            <div>
              <h3
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "var(--charcoal-ink)",
                }}
              >
                Demand Heatmap
              </h3>
              <p
                style={{
                  fontSize: 12,
                  color: "var(--ink-faint)",
                  marginTop: 2,
                }}
              >
                Real-time order density · Durban Metro
              </p>
            </div>
            <div
              style={{
                display: "flex",
                gap: 12,
                alignItems: "center",
                fontSize: 12,
                color: "var(--ink-light)",
              }}
            >
              <span>🟠 High</span>
              <span>🔵 Medium</span>
            </div>
          </div>
          <OrderDensityMap
  orders={orders}
  height={310}
/>
        </Card>

        {/* Recent Orders */}
        <Card padding={0}>
          <div
            style={{
              padding: "20px 24px 16px",
              borderBottom: "1px solid var(--divider)",
            }}
          >
            <h3
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "var(--charcoal-ink)",
              }}
            >
              Recent Orders
            </h3>
            <p
              style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 2 }}
            >
              Last 6 orders · today
            </p>
          </div>
          <div style={{ overflow: "auto", maxHeight: 350 }}>
          {orders.slice(0, 6).map((order, i) => (
              <div
                key={order.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "14px 24px",
                  borderBottom:
                    i < orders.length - 1 ? "1px solid var(--divider)" : "none",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--charcoal-ink)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {order.customerName}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--ink-faint)",
                      marginTop: 2,
                    }}
                  >
                    {order.id} ·{" "}
                    {order.createdAt ? fmtTime(order.createdAt) : "No date"}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <StatusBadge status={order.status} />
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--charcoal-ink)",
                      marginTop: 4,
                    }}
                  >
                    {fmtZAR(order.totalAmount ?? 0)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
