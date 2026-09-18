import React, { useEffect, useRef } from "react";

import { StyleSheet, View } from "react-native";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

import type { Coordinates, DeliveryMapProps } from "./DeliveryMap";

const DEFAULT_COORDINATES: Coordinates = {
  lat: -29.8587,
  lng: 31.0218,
};

const createPinIcon = () =>
  L.divIcon({
    className: "",
    html: `
      <div
        style="
          width:30px;
          height:30px;
          border-radius:50% 50% 50% 0;
          background:#174a4a;
          border:3px solid white;
          transform:rotate(-45deg);
          box-shadow:0 2px 8px rgba(0,0,0,0.3);
          position:relative;
        "
      >
        <div
          style="
            width:10px;
            height:10px;
            background:white;
            border-radius:50%;
            position:absolute;
            top:7px;
            left:7px;
          "
        ></div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  });

export default function DeliveryMapWeb({
  coordinates,
  interactive = true,
  onLocationSelect,
}: DeliveryMapProps) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);

  const mapRef = useRef<L.Map | null>(null);

  const markerRef = useRef<L.Marker | null>(null);

  const onLocationSelectRef = useRef(onLocationSelect);

  const interactiveRef = useRef(interactive);

  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect;
  }, [onLocationSelect]);

  useEffect(() => {
    interactiveRef.current = interactive;
  }, [interactive]);

  useEffect(() => {
    if (!mapElementRef.current || mapRef.current) {
      return;
    }

    const initial = coordinates ?? DEFAULT_COORDINATES;

    const map = L.map(mapElementRef.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView([initial.lat, initial.lng], coordinates ? 16 : 13);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    const createMarker = (position: Coordinates) => {
      const marker = L.marker([position.lat, position.lng], {
        draggable: interactiveRef.current,
        icon: createPinIcon(),
      }).addTo(map);

      marker.on("dragend", () => {
        if (!interactiveRef.current) {
          return;
        }

        const next = marker.getLatLng();

        onLocationSelectRef.current?.({
          lat: next.lat,
          lng: next.lng,
        });
      });

      return marker;
    };

    if (coordinates) {
      markerRef.current = createMarker(coordinates);
    }

    map.on("click", (event) => {
      if (!interactiveRef.current) {
        return;
      }

      const next: Coordinates = {
        lat: event.latlng.lat,
        lng: event.latlng.lng,
      };

      if (markerRef.current) {
        markerRef.current.setLatLng([next.lat, next.lng]);
      } else {
        markerRef.current = createMarker(next);
      }

      map.setView([next.lat, next.lng], Math.max(map.getZoom(), 15), {
        animate: true,
      });

      onLocationSelectRef.current?.(next);
    });

    mapRef.current = map;

    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !coordinates) {
      return;
    }

    if (markerRef.current) {
      markerRef.current.setLatLng([coordinates.lat, coordinates.lng]);
    } else {
      markerRef.current = L.marker([coordinates.lat, coordinates.lng], {
        draggable: interactiveRef.current,
        icon: createPinIcon(),
      }).addTo(mapRef.current);

      markerRef.current.on("dragend", () => {
        if (!interactiveRef.current) {
          return;
        }

        const next = markerRef.current?.getLatLng();

        if (!next) {
          return;
        }

        onLocationSelectRef.current?.({
          lat: next.lat,
          lng: next.lng,
        });
      });
    }

    mapRef.current.setView([coordinates.lat, coordinates.lng], 16, {
      animate: true,
    });
  }, [coordinates?.lat, coordinates?.lng]);

  useEffect(() => {
    if (!markerRef.current) {
      return;
    }

    markerRef.current.dragging?.[interactive ? "enable" : "disable"]();
  }, [interactive]);

  return (
    <View style={styles.container}>
      <div
        ref={mapElementRef}
        style={{
          width: "100%",
          height: "100%",
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
  },
});
