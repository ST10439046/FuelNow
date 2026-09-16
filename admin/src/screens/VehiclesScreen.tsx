
import { useEffect, useState } from "react";
import Card from "../components/Card";
import DataTable, { type Column } from "../components/DataTable";
import {
  vehicleRepository,
  type VehicleModel,
  type DriverOption,
} from "../repositories/VehicleRepository";

interface VehicleFormData {
  registrationNumber: string;
  make: string;
  model: string;
  capacityLitres: string;
}

const emptyForm: VehicleFormData = {
  registrationNumber: "",
  make: "",
  model: "",
  capacityLitres: "",
};

export default function VehiclesScreen() {
  const [vehicles, setVehicles] = useState<VehicleModel[]>([]);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const [editingVehicle, setEditingVehicle] = useState<VehicleModel | null>(
    null,
  );
  const [assigningVehicle, setAssigningVehicle] =
    useState<VehicleModel | null>(null);

  const [form, setForm] = useState<VehicleFormData>(emptyForm);
  const [selectedDriverId, setSelectedDriverId] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const [vehicleData, driverData] = await Promise.all([
        vehicleRepository.getAllVehicles(),
        vehicleRepository.getAvailableDrivers(),
      ]);

      setVehicles(vehicleData);
      setDrivers(driverData);
    } catch (err: any) {
      console.error("Failed to load vehicles:", err);
      setError(err?.message || "Failed to load vehicles.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingVehicle(null);
    setForm(emptyForm);
    setShowVehicleModal(true);
  };

  const openEditModal = (vehicle: VehicleModel) => {
    setEditingVehicle(vehicle);

    setForm({
      registrationNumber: vehicle.registrationNumber,
      make: vehicle.make,
      model: vehicle.model,
      capacityLitres: String(vehicle.capacityLitres),
    });

    setShowVehicleModal(true);
  };

  const closeVehicleModal = () => {
    if (saving) return;

    setShowVehicleModal(false);
    setEditingVehicle(null);
    setForm(emptyForm);
  };

  const handleFormChange = (field: keyof VehicleFormData, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSaveVehicle = async () => {
    if (
      !form.registrationNumber.trim() ||
      !form.make.trim() ||
      !form.model.trim() ||
      !form.capacityLitres.trim()
    ) {
      window.alert("Please complete all vehicle fields.");
      return;
    }

    const capacity = Number(form.capacityLitres);

    if (!Number.isFinite(capacity) || capacity <= 0) {
      window.alert("Capacity must be a valid number greater than 0.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        registrationNumber: form.registrationNumber.trim().toUpperCase(),
        make: form.make.trim(),
        model: form.model.trim(),
        capacityLitres: capacity,
      };

      if (editingVehicle) {
        await vehicleRepository.updateVehicle(
          editingVehicle.vehicleId,
          payload,
        );
      } else {
        await vehicleRepository.createVehicle(payload);
      }

      closeVehicleModal();
      await loadData();
    } catch (err: any) {
      console.error("Failed to save vehicle:", err);

      if (err?.code === "23505") {
        window.alert("A vehicle with this registration number already exists.");
      } else {
        window.alert(err?.message || "Failed to save vehicle.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVehicle = async (vehicle: VehicleModel) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete vehicle ${vehicle.registrationNumber}?`,
    );

    if (!confirmed) return;

    try {
      setSaving(true);

      await vehicleRepository.deleteVehicle(vehicle.vehicleId);

      await loadData();
    } catch (err: any) {
      console.error("Failed to delete vehicle:", err);
      window.alert(err?.message || "Failed to delete vehicle.");
    } finally {
      setSaving(false);
    }
  };

  const openAssignModal = async (vehicle: VehicleModel) => {
    try {
      setError("");

      const vehicleDrivers = await vehicleRepository.getDriversForVehicle(
        vehicle.vehicleId,
      );

      setAssigningVehicle(vehicle);
      setDrivers(vehicleDrivers);
      setSelectedDriverId(vehicle.driverId || "");
      setShowAssignModal(true);
    } catch (err: any) {
      console.error("Failed to load drivers:", err);
      window.alert(err?.message || "Failed to load drivers.");
    }
  };

  const closeAssignModal = () => {
    if (saving) return;

    setShowAssignModal(false);
    setAssigningVehicle(null);
    setSelectedDriverId("");
  };

  const handleAssignDriver = async () => {
    if (!assigningVehicle) return;

    try {
      setSaving(true);

      await vehicleRepository.assignDriver(
        assigningVehicle.vehicleId,
        selectedDriverId || null,
      );

      closeAssignModal();

      await loadData();
    } catch (err: any) {
      console.error("Failed to assign driver:", err);

      if (err?.code === "23505") {
        window.alert("This driver is already assigned to another vehicle.");
      } else {
        window.alert(err?.message || "Failed to assign driver.");
      }
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<VehicleModel>[] = [
    {
      key: "registrationNumber",
      label: "Registration",
      sortable: true,
    },
    {
      key: "make",
      label: "Make",
      sortable: true,
    },
    {
      key: "model",
      label: "Model",
      sortable: true,
    },
    {
      key: "capacityLitres",
      label: "Capacity",
      sortable: true,
      render: (value) => `${value} L`,
    },
    {
      key: "driverName",
      label: "Assigned Driver",
      sortable: true,
      render: (value) =>
        value ? (
          <span>{value}</span>
        ) : (
          <span
            style={{
              color: "var(--muted)",
              fontStyle: "italic",
            }}
          >
            Unassigned
          </span>
        ),
    },
    {
      key: "actions",
      label: "Actions",
      sortable: false,
      render: (_value, vehicle) => (
        <div
          style={{
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={() => openAssignModal(vehicle)}
            style={{
              padding: "7px 12px",
              borderRadius: "7px",
              border: "1px solid var(--divider)",
              background: "var(--card-bg)",
              color: "#000000",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {vehicle.driverId ? "Change Driver" : "Assign Driver"}
          </button>

          <button
            type="button"
            onClick={() => openEditModal(vehicle)}
            style={{
              padding: "7px 12px",
              borderRadius: "7px",
              border: "1px solid var(--divider)",
              background: "var(--card-bg)",
              color: "#000000",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Edit
          </button>

          <button
            type="button"
            onClick={() => handleDeleteVehicle(vehicle)}
            disabled={saving}
            style={{
              padding: "7px 12px",
              borderRadius: "7px",
              border: "1px solid #dc2626",
              background: "transparent",
              color: "#000000",
              cursor: saving ? "not-allowed" : "pointer",
              fontWeight: 600,
            }}
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  const assignedCount = vehicles.filter((vehicle) => vehicle.driverId).length;
  const unassignedCount = vehicles.length - assignedCount;

  return (
    <div
      style={{
        padding: "24px",
        maxWidth: "1600px",
        margin: "0 auto",
      }}
    >
      {/* Page Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "20px",
          marginBottom: "24px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "28px",
              fontWeight: 700,
            }}
          >
            Vehicles
          </h1>

          <p
            style={{
              margin: "6px 0 0",
              color: "var(--muted)",
            }}
          >
            Manage FuelNow vehicles and driver assignments.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          disabled={saving}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "11px 18px",
            border: "none",
            borderRadius: "8px",
            background: "#f59e0b",
            color: "#000000",
            fontWeight: 700,
            cursor: saving ? "not-allowed" : "pointer",
            fontSize: "14px",
            opacity: saving ? 0.7 : 1,
          }}
        >
          <span
            style={{
              fontSize: "18px",
              lineHeight: 1,
              color: "#000000",
            }}
          >
            +
          </span>
          Add Vehicle
        </button>
      </div>

      {/* Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <Card>
          <div style={{ padding: "18px" }}>
            <div
              style={{
                color: "var(--muted)",
                fontSize: "13px",
                marginBottom: "6px",
              }}
            >
              Total Vehicles
            </div>

            <div
              style={{
                fontSize: "28px",
                fontWeight: 700,
              }}
            >
              {vehicles.length}
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ padding: "18px" }}>
            <div
              style={{
                color: "var(--muted)",
                fontSize: "13px",
                marginBottom: "6px",
              }}
            >
              Assigned
            </div>

            <div
              style={{
                fontSize: "28px",
                fontWeight: 700,
              }}
            >
              {assignedCount}
            </div>
          </div>
        </Card>

        <Card>
          <div style={{ padding: "18px" }}>
            <div
              style={{
                color: "var(--muted)",
                fontSize: "13px",
                marginBottom: "6px",
              }}
            >
              Unassigned
            </div>

            <div
              style={{
                fontSize: "28px",
                fontWeight: 700,
              }}
            >
              {unassignedCount}
            </div>
          </div>
        </Card>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            marginBottom: "16px",
            padding: "14px 16px",
            borderRadius: "8px",
            background: "#fee2e2",
            color: "#991b1b",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <span>{error}</span>

          <button
            type="button"
            onClick={loadData}
            style={{
              padding: "7px 12px",
              borderRadius: "6px",
              border: "1px solid #991b1b",
              background: "transparent",
              color: "#000000",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Vehicles Table */}
      <Card>
        <div style={{ padding: "20px" }}>
          <DataTable
            data={vehicles}
            columns={columns}
            rowKey="vehicleId"
            emptyMessage="No vehicles found."
          />
        </div>
      </Card>

      {/* ADD / EDIT VEHICLE MODAL */}
      {showVehicleModal && (
        <div
          onClick={closeVehicleModal}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "520px",
              background: "var(--card-bg)",
              borderRadius: "12px",
              boxShadow: "var(--shadow-md)",
              padding: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "21px",
                }}
              >
                {editingVehicle ? "Edit Vehicle" : "Add Vehicle"}
              </h2>

              <button
                type="button"
                onClick={closeVehicleModal}
                disabled={saving}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#000000",
                  fontSize: "24px",
                  cursor: saving ? "not-allowed" : "pointer",
                }}
              >
                ×
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gap: "16px",
              }}
            >
              <label>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    marginBottom: "6px",
                  }}
                >
                  Registration Number
                </div>

                <input
                  value={form.registrationNumber}
                  onChange={(event) =>
                    handleFormChange("registrationNumber", event.target.value)
                  }
                  placeholder="e.g. ND 12345"
                  style={inputStyle}
                />
              </label>

              <label>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    marginBottom: "6px",
                  }}
                >
                  Make
                </div>

                <input
                  value={form.make}
                  onChange={(event) =>
                    handleFormChange("make", event.target.value)
                  }
                  placeholder="e.g. Isuzu"
                  style={inputStyle}
                />
              </label>

              <label>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    marginBottom: "6px",
                  }}
                >
                  Model
                </div>

                <input
                  value={form.model}
                  onChange={(event) =>
                    handleFormChange("model", event.target.value)
                  }
                  placeholder="e.g. NQR"
                  style={inputStyle}
                />
              </label>

              <label>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    marginBottom: "6px",
                  }}
                >
                  Capacity (Litres)
                </div>

                <input
                  type="number"
                  min="1"
                  value={form.capacityLitres}
                  onChange={(event) =>
                    handleFormChange("capacityLitres", event.target.value)
                  }
                  placeholder="e.g. 5000"
                  style={inputStyle}
                />
              </label>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                marginTop: "24px",
              }}
            >
              <button
                type="button"
                onClick={closeVehicleModal}
                disabled={saving}
                style={secondaryButtonStyle}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSaveVehicle}
                disabled={saving}
                style={primaryButtonStyle}
              >
                {saving
                  ? "Saving..."
                  : editingVehicle
                    ? "Save Changes"
                    : "Add Vehicle"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGN DRIVER MODAL */}
      {showAssignModal && assigningVehicle && (
        <div
          onClick={closeAssignModal}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "500px",
              background: "var(--card-bg)",
              borderRadius: "12px",
              boxShadow: "var(--shadow-md)",
              padding: "24px",
            }}
          >
            <div
              style={{
                marginBottom: "22px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "21px",
                }}
              >
                Assign Driver
              </h2>

              <p
                style={{
                  margin: "7px 0 0",
                  color: "var(--muted)",
                  fontSize: "14px",
                }}
              >
                Vehicle: <strong>{assigningVehicle.registrationNumber}</strong>
              </p>
            </div>

            <label>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  marginBottom: "7px",
                }}
              >
                Driver
              </div>

              <select
                value={selectedDriverId}
                onChange={(event) => setSelectedDriverId(event.target.value)}
                style={inputStyle}
              >
                <option value="">Unassigned</option>

                {drivers.map((driver) => (
                  <option key={driver.driverId} value={driver.driverId}>
                    {driver.name} • {driver.licenceNumber}
                  </option>
                ))}
              </select>
            </label>

            <div
              style={{
                marginTop: "12px",
                padding: "11px 13px",
                borderRadius: "7px",
                background: "rgba(0, 0, 0, 0.04)",
                color: "var(--muted)",
                fontSize: "13px",
              }}
            >
              Selecting <strong>Unassigned</strong> will remove the current
              driver from this vehicle.
            </div>

            {/* MODAL BUTTONS */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                marginTop: "24px",
              }}
            >
              <button
                type="button"
                onClick={closeAssignModal}
                disabled={saving}
                style={secondaryButtonStyle}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleAssignDriver}
                disabled={saving}
                style={primaryButtonStyle}
              >
                {saving ? "Saving..." : "Assign Driver"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "10px 12px",
  borderRadius: "7px",
  border: "1px solid var(--divider)",
  background: "var(--card-bg)",
  color: "inherit",
  fontSize: "14px",
  outline: "none",
};

const primaryButtonStyle: React.CSSProperties = {
  padding: "10px 17px",
  borderRadius: "7px",
  border: "none",
  background: "var(--petrol)",
  color: "#000000",
  cursor: "pointer",
  fontWeight: 700,
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: "10px 17px",
  borderRadius: "7px",
  border: "1px solid var(--divider)",
  background: "transparent",
  color: "#000000",
  cursor: "pointer",
  fontWeight: 600,
};
