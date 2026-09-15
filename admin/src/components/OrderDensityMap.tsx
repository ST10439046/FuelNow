import { useEffect } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";

import type { OrderModel } from "../repositories/OrderRepository";

interface OrderDensityMapProps {
  orders: OrderModel[];
  height?: number;
}

interface HeatmapLayerProps {
  points: [number, number, number][];
}

function HeatmapLayer({ points }: HeatmapLayerProps) {
  const map = useMap();

  useEffect(() => {
    const heatLayer = (L as any).heatLayer(points, {
      radius: 35,
      blur: 25,
      maxZoom: 15,
      max: 1,
      minOpacity: 0.35,
      gradient: {
        0.2: "#2563EB",
        0.45: "#22C55E",
        0.7: "#FACC15",
        0.85: "#F97316",
        1.0: "#EF4444",
      },
    });

    heatLayer.addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points]);

  return null;
}

function isValidCoordinate(
  latitude: number | undefined,
  longitude: number | undefined,
) {
  return (
    typeof latitude === "number" &&
    typeof longitude === "number" &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

function formatCurrency(value: number | null | undefined) {
  return `R ${Number(value ?? 0).toLocaleString("en-ZA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getFuelName(item: OrderModel["item"]): string {
  if (!item) {
    return "Unknown";
  }

  if (typeof item === "string") {
    return item;
  }

  /*
   * OrderItemModel is a typed object, so access its known
   * properties through the actual object type instead of
   * casting it directly to Record<string, unknown>.
   */
  if (typeof item === "object") {
    const fuelItem = item as unknown as {
      name?: unknown;
      fuelType?: unknown;
      fuel_type?: unknown;
      type?: unknown;
      label?: unknown;
    };

    if (typeof fuelItem.name === "string") {
      return fuelItem.name;
    }

    if (typeof fuelItem.fuelType === "string") {
      return fuelItem.fuelType;
    }

    if (typeof fuelItem.fuel_type === "string") {
      return fuelItem.fuel_type;
    }

    if (typeof fuelItem.type === "string") {
      return fuelItem.type;
    }

    if (typeof fuelItem.label === "string") {
      return fuelItem.label;
    }
  }

  return "Unknown";
}

function getAddressText(address: OrderModel["deliveryAddress"]): string {
  if (!address) {
    return "Unknown";
  }

  if (typeof address === "string") {
    return address;
  }

  /*
   * AddressModel is an object. Extract the available
   * address fields instead of rendering the object.
   */
  const addressData = address as unknown as {
    addressLine1?: unknown;
    addressLine2?: unknown;
    streetAddress?: unknown;
    suburb?: unknown;
    city?: unknown;
    province?: unknown;
    postalCode?: unknown;
    postal_code?: unknown;
    label?: unknown;
  };

  const parts: string[] = [];

  const addPart = (value: unknown) => {
    if (typeof value === "string" && value.trim().length > 0) {
      parts.push(value.trim());
    }
  };

  addPart(addressData.label);
  addPart(addressData.addressLine1);
  addPart(addressData.addressLine2);
  addPart(addressData.streetAddress);
  addPart(addressData.suburb);
  addPart(addressData.city);
  addPart(addressData.province);
  addPart(addressData.postalCode);
  addPart(addressData.postal_code);

  if (parts.length > 0) {
    return parts.join(", ");
  }

  return "Address unavailable";
}

export default function OrderDensityMap({
  orders,
  height = 310,
}: OrderDensityMapProps) {
  const validOrders = orders.filter((order) =>
    isValidCoordinate(order.latitude, order.longitude),
  );

  const heatPoints: [number, number, number][] = validOrders.map((order) => [
    order.latitude!,
    order.longitude!,
    1,
  ]);

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
        scrollWheelZoom
        style={{
          width: "100%",
          height: "100%",
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {heatPoints.length > 0 && <HeatmapLayer points={heatPoints} />}

        {validOrders.map((order) => (
          <CircleMarker
            key={order.id}
            center={[order.latitude!, order.longitude!]}
            radius={5}
            pathOptions={{
              color: "#FFFFFF",
              weight: 1.5,
              fillColor: "#F97316",
              fillOpacity: 0.9,
            }}
          >
            <Popup>
              <div
                style={{
                  minWidth: 200,
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                <strong>FuelNow Order</strong>

                <div style={{ marginTop: 6 }}>
                  <strong>Order:</strong> {order.orderNumber || order.id}
                </div>

                <div>
                  <strong>Customer:</strong> {order.customerName || "Unknown"}
                </div>

                <div>
                  <strong>Fuel:</strong> {getFuelName(order.item)}
                </div>

                <div>
                  <strong>Total:</strong> {formatCurrency(order.totalAmount)}
                </div>

                <div>
                  <strong>Status:</strong> {String(order.status ?? "Unknown")}
                </div>

                <div>
                  <strong>Address:</strong>{" "}
                  {getAddressText(order.deliveryAddress)}
                </div>

                {order.driverName && (
                  <div>
                    <strong>Driver:</strong> {order.driverName}
                  </div>
                )}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {validOrders.length === 0 && (
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
            No order locations available
          </div>
        </div>
      )}
    </div>
  );
}
