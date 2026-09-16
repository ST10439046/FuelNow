import { useEffect, useState } from "react";

import {
  sosRepository,
  type SOSAlertModel as SOSAlert,
} from "../repositories/SOSRepository";

import { driverRepository } from "../repositories/DriverRepository";

import Card from "../components/Card";
import Button from "../components/Button";
import StatusBadge from "../components/StatusBadge";

import DriverTrackingMap, {
  type DriverLocation,
} from "../components/DriverTrackingMap";

function timeAgoMin(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);

  return `${mins} min${mins !== 1 ? "s" : ""} ago`;
}

export default function SOSScreen() {
  const [alerts, setAlerts] = useState<SOSAlert[]>([]);

  const [drivers, setDrivers] = useState<DriverLocation[]>([]);

  const [resolving, setResolving] = useState<string | null>(null);

  useEffect(() => {
    fetchAlerts();
    fetchDrivers();
  }, []);

  const fetchAlerts = async () => {
    try {
      const data = await sosRepository.getAlerts();

      setAlerts(data);
    } catch (error) {
      console.error("Failed to fetch SOS alerts:", error);
    }
  };

  const fetchDrivers = async () => {
    try {
      const allDrivers = await driverRepository.getAllDrivers();

      const driverLocations: DriverLocation[] = allDrivers
        .filter(
          (driver) =>
            Number.isFinite(driver.latitude) &&
            Number.isFinite(driver.longitude) &&
            driver.latitude >= -90 &&
            driver.latitude <= 90 &&
            driver.longitude >= -180 &&
            driver.longitude <= 180 &&
            !(driver.latitude === 0 && driver.longitude === 0),
        )
        .map((driver) => ({
          id: driver.id,

          name: driver.name,

          phone: driver.phone,

          vehicleReg: driver.vehicleReg,

          latitude: driver.latitude,

          longitude: driver.longitude,

          status: driver.status,
        }));

      setDrivers(driverLocations);
    } catch (error) {
      console.error("Failed to fetch driver locations:", error);

      setDrivers([]);
    }
  };

  const handleResolve = async (alert: SOSAlert) => {
    setResolving(alert.alert_id);

    try {
      await sosRepository.markAsResolved(alert.alert_id);

      await fetchAlerts();
    } catch (error) {
      console.error("Failed to resolve SOS alert:", error);
    } finally {
      setResolving(null);
    }
  };

  const handleDispatchSupport = async (alert: SOSAlert) => {
    const dispatchTeam = window.prompt(
      `Dispatch emergency roadside / hazmat team to ${alert.driverName} at ${alert.locationAddress}? Enter dispatch unit notes:`,

      "Southgate Durban Rapid Response Unit #4 Dispatched with mobile fuel tanker.",
    );

    if (!dispatchTeam) {
      return;
    }

    try {
      await sosRepository.dispatchSupport(
        alert.alert_id,
        `[DISPATCHED: ${dispatchTeam}] ${alert.notes}`,
      );

      await fetchAlerts();

      window.alert(
        `Emergency response dispatched. Driver ${alert.driverName} notified via SMS.`,
      );
    } catch (error) {
      console.error("Failed to dispatch support:", error);

      window.alert("Failed to dispatch emergency support.");
    }
  };

  const activeAlerts = alerts.filter((alert) => alert.status !== "resolved");

  const resolvedAlerts = alerts.filter((alert) => alert.status === "resolved");

  return (
    <div
      style={{
        display: "flex",
        gap: 24,
        animation: "fadeIn 0.3s ease",
      }}
    >
      {/* Alerts Column */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        {/* Active Alerts */}
        <Card padding={0}>
          <div
            style={{
              padding: "20px 24px",
              borderBottom: "1px solid var(--divider)",
              background: "var(--red-light)",
            }}
          >
            <h3
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "#991B1B",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              🚨 Active Alerts ({activeAlerts.length})
            </h3>
          </div>

          <div
            style={{
              padding: 24,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {activeAlerts.length === 0 ? (
              <div
                style={{
                  color: "var(--ink-faint)",
                  textAlign: "center",
                  padding: 40,
                }}
              >
                No active alerts. All clear.
              </div>
            ) : (
              activeAlerts.map((alert) => (
                <div
                  key={alert.alert_id}
                  style={{
                    border: "1px solid var(--divider)",
                    borderRadius: "var(--radius-md)",
                    padding: 16,
                    background: "#fff",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 12,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: "var(--ink-light)",
                          marginBottom: 4,
                        }}
                      >
                        {alert.alert_id} · {timeAgoMin(alert.reported_at)}
                      </div>

                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 600,
                          color: "var(--charcoal-ink)",
                        }}
                      >
                        {alert.driverName}
                      </div>

                      <div
                        style={{
                          fontSize: 13,
                          color: "var(--ink-light)",
                          marginTop: 2,
                        }}
                      >
                        📍 {alert.locationAddress}, {alert.suburb}
                      </div>
                    </div>

                    <StatusBadge status={alert.severity} />
                  </div>

                  <div
                    style={{
                      padding: 12,
                      background: "var(--warm-ash)",
                      borderRadius: "var(--radius-sm)",
                      fontSize: 13,
                      color: "var(--charcoal-ink)",
                      marginBottom: 16,
                    }}
                  >
                    <strong>Note:</strong> {alert.notes}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                    }}
                  >
                    <Button
                      variant="primary"
                      loading={resolving === alert.alert_id}
                      onClick={() => handleResolve(alert)}
                    >
                      Mark as Resolved
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => handleDispatchSupport(alert)}
                    >
                      Dispatch Support
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Recently Resolved */}
        <Card padding={0}>
          <div
            style={{
              padding: "16px 24px",
              borderBottom: "1px solid var(--divider)",
            }}
          >
            <h3
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "var(--charcoal-ink)",
              }}
            >
              Recently Resolved ({resolvedAlerts.length})
            </h3>
          </div>

          <div>
            {resolvedAlerts.map((alert) => (
              <div
                key={alert.alert_id}
                style={{
                  padding: "16px 24px",
                  borderBottom: "1px solid var(--divider)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                  >
                    {alert.driverName}
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--ink-light)",
                    }}
                  >
                    {alert.notes}
                  </div>
                </div>

                <StatusBadge status="resolved" />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Driver Tracking */}
      <div
        style={{
          width: 400,
        }}
      >
        <Card
          padding={0}
          style={{
            overflow: "hidden",
            position: "sticky",
            top: 88,
          }}
        >
          <div
            style={{
              padding: "16px 24px",
              borderBottom: "1px solid var(--divider)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "var(--charcoal-ink)",
                }}
              >
                Live Driver Tracking
              </h3>

              <span
                style={{
                  fontSize: 12,
                  color: "var(--ink-light)",
                }}
              >
                {drivers.length} driver
                {drivers.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          <DriverTrackingMap drivers={drivers} height={500} />
        </Card>
      </div>
    </div>
  );
}
