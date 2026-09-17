import { useEffect, useState } from "react";
import {
  driverRepository,
  type DriverModel as Driver,
  type DriverVehicleModel,
} from "../repositories/DriverRepository";

const PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
];

import Card from "../components/Card";
import DataTable, { type Column } from "../components/DataTable";
import StatusBadge from "../components/StatusBadge";
import Button from "../components/Button";
import Input from "../components/Input";

export default function DriversScreen() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<DriverVehicleModel[]>([]);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);

  const [generatedPassword, setGeneratedPassword] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    zone: "",
    province: "KwaZulu-Natal",
    vehicleId: "",
  });

  const generatePassword = (): string => {
    const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lowercase = "abcdefghijkmnopqrstuvwxyz";
    const numbers = "23456789";
    const symbols = "!@#$%^&*";

    const allCharacters = uppercase + lowercase + numbers + symbols;

    const randomCharacter = (characters: string): string => {
      const array = new Uint32Array(1);

      crypto.getRandomValues(array);

      return characters[array[0] % characters.length];
    };

    const passwordCharacters = [
      randomCharacter(uppercase),
      randomCharacter(lowercase),
      randomCharacter(numbers),
      randomCharacter(symbols),
    ];

    while (passwordCharacters.length < 14) {
      passwordCharacters.push(randomCharacter(allCharacters));
    }

    for (let i = passwordCharacters.length - 1; i > 0; i--) {
      const array = new Uint32Array(1);

      crypto.getRandomValues(array);

      const j = array[0] % (i + 1);

      [passwordCharacters[i], passwordCharacters[j]] = [
        passwordCharacters[j],
        passwordCharacters[i],
      ];
    }

    return passwordCharacters.join("");
  };

  const fetchDrivers = async () => {
    const data = await driverRepository.getAllDrivers();

    setDrivers(data);
  };

  const fetchVehicles = async (driverId?: string) => {
    setVehiclesLoading(true);

    try {
      const data = await driverRepository.getAvailableVehicles(driverId);

      setVehicles(data);
    } finally {
      setVehiclesLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers().catch((error) => {
      console.error("Failed to load drivers:", error);
    });
  }, []);

  const openAddModal = async () => {
    setEditingDriver(null);
    setGeneratedPassword("");

    setFormData({
      name: "",
      phone: "",
      email: "",
      zone: "",
      province: "KwaZulu-Natal",
      vehicleId: "",
    });

    setIsModalOpen(true);

    try {
      await fetchVehicles();
    } catch (error) {
      console.error("Failed to load vehicles:", error);

      alert("Failed to load available vehicles.");
    }
  };

  const openEditModal = async (driver: Driver) => {
    setLoading(true);
    setGeneratedPassword("");

    try {
      const freshDriver = await driverRepository.getDriver(driver.id);

      setEditingDriver(freshDriver);

      setFormData({
        name: freshDriver.name,
        phone: freshDriver.phone,
        email: freshDriver.email,
        zone: freshDriver.zone,
        province: freshDriver.province || "KwaZulu-Natal",
        vehicleId: freshDriver.vehicleId || "",
      });

      await fetchVehicles(freshDriver.id);

      setIsModalOpen(true);
    } catch (error) {
      console.error("Failed to load driver details:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to load driver details.",
      );
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDriver(null);
    setVehicles([]);
    setGeneratedPassword("");
  };

  const selectedVehicle =
    vehicles.find((vehicle) => vehicle.vehicleId === formData.vehicleId) ??
    (editingDriver?.vehicleId === formData.vehicleId && editingDriver.vehicleId
      ? {
          vehicleId: editingDriver.vehicleId,

          registrationNumber: editingDriver.vehicleReg,

          make: editingDriver.vehicleMake,

          model: editingDriver.vehicleModel,

          capacityLitres: editingDriver.vehicleCapacity,

          driverId: editingDriver.id,
        }
      : null);

  const handleVehicleChange = (vehicleId: string) => {
    setFormData((current) => ({
      ...current,
      vehicleId,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanName = formData.name.trim();

    const cleanEmail = formData.email.trim().toLowerCase();

    const cleanPhone = formData.phone.trim();

    const cleanZone = formData.zone.trim();

    if (!cleanName) {
      alert("Driver name is required.");
      return;
    }

    if (!cleanPhone) {
      alert("Phone number is required.");
      return;
    }

    if (!cleanEmail) {
      alert("Email address is required.");
      return;
    }

    if (!cleanZone) {
      alert("Assigned zone is required.");
      return;
    }

    setLoading(true);

    try {
      if (editingDriver) {
        await driverRepository.updateDriver(editingDriver.id, {
          name: cleanName,
          phone: cleanPhone,
          zone: cleanZone,
          province: formData.province,
          vehicleId: formData.vehicleId || "",
        });

        await fetchDrivers();

        closeModal();

        return;
      }

      /*
       * Password is intentionally generated on
       * the frontend because the admin is creating
       * the driver account directly.
       */
      const password = generatePassword();

      setGeneratedPassword(password);

      /*
       * createAuthAccount calls the Edge Function.
       *
       * The Edge Function should:
       *
       * 1. Create auth.users using the email/password.
       * 2. Set email_confirm = true.
       * 3. Create public.users.
       * 4. Set public.users.auth_id to auth.users.id.
       * 5. Return public.users.user_id.
       */
      const authUser = await driverRepository.createAuthAccount(
        cleanEmail,
        password,
        cleanName,
      );

      /*
       * authUser.userId is public.users.user_id.
       *
       * drivers.driver_id references
       * public.users.user_id.
       */
      await driverRepository.addDriver(authUser.userId, {
        name: cleanName,

        phone: cleanPhone,

        email: cleanEmail,

        zone: cleanZone,

        province: formData.province,

        rating: 0,

        vehicleReg: selectedVehicle?.registrationNumber ?? "",

        vehicleModel: selectedVehicle
          ? `${selectedVehicle.make} ${selectedVehicle.model}`
          : "",

        isOnDuty: false,

        isApproved: true,

        coordinates: {
          lat: 0,
          lng: 0,
        },

        dailyTarget: 0,

        status: "inactive",

        licence_number: "",

        truck: selectedVehicle?.registrationNumber ?? "No Vehicle Assigned",

        total_deliveries: 0,

        latitude: 0,

        longitude: 0,

        vehicleId: formData.vehicleId,

        vehicleMake: selectedVehicle?.make ?? "",

        vehicleColor: "",

        stationName: "",

        vehicleCapacity: selectedVehicle?.capacityLitres ?? 0,

        avatar: "",

        compliance: [],
      });

      await fetchDrivers();

      /*
       * The password is only displayed to the
       * administrator. It is not saved in the
       * frontend, public.users, or drivers table.
       */
      alert(
        `Driver account created successfully.\n\nEmail: ${cleanEmail}\nTemporary Password: ${password}\n\nThe driver's email has already been confirmed.\n\nGive these login details to the driver.`,
      );

      closeModal();
    } catch (err) {
      console.error("Failed to save driver:", err);

      alert(err instanceof Error ? err.message : "Failed to save driver.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!editingDriver) {
      return;
    }

    if (!confirm("Are you sure you want to delete this driver?")) {
      return;
    }

    setLoading(true);

    try {
      await driverRepository.deleteDriver(editingDriver.id);

      await fetchDrivers();

      closeModal();
    } catch (err) {
      console.error(err);

      alert(err instanceof Error ? err.message : "Failed to delete driver");
    } finally {
      setLoading(false);
    }
  };

  const filtered = drivers.filter(
    (driver) =>
      driver.name.toLowerCase().includes(search.toLowerCase()) ||
      driver.zone.toLowerCase().includes(search.toLowerCase()) ||
      driver.vehicleReg.toLowerCase().includes(search.toLowerCase()),
  );

  const columns: Column<Driver>[] = [
    {
      key: "name",
      label: "Driver",
      sortable: true,

      render: (_, row) => (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "var(--petrol-deep)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {row.avatar}
          </div>

          <div>
            <div
              style={{
                fontWeight: 600,
              }}
            >
              {row.name}
            </div>

            <div
              style={{
                fontSize: 11,
                color: "var(--ink-faint)",
                marginTop: 2,
              }}
            >
              {row.id} · {row.phone}
            </div>
          </div>
        </div>
      ),
    },

    {
      key: "status",
      label: "Status",

      render: (value) => <StatusBadge status={value} />,
    },

    {
      key: "zone",
      label: "Zone & Province",

      render: (_, row) => (
        <>
          {row.zone}

          <br />

          <span
            style={{
              fontSize: 11,
              color: "var(--ink-faint)",
            }}
          >
            {row.province}
          </span>
        </>
      ),
    },

    {
      key: "truck",
      label: "Assigned Vehicle",

      render: (_, row) => (
        <div>
          {row.vehicleId ? (
            <>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                {row.vehicleMake} {row.vehicleModel}
              </div>

              <div
                style={{
                  fontSize: 11,
                  color: "var(--ink-faint)",
                  marginTop: 3,
                }}
              >
                {row.vehicleReg}

                {row.vehicleCapacity > 0 && ` · ${row.vehicleCapacity} L`}
              </div>
            </>
          ) : (
            <span
              style={{
                fontSize: 12,
                color: "var(--ink-faint)",
              }}
            >
              No Vehicle Assigned
            </span>
          )}
        </div>
      ),
    },

    {
      key: "rating",
      label: "Rating",
      sortable: true,

      render: (value) => (
        <span
          style={{
            fontWeight: 600,
            color: "var(--ignition-amber)",
          }}
        >
          ⭐ {value.toFixed(1)}
        </span>
      ),
    },

    {
      key: "compliance",
      label: "Compliance Status",

      render: (docs) => {
        if (!docs || docs.length === 0) {
          return <StatusBadge status="valid" customLabel="N/A" />;
        }

        const expired = docs.filter(
          (document: any) => document.status === "expired",
        ).length;

        const soon = docs.filter(
          (document: any) => document.status === "expiring_soon",
        ).length;

        if (expired > 0) {
          return (
            <StatusBadge status="expired" customLabel={`${expired} Expired`} />
          );
        }

        if (soon > 0) {
          return (
            <StatusBadge
              status="expiring_soon"
              customLabel={`${soon} Expiring Soon`}
            />
          );
        }

        return <StatusBadge status="valid" customLabel="All Valid" />;
      },
    },

    {
      key: "actions",
      label: "",
      width: 140,

      render: (_, row) => (
        <Button variant="ghost" size="sm" onClick={() => openEditModal(row)}>
          Manage Driver
        </Button>
      ),
    },
  ];

  return (
    <div
      style={{
        animation: "fadeIn 0.3s ease",
        position: "relative",
      }}
    >
      <Card padding={0}>
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--divider)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <Input
            placeholder="Search drivers by name or zone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon="🔍"
            style={{
              width: 320,
            }}
          />

          <Button icon="➕" onClick={openAddModal}>
            Add New Driver
          </Button>
        </div>

        <DataTable columns={columns} data={filtered} rowKey="id" />
      </Card>

      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "var(--overlay)",
            zIndex: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            style={{
              background: "var(--white)",
              width: 500,
              maxWidth: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              borderRadius: "var(--radius-lg)",
              padding: 32,
              boxShadow: "var(--shadow-lg)",
            }}
          >
            <h2
              style={{
                fontSize: 20,
                fontWeight: 700,
                marginBottom: 24,
              }}
            >
              {editingDriver ? "Manage Driver" : "Add New Driver"}
            </h2>

            <form
              onSubmit={handleSubmit}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <Input
                label="Full Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    name: e.target.value,
                  })
                }
                required
              />

              <div
                style={{
                  display: "flex",
                  gap: 16,
                }}
              >
                <div
                  style={{
                    flex: 1,
                  }}
                >
                  <Input
                    label="Phone Number"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        phone: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div
                  style={{
                    flex: 1,
                  }}
                >
                  <Input
                    label="Email Address"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        email: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>

              <Input
                label="Assigned Zone"
                value={formData.zone}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    zone: e.target.value,
                  })
                }
                placeholder="e.g. Durban North"
                required
              />

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <label
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--ink-light)",
                  }}
                >
                  Province
                </label>

                <select
                  value={formData.province}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      province: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "var(--radius-md)",
                    border: "1.5px solid var(--divider)",
                    background: "var(--white)",
                    fontSize: 14,
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  {PROVINCES.map((province) => (
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))}
                </select>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <label
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--ink-light)",
                  }}
                >
                  Assigned Vehicle
                </label>

                <select
                  value={formData.vehicleId}
                  onChange={(e) => handleVehicleChange(e.target.value)}
                  disabled={vehiclesLoading || loading}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "var(--radius-md)",
                    border: "1.5px solid var(--divider)",
                    background: "var(--white)",
                    fontSize: 14,
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  <option value="">No Vehicle Assigned</option>

                  {vehicles.map((vehicle) => (
                    <option key={vehicle.vehicleId} value={vehicle.vehicleId}>
                      {vehicle.registrationNumber} · {vehicle.make}{" "}
                      {vehicle.model}
                    </option>
                  ))}
                </select>

                {vehiclesLoading && (
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--ink-faint)",
                    }}
                  >
                    Loading vehicles...
                  </span>
                )}

                {!vehiclesLoading && vehicles.length === 0 && (
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--ink-faint)",
                    }}
                  >
                    No available vehicles.
                  </span>
                )}

                {selectedVehicle && (
                  <div
                    style={{
                      marginTop: 4,
                      padding: 14,
                      border: "1px solid var(--divider)",
                      borderRadius: "var(--radius-md)",
                      background: "var(--ash)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--ink-faint)",
                        marginBottom: 5,
                      }}
                    >
                      VEHICLE DETAILS
                    </div>

                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 15,
                      }}
                    >
                      {selectedVehicle.make} {selectedVehicle.model}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: 16,
                        marginTop: 7,
                        fontSize: 12,
                        color: "var(--ink-faint)",
                      }}
                    >
                      <span>
                        <strong
                          style={{
                            color: "var(--ink)",
                          }}
                        >
                          Registration:
                        </strong>{" "}
                        {selectedVehicle.registrationNumber}
                      </span>

                      <span>
                        <strong
                          style={{
                            color: "var(--ink)",
                          }}
                        >
                          Capacity:
                        </strong>{" "}
                        {selectedVehicle.capacityLitres} L
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {!editingDriver && generatedPassword && (
                <div
                  style={{
                    padding: 14,
                    border: "1px solid var(--divider)",
                    borderRadius: "var(--radius-md)",
                    background: "var(--ash)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      marginBottom: 6,
                    }}
                  >
                    GENERATED LOGIN PASSWORD
                  </div>

                  <div
                    style={{
                      fontFamily: "monospace",
                      fontSize: 15,
                      fontWeight: 700,
                      letterSpacing: 1,
                    }}
                  >
                    {generatedPassword}
                  </div>

                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 11,
                      color: "var(--ink-faint)",
                    }}
                  >
                    Give this temporary password to the driver.
                  </div>
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 12,
                  marginTop: 16,
                }}
              >
                {editingDriver && (
                  <Button
                    type="button"
                    variant="danger"
                    onClick={handleDelete}
                    disabled={loading}
                    style={{
                      marginRight: "auto",
                    }}
                  >
                    Delete
                  </Button>
                )}

                <Button
                  type="button"
                  variant="ghost"
                  onClick={closeModal}
                  disabled={loading}
                >
                  Cancel
                </Button>

                <Button type="submit" variant="primary" loading={loading}>
                  {editingDriver ? "Save Changes" : "Add Driver"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
