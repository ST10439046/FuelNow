import React, { useEffect, useRef } from "react";

import L from "leaflet";

import "leaflet/dist/leaflet.css";

interface Coordinates {
  lat: number;
  lng: number;
}

interface Props {
  coordinates: Coordinates | null;
}

const DEFAULT_COORDINATES = {
  lat: -29.8587,
  lng: 31.0218,
};

export default function DeliveryMap({ coordinates }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const mapRef = useRef<L.Map | null>(null);

  const markerRef = useRef<L.Marker | null>(null);

  /*
   * Create the map once.
   */
  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    if (mapRef.current) {
      return;
    }

    const initialCoordinates = coordinates ?? DEFAULT_COORDINATES;

    const map = L.map(containerRef.current).setView(
      [initialCoordinates.lat, initialCoordinates.lng],
      coordinates ? 16 : 12,
    );

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    mapRef.current = map;

    /*
     * Fix Leaflet sizing when the container
     * is rendered inside React Native Web.
     */
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  /*
   * Move the map and marker whenever the
   * selected address changes.
   */
  useEffect(() => {
    const map = mapRef.current;

    if (!map || !coordinates) {
      return;
    }

    const position: L.LatLngExpression = [coordinates.lat, coordinates.lng];

    /*
     * Move the map.
     */
    map.flyTo(position, 16, {
      duration: 0.8,
    });

    /*
     * Create marker if it doesn't exist.
     */
    if (!markerRef.current) {
      markerRef.current = L.marker(position).addTo(map);
    } else {
      /*
       * Move existing marker.
       */
      markerRef.current.setLatLng(position);
    }
  }, [coordinates]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        minHeight: 240,
      }}
    />
  );
}
