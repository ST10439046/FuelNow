import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/orders": "Orders Management",
  "/drivers": "Driver Management",
  "/rates": "Fuel Rate Management",
  "/reviews": "Reviews & Ratings",
  "/sos": "SOS Alerts Monitor",
  "/reports": "Reports & Export",
  "/settings": "Admin Settings",
};

interface SOSNotification {
  alert_id: string;
  driver_id: string | null;
  driver_name: string;
  severity: string;
  note: string | null;
  reported_at: string;
}

export default function TopBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<SOSNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(true);

  const title = TITLES[pathname] ?? "FuelNow Admin";

  const now = new Date().toLocaleDateString("en-ZA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const loadNotifications = async () => {
    const { data, error } = await supabase
      .from("sos_alerts")
      .select(
        `
        alert_id,
        driver_id,
        severity,
        note,
        reported_at,
        drivers (
          users (
            full_name
          )
        )
      `,
      )
      .eq("status", "active")
      .order("reported_at", { ascending: false });

    if (error) {
      console.error("Failed to load SOS notifications:", error);
      setLoadingNotifications(false);
      return;
    }

    const mapped: SOSNotification[] = (data ?? []).map((alert: any) => ({
      alert_id: alert.alert_id,
      driver_id: alert.driver_id,
      driver_name: alert.drivers?.users?.full_name || "Unknown Driver",
      severity: alert.severity || "high",
      note: alert.note || null,
      reported_at: alert.reported_at,
    }));

    setNotifications(mapped);
    setLoadingNotifications(false);
  };

  useEffect(() => {
    loadNotifications();

    const channel = supabase
      .channel("topbar-sos-notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sos_alerts",
        },
        () => {
          loadNotifications();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString("en-ZA", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-ZA", {
      day: "2-digit",
      month: "short",
    });
  };

  const getSeverityStyle = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
      case "high":
        return {
          background: "#FEE2E2",
          color: "#B91C1C",
        };

      case "medium":
        return {
          background: "#FEF3C7",
          color: "#B45309",
        };

      default:
        return {
          background: "#E5E7EB",
          color: "#374151",
        };
    }
  };

  const handleNotificationClick = (alert: SOSNotification) => {
    setShowNotifications(false);

    navigate("/sos", {
      state: {
        selectedAlertId: alert.alert_id,
      },
    });
  };

  return (
    <header
      style={{
        height: "var(--topbar-height)",
        background: "var(--white)",
        borderBottom: "1px solid var(--divider)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 32px",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div>
        <h1
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "var(--charcoal-ink)",
            lineHeight: 1.1,
          }}
        >
          {title}
        </h1>

        <p
          style={{
            fontSize: 12,
            color: "var(--ink-faint)",
            marginTop: 2,
          }}
        >
          {now}
        </p>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        {/* Live indicator */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "var(--green-light)",
            padding: "4px 12px",
            borderRadius: 99,
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "var(--diesel-green)",
              animation: "pulse 2s infinite",
            }}
          />

          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "#15803D",
            }}
          >
            Live
          </span>
        </div>

        {/* Notification bell */}
        <div
          style={{
            position: "relative",
          }}
        >
          <button
            type="button"
            onClick={() => setShowNotifications((value) => !value)}
            aria-label="SOS notifications"
            style={{
              width: 38,
              height: 38,
              border: "none",
              background: showNotifications ? "#F3F4F6" : "transparent",
              borderRadius: 10,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              fontSize: 20,
            }}
          >
            🔔
            {notifications.length > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: 1,
                  right: 1,
                  minWidth: 16,
                  height: 16,
                  padding: "0 4px",
                  background: "var(--signal-red)",
                  borderRadius: 99,
                  border: "2px solid #fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 9,
                  color: "#fff",
                  fontWeight: 700,
                }}
              >
                {notifications.length > 99 ? "99+" : notifications.length}
              </span>
            )}
          </button>

          {/* Notification dropdown */}
          {showNotifications && (
            <div
              style={{
                position: "absolute",
                top: 46,
                right: 0,
                width: 380,
                background: "#fff",
                border: "1px solid var(--divider)",
                borderRadius: 14,
                boxShadow: "0 12px 35px rgba(0, 0, 0, 0.12)",
                overflow: "hidden",
                zIndex: 100,
              }}
            >
              {/* Header */}
              <div
                style={{
                  padding: "16px 18px",
                  borderBottom: "1px solid var(--divider)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: "var(--charcoal-ink)",
                    }}
                  >
                    SOS Alerts
                  </div>

                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--ink-faint)",
                      marginTop: 2,
                    }}
                  >
                    Active emergency alerts
                  </div>
                </div>

                {notifications.length > 0 && (
                  <span
                    style={{
                      background: "#FEE2E2",
                      color: "#B91C1C",
                      padding: "4px 8px",
                      borderRadius: 99,
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {notifications.length} Active
                  </span>
                )}
              </div>

              {/* Notification list */}
              <div
                style={{
                  maxHeight: 420,
                  overflowY: "auto",
                }}
              >
                {loadingNotifications ? (
                  <div
                    style={{
                      padding: "30px 20px",
                      textAlign: "center",
                      fontSize: 13,
                      color: "var(--ink-faint)",
                    }}
                  >
                    Loading SOS alerts...
                  </div>
                ) : notifications.length === 0 ? (
                  <div
                    style={{
                      padding: "35px 20px",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 28,
                        marginBottom: 8,
                      }}
                    >
                      ✓
                    </div>

                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--charcoal-ink)",
                      }}
                    >
                      No active SOS alerts
                    </div>

                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--ink-faint)",
                        marginTop: 4,
                      }}
                    >
                      Everything is currently clear.
                    </div>
                  </div>
                ) : (
                  notifications.map((alert) => {
                    const severityStyle = getSeverityStyle(alert.severity);

                    return (
                      <button
                        key={alert.alert_id}
                        type="button"
                        onClick={() => handleNotificationClick(alert)}
                        style={{
                          width: "100%",
                          border: "none",
                          borderBottom: "1px solid var(--divider)",
                          background: "#fff",
                          padding: "14px 16px",
                          textAlign: "left",
                          cursor: "pointer",
                          display: "flex",
                          gap: 12,
                          transition: "background 0.15s ease",
                        }}
                        onMouseEnter={(event) => {
                          event.currentTarget.style.background = "#F9FAFB";
                        }}
                        onMouseLeave={(event) => {
                          event.currentTarget.style.background = "#fff";
                        }}
                      >
                        {/* Alert indicator */}
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            flexShrink: 0,
                            borderRadius: 10,
                            background: "#FEE2E2",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 18,
                          }}
                        >
                          🚨
                        </div>

                        {/* Content */}
                        <div
                          style={{
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 8,
                            }}
                          >
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: "var(--charcoal-ink)",
                              }}
                            >
                              SOS Alert
                            </span>

                            <span
                              style={{
                                ...severityStyle,
                                padding: "3px 7px",
                                borderRadius: 6,
                                fontSize: 9,
                                fontWeight: 700,
                                textTransform: "uppercase",
                              }}
                            >
                              {alert.severity}
                            </span>
                          </div>

                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: "#374151",
                              marginTop: 4,
                            }}
                          >
                            {alert.driver_name}
                          </div>

                          {alert.note && (
                            <div
                              style={{
                                fontSize: 11,
                                color: "var(--ink-faint)",
                                marginTop: 3,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {alert.note}
                            </div>
                          )}

                          <div
                            style={{
                              fontSize: 10,
                              color: "var(--ink-faint)",
                              marginTop: 5,
                            }}
                          >
                            {formatDate(alert.reported_at)} at{" "}
                            {formatTime(alert.reported_at)}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setShowNotifications(false);
                    navigate("/sos");
                  }}
                  style={{
                    width: "100%",
                    border: "none",
                    background: "#F9FAFB",
                    padding: "12px",
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--diesel-green)",
                    cursor: "pointer",
                  }}
                >
                  View all SOS alerts
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
