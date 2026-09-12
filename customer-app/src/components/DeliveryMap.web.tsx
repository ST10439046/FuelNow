import React, { useEffect, useRef } from "react";
import L from "leaflet";
// @ts-ignore
import "leaflet/dist/leaflet.css";

interface Coordinates {
  lat: number;
  lng: number;
}

interface Props {
  coordinates: Coordinates | null;
}

const DEFAULT_COORDINATES: Coordinates = {
  lat: -29.8587,
  lng: 31.0218,
};

const createCustomPinIcon = () => {
  return L.divIcon({
    className: "fuelnow-map-pin",
    html: `
      <div style="
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        background: #0B3D42;
        position: absolute;
        transform: rotate(-45deg);
        left: 50%;
        top: 50%;
        margin: -24px 0 0 -16px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        border: 2px solid #FFFFFF;
      ">
        <div style="
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #F97316;
          transform: rotate(45deg);
        "></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
};

export default function DeliveryMap({ coordinates }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  /*
   * Initialize Leaflet map
   */
  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return;

    const initialCoordinates = coordinates ?? DEFAULT_COORDINATES;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView(
      [initialCoordinates.lat, initialCoordinates.lng],
      coordinates ? 15 : 12,
    );

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    if (coordinates) {
      markerRef.current = L.marker([coordinates.lat, coordinates.lng], {
        icon: createCustomPinIcon(),
      }).addTo(map);
    }

    mapRef.current = map;

    // Trigger invalidateSize at multiple intervals to handle flex/viewport settling
    const t1 = setTimeout(() => map.invalidateSize(), 50);
    const t2 = setTimeout(() => map.invalidateSize(), 300);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && containerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (resizeObserver) resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  /*
   * Update position when coordinates change
   */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const targetCoords = coordinates ?? DEFAULT_COORDINATES;
    const position: L.LatLngExpression = [targetCoords.lat, targetCoords.lng];

    map.setView(position, coordinates ? 15 : 12, { animate: true });

    if (coordinates) {
      if (!markerRef.current) {
        markerRef.current = L.marker(position, {
          icon: createCustomPinIcon(),
        }).addTo(map);
      } else {
        markerRef.current.setLatLng(position);
      }
    } else if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
  }, [coordinates]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        height: "100%",
        minHeight: "100%",
        backgroundColor: "#E2E8F0",
      }}
    />
  );
}
