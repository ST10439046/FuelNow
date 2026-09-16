import React, { useEffect, useState } from "react";
import Card from "../components/Card";
import DataTable, { type Column } from "../components/DataTable";
import {
  platformSettingsRepository,
  type PlatformSettings,
} from "../repositories/PlatformSettingsRepository";
import { userRepository } from "../repositories/UserRepository";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  lastLogin: string;
  active: boolean;
}

interface FuelMarkup {
  petrol93: number;
  petrol95: number;
  diesel50: number;
  diesel500: number;
}

const initialFuelMarkup: FuelMarkup = {
  petrol93: 0,
  petrol95: 0,
  diesel50: 0,
  diesel500: 0,
};

export default function SettingsScreen() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [fuelMarkup, setFuelMarkup] = useState<FuelMarkup>(initialFuelMarkup);

  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);

  const [loading, setLoading] = useState(true);
  const [savingFuelMarkup, setSavingFuelMarkup] = useState(false);
  const [savingAutoAssign, setSavingAutoAssign] = useState(false);

  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  const [newAdmin, setNewAdmin] = useState({
    name: "",
    email: "",
    role: "Ops Manager",
  });

  useEffect(() => {
    loadSettings();
    loadAdminUsers();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);

      const data = await platformSettingsRepository.getSettings();

      setSettings(data);

      setFuelMarkup({
        petrol93: Number(data.fuelMarkup?.petrol93 ?? 0),
        petrol95: Number(data.fuelMarkup?.petrol95 ?? 0),
        diesel50: Number(data.fuelMarkup?.diesel50 ?? 0),
        diesel500: Number(data.fuelMarkup?.diesel500 ?? 0),
      });
    } catch (error) {
      console.error("Failed to load platform settings:", error);

      window.alert("Failed to load platform settings.");
    } finally {
      setLoading(false);
    }
  };

  const loadAdminUsers = async () => {
    try {
      const users = await userRepository.getAdminUsers();

      setAdminUsers(users);
    } catch (error) {
      console.error("Failed to load admin users:", error);
    }
  };

  const handleAutoAssignToggle = async () => {
    if (!settings || savingAutoAssign) {
      return;
    }

    const previousValue = settings.autoAssignOrders;

    const newValue = !previousValue;

    setSettings({
      ...settings,
      autoAssignOrders: newValue,
    });

    try {
      setSavingAutoAssign(true);

      await platformSettingsRepository.updateSettings({
        autoAssignOrders: newValue,

        // Keep this value in the database even though
        // the setting is no longer shown on this page.
        customerSmsNotifications: settings.customerSmsNotifications,

        fuelMarkup: settings.fuelMarkup,
      });
    } catch (error) {
      console.error("Failed to update Auto Assign Orders:", error);

      setSettings({
        ...settings,
        autoAssignOrders: previousValue,
      });

      window.alert("Failed to update Auto Assign Orders.");
    } finally {
      setSavingAutoAssign(false);
    }
  };

  const handleFuelMarkupChange = (key: keyof FuelMarkup, value: string) => {
    if (value === "") {
      setFuelMarkup((current) => ({
        ...current,
        [key]: 0,
      }));

      return;
    }

    const numericValue = Number(value);

    if (Number.isNaN(numericValue)) {
      return;
    }

    const clampedValue = Math.min(100, Math.max(0, numericValue));

    setFuelMarkup((current) => ({
      ...current,
      [key]: clampedValue,
    }));
  };

  const saveFuelMarkup = async () => {
    if (!settings || savingFuelMarkup) {
      return;
    }

    try {
      setSavingFuelMarkup(true);

      await platformSettingsRepository.updateSettings({
        autoAssignOrders: settings.autoAssignOrders,

        customerSmsNotifications: settings.customerSmsNotifications,

        fuelMarkup,
      });

      setSettings({
        ...settings,
        fuelMarkup,
        updatedAt: new Date().toISOString(),
      });

      window.alert("Fuel markups saved successfully.");
    } catch (error) {
      console.error("Failed to save fuel markups:", error);

      window.alert("Failed to save fuel markups.");
    } finally {
      setSavingFuelMarkup(false);
    }
  };

  const handleCreateAdmin = async () => {
    if (!newAdmin.name.trim() || !newAdmin.email.trim()) {
      window.alert("Please enter the admin name and email.");

      return;
    }

    try {
      setCreatingAdmin(true);

      await userRepository.createAdminUser({
        name: newAdmin.name.trim(),
        email: newAdmin.email.trim(),
        role: newAdmin.role,
      });

      setNewAdmin({
        name: "",
        email: "",
        role: "Ops Manager",
      });

      setShowAddAdmin(false);

      await loadAdminUsers();

      window.alert("Admin user created successfully.");
    } catch (error) {
      console.error("Failed to create admin user:", error);

      window.alert("Failed to create admin user.");
    } finally {
      setCreatingAdmin(false);
    }
  };

  const formatDate = (date: string) => {
    if (!date) {
      return "Never";
    }

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "Never";
    }

    return parsed.toLocaleString();
  };

  const adminColumns: Column<AdminUser>[] = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (value) => (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "var(--petrol-faint)",
              color: "var(--petrol)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            {String(value || "?")
              .charAt(0)
              .toUpperCase()}
          </div>

          <span
            style={{
              fontWeight: 600,
              color: "var(--charcoal-ink)",
            }}
          >
            {value || "Admin"}
          </span>
        </div>
      ),
    },
    {
      key: "email",
      label: "Email",
      sortable: true,
    },
    {
      key: "role",
      label: "Role",
      sortable: true,
      render: (value) => (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "5px 10px",
            borderRadius: 999,
            background: "var(--ash-dark)",
            color: "var(--charcoal-ink)",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {value}
        </span>
      ),
    },
    {
      key: "lastLogin",
      label: "Last Login",
      sortable: true,
      render: (value) => formatDate(value),
    },
    {
      key: "active",
      label: "Status",
      sortable: true,
      render: (value) => (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 12,
            fontWeight: 600,
            color: value ? "var(--petrol)" : "var(--ink-faint)",
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: value ? "var(--petrol)" : "var(--ink-faint)",
            }}
          />

          {value ? "Active" : "Inactive"}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div
        style={{
          padding: 32,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 400,
          color: "var(--ink-light)",
        }}
      >
        Loading settings...
      </div>
    );
  }

  if (!settings) {
    return (
      <div style={{ padding: 32 }}>
        <Card>
          <div
            style={{
              textAlign: "center",
              color: "var(--ink-light)",
              padding: 24,
            }}
          >
            Platform settings could not be loaded.
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 32,
        maxWidth: 1400,
        margin: "0 auto",
      }}
    >
      {/* Page Header */}
      <div
        style={{
          marginBottom: 28,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 20,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 700,
              color: "var(--charcoal-ink)",
              letterSpacing: "-0.02em",
            }}
          >
            Settings
          </h1>

          <p
            style={{
              margin: "7px 0 0",
              color: "var(--ink-light)",
              fontSize: 14,
            }}
          >
            Manage FuelNow platform configuration and administrator access.
          </p>
        </div>
      </div>

      {/* Platform Settings */}
      <div style={{ marginBottom: 24 }}>
        <Card padding={0}>
          {/* Section Header */}
          <div
            style={{
              padding: "22px 24px",
              borderBottom: "1px solid var(--divider)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: "var(--petrol-faint)",
                  color: "var(--petrol)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                }}
              >
                ⚙
              </div>

              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 18,
                    fontWeight: 700,
                    color: "var(--charcoal-ink)",
                  }}
                >
                  Platform Settings
                </h2>

                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: 13,
                    color: "var(--ink-light)",
                  }}
                >
                  Configure how FuelNow handles orders and pricing.
                </p>
              </div>
            </div>
          </div>

          {/* Auto Assign Orders */}
          <div
            style={{
              padding: 24,
              borderBottom: "1px solid var(--divider)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 24,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 650,
                    color: "var(--charcoal-ink)",
                    marginBottom: 5,
                  }}
                >
                  Auto Assign Orders
                </div>

                <div
                  style={{
                    fontSize: 13,
                    lineHeight: 1.5,
                    color: "var(--ink-light)",
                    maxWidth: 650,
                  }}
                >
                  Automatically assign new fuel orders to an available driver
                  instead of requiring manual assignment.
                </div>
              </div>

              {/* Auto Assign Switch */}
              <label
                style={{
                  position: "relative",
                  display: "inline-block",
                  width: "3.5em",
                  height: "2em",
                  minWidth: "3.5em",
                  fontSize: 17,
                }}
              >
                <input
                  type="checkbox"
                  checked={settings.autoAssignOrders}
                  onChange={handleAutoAssignToggle}
                  disabled={savingAutoAssign}
                  style={{
                    opacity: 0,
                    width: 0,
                    height: 0,
                    position: "absolute",
                  }}
                />

                <span
                  style={{
                    position: "absolute",
                    cursor: savingAutoAssign ? "wait" : "pointer",
                    inset: 0,

                    backgroundColor: settings.autoAssignOrders
                      ? "#f97316"
                      : "#d1d5db",

                    border: "2px solid",
                    borderColor: settings.autoAssignOrders
                      ? "#f97316"
                      : "#9ca3af",

                    borderRadius: 50,

                    transition:
                      "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",

                    boxShadow: settings.autoAssignOrders
                      ? "0 0 14px rgba(249, 115, 22, 0.35)"
                      : "none",

                    opacity: savingAutoAssign ? 0.6 : 1,
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      height: "1.4em",
                      width: "1.4em",
                      left: "0.2em",
                      bottom: "0.2em",
                      backgroundColor: "#ffffff",
                      borderRadius: "50%",
                      transition: "all 0.4s cubic-bezier(0.23, 1, 0.320, 1)",
                      transform: settings.autoAssignOrders
                        ? "translateX(1.5em)"
                        : "translateX(0)",
                      boxShadow: "0 2px 5px rgba(0, 0, 0, 0.25)",
                    }}
                  />
                </span>
              </label>
            </div>

            <div
              style={{
                marginTop: 12,
                display: "flex",
                alignItems: "center",
                gap: 7,
                fontSize: 12,
                fontWeight: 600,
                color: settings.autoAssignOrders
                  ? "#f97316"
                  : "var(--ink-faint)",
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: settings.autoAssignOrders
                    ? "#f97316"
                    : "var(--ink-faint)",
                }}
              />

              {savingAutoAssign
                ? "Saving..."
                : settings.autoAssignOrders
                  ? "Enabled"
                  : "Disabled"}
            </div>
          </div>

          {/* Fuel Markups */}
          <div style={{ padding: 24 }}>
            <div style={{ marginBottom: 20 }}>
              <h3
                style={{
                  margin: 0,
                  fontSize: 15,
                  fontWeight: 700,
                  color: "var(--charcoal-ink)",
                }}
              >
                Fuel Markups
              </h3>

              <p
                style={{
                  margin: "5px 0 0",
                  fontSize: 13,
                  color: "var(--ink-light)",
                }}
              >
                Set the percentage markup applied to each fuel type.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 16,
              }}
            >
              {[
                {
                  key: "petrol93" as const,
                  label: "Petrol 93",
                  description: "Unleaded 93",
                },
                {
                  key: "petrol95" as const,
                  label: "Petrol 95",
                  description: "Unleaded 95",
                },
                {
                  key: "diesel50" as const,
                  label: "Diesel 50ppm",
                  description: "Low sulphur diesel",
                },
                {
                  key: "diesel500" as const,
                  label: "Diesel 500ppm",
                  description: "Standard diesel",
                },
              ].map((fuel) => (
                <div
                  key={fuel.key}
                  style={{
                    border: "1px solid var(--divider)",
                    borderRadius: "var(--radius-lg)",
                    padding: 18,
                    background: "var(--card-bg)",
                  }}
                >
                  {/* Fuel name and editable percentage */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                      marginBottom: 16,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: "var(--charcoal-ink)",
                        }}
                      >
                        {fuel.label}
                      </div>

                      <div
                        style={{
                          marginTop: 3,
                          fontSize: 12,
                          color: "var(--ink-faint)",
                        }}
                      >
                        {fuel.description}
                      </div>
                    </div>

                    {/* Editable percentage */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        border: "1px solid var(--divider)",
                        borderRadius: "var(--radius-md)",
                        background: "var(--white)",
                        overflow: "hidden",
                        width: 82,
                      }}
                    >
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={fuelMarkup[fuel.key]}
                        onChange={(event) =>
                          handleFuelMarkupChange(fuel.key, event.target.value)
                        }
                        style={{
                          width: "100%",
                          border: "none",
                          outline: "none",
                          background: "transparent",
                          padding: "8px 4px 8px 9px",
                          fontSize: 14,
                          fontWeight: 700,
                          color: "#f97316",
                          textAlign: "right",
                        }}
                      />

                      <span
                        style={{
                          paddingRight: 9,
                          fontSize: 14,
                          fontWeight: 700,
                          color: "#f97316",
                        }}
                      >
                        %
                      </span>
                    </div>
                  </div>

                  {/* Range slider */}
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="0.1"
                    value={fuelMarkup[fuel.key]}
                    onChange={(event) =>
                      handleFuelMarkupChange(fuel.key, event.target.value)
                    }
                    style={{
                      width: "100%",
                      accentColor: "#f97316",
                      cursor: "pointer",
                    }}
                  />

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: 7,
                      fontSize: 11,
                      color: "var(--ink-faint)",
                    }}
                  >
                    <span>0%</span>
                    <span>100%</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Save Fuel Markups */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: 20,
              }}
            >
              <button
                type="button"
                onClick={saveFuelMarkup}
                disabled={savingFuelMarkup}
                style={{
                  border: "none",
                  borderRadius: "var(--radius-md)",
                  padding: "10px 18px",
                  background: "#f97316",
                  color: "white",
                  fontWeight: 650,
                  fontSize: 13,
                  cursor: savingFuelMarkup ? "wait" : "pointer",
                  opacity: savingFuelMarkup ? 0.65 : 1,
                  transition: "opacity 0.15s",
                }}
              >
                {savingFuelMarkup ? "Saving..." : "Save Fuel Markups"}
              </button>
            </div>
          </div>
        </Card>
      </div>

      {/* Admin Users */}
      <Card padding={0}>
        <div
          style={{
            padding: "22px 24px",
            borderBottom: "1px solid var(--divider)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "var(--petrol-faint)",
                color: "var(--petrol)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
              }}
            >
              👤
            </div>

            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 700,
                  color: "var(--charcoal-ink)",
                }}
              >
                Administrator Access
              </h2>

              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: 13,
                  color: "var(--ink-light)",
                }}
              >
                Manage users who have access to the FuelNow administration
                portal.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAddAdmin(true)}
            style={{
              border: "none",
              borderRadius: "var(--radius-md)",
              padding: "10px 15px",
              background: "var(--petrol)",
              color: "white",
              fontWeight: 650,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            + Add Admin
          </button>
        </div>

        <div style={{ padding: 20 }}>
          <DataTable
            columns={adminColumns}
            data={adminUsers}
            rowKey="id"
            emptyMessage="No administrator accounts found."
          />
        </div>
      </Card>

      {/* Add Admin Modal */}
      {showAddAdmin && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            zIndex: 1000,
          }}
        >
          <Card
            padding={0}
            style={{
              width: "100%",
              maxWidth: 480,
              boxShadow: "0 20px 50px rgba(0,0,0,0.18)",
            }}
          >
            <div
              style={{
                padding: 22,
                borderBottom: "1px solid var(--divider)",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: 19,
                  fontWeight: 700,
                  color: "var(--charcoal-ink)",
                }}
              >
                Add Administrator
              </h2>

              <p
                style={{
                  margin: "5px 0 0",
                  fontSize: 13,
                  color: "var(--ink-light)",
                }}
              >
                Create an administrator access request.
              </p>
            </div>

            <div style={{ padding: 22 }}>
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: 7,
                    fontSize: 12,
                    fontWeight: 650,
                    color: "var(--charcoal-ink)",
                  }}
                >
                  Full Name
                </label>

                <input
                  type="text"
                  value={newAdmin.name}
                  onChange={(event) =>
                    setNewAdmin({
                      ...newAdmin,
                      name: event.target.value,
                    })
                  }
                  placeholder="Enter full name"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "10px 12px",
                    border: "1px solid var(--divider)",
                    borderRadius: "var(--radius-md)",
                    fontSize: 13,
                    outline: "none",
                    background: "var(--card-bg)",
                    color: "var(--charcoal-ink)",
                  }}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: 7,
                    fontSize: 12,
                    fontWeight: 650,
                    color: "var(--charcoal-ink)",
                  }}
                >
                  Email Address
                </label>

                <input
                  type="email"
                  value={newAdmin.email}
                  onChange={(event) =>
                    setNewAdmin({
                      ...newAdmin,
                      email: event.target.value,
                    })
                  }
                  placeholder="admin@example.com"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "10px 12px",
                    border: "1px solid var(--divider)",
                    borderRadius: "var(--radius-md)",
                    fontSize: 13,
                    outline: "none",
                    background: "var(--card-bg)",
                    color: "var(--charcoal-ink)",
                  }}
                />
              </div>

              <div style={{ marginBottom: 22 }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: 7,
                    fontSize: 12,
                    fontWeight: 650,
                    color: "var(--charcoal-ink)",
                  }}
                >
                  Role
                </label>

                <select
                  value={newAdmin.role}
                  onChange={(event) =>
                    setNewAdmin({
                      ...newAdmin,
                      role: event.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "10px 12px",
                    border: "1px solid var(--divider)",
                    borderRadius: "var(--radius-md)",
                    fontSize: 13,
                    outline: "none",
                    background: "var(--card-bg)",
                    color: "var(--charcoal-ink)",
                  }}
                >
                  <option>Super Admin</option>
                  <option>Ops Manager</option>
                  <option>Support Agent</option>
                </select>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 10,
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowAddAdmin(false)}
                  disabled={creatingAdmin}
                  style={{
                    border: "1px solid var(--divider)",
                    borderRadius: "var(--radius-md)",
                    padding: "10px 16px",
                    background: "var(--card-bg)",
                    color: "var(--charcoal-ink)",
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleCreateAdmin}
                  disabled={creatingAdmin}
                  style={{
                    border: "none",
                    borderRadius: "var(--radius-md)",
                    padding: "10px 16px",
                    background: "var(--petrol)",
                    color: "white",
                    fontWeight: 650,
                    fontSize: 13,
                    cursor: creatingAdmin ? "wait" : "pointer",
                    opacity: creatingAdmin ? 0.65 : 1,
                  }}
                >
                  {creatingAdmin ? "Creating..." : "Create Admin"}
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
