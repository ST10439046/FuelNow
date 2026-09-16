import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export interface DriverLocation {
  id: string;
  name: string;
  phone?: string;
  vehicleReg?: string;
  latitude: number;
  longitude: number;
  status?: string;
}

interface DriverTrackingMapProps {
  drivers: DriverLocation[];
  height?: number;
}

function isValidCoordinate(
  latitude: number | undefined | null,
  longitude: number | undefined | null,
) {
  return (
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180 &&
    !(latitude === 0 && longitude === 0)
  );
}

function getDriverColor(status?: string) {
  switch (String(status ?? "").toLowerCase()) {
    case "online":
    case "available":
    case "on duty":
    case "active":
      return "#22C55E";

    case "busy":
    case "on_delivery":
    case "on delivery":
      return "#F97316";

    case "offline":
    case "inactive":
      return "#9CA3AF";

    default:
      return "#2563EB";
  }
}

function getStatusText(status?: string) {
  if (!status) {
    return "Unknown";
  }

  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function DriverTrackingMap({
  drivers,
  height = 500,
}: DriverTrackingMapProps) {
  const validDrivers = drivers.filter((driver) =>
    isValidCoordinate(driver.latitude, driver.longitude),
  );

  return (
    <div
      style={{
        width: "100%",
        height,
        position: "relative",
      }}
    >
      <MapContainer
        center={[-29.8587, 31.0218]}
        zoom={11}
        scrollWheelZoom={true}
        style={{
          width: "100%",
          height: "100%",
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {validDrivers.map((driver) => {
          const markerColor = getDriverColor(driver.status);

          return (
            <CircleMarker
              key={driver.id}
              center={[driver.latitude, driver.longitude]}
              radius={9}
              pathOptions={{
                color: "#FFFFFF",
                weight: 2,
                fillColor: markerColor,
                fillOpacity: 0.95,
              }}
            >
              <Popup>
                <div
                  style={{
                    minWidth: 210,
                    fontSize: 13,
                    lineHeight: 1.5,
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      marginBottom: 8,
                    }}
                  >
                    FuelNow Driver
                  </div>

                  <div>
                    <strong>Driver:</strong> {driver.name || "Unknown"}
                  </div>

                  {driver.phone && (
                    <div>
                      <strong>Phone:</strong> {driver.phone}
                    </div>
                  )}

                  {driver.vehicleReg && (
                    <div>
                      <strong>Vehicle:</strong> {driver.vehicleReg}
                    </div>
                  )}

                  <div>
                    <strong>Status:</strong> {getStatusText(driver.status)}
                  </div>

                  <div>
                    <strong>Location:</strong> {driver.latitude.toFixed(5)},{" "}
                    {driver.longitude.toFixed(5)}
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {validDrivers.length === 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              background: "rgba(255,255,255,0.92)",
              padding: "10px 16px",
              borderRadius: 8,
              fontSize: 13,
              boxShadow: "0 2px 10px rgba(0,0,0,0.12)",
            }}
          >
            No driver locations available
          </div>
        </div>
      )}
    </div>
  );
}
