import React, {
    useEffect,
    useRef,
  } from "react";
  
  import {
    StyleSheet,
    View,
  } from "react-native";
  
  import L from "leaflet";
  import "leaflet/dist/leaflet.css";
  
import { TrackingCoordinates } from "./TrackingMap";
  
  interface TrackingMapProps {
    driverCoordinates: TrackingCoordinates;
    customerCoordinates: TrackingCoordinates;
    driverLabel?: string;
    customerLabel?: string;
    driverColor?: string;
    customerColor?: string;
  }
  
  function isValidCoordinate(
    coordinates?: TrackingCoordinates,
  ): boolean {
    if (!coordinates) {
      return false;
    }
  
    const lat = Number(
      coordinates.lat,
    );
  
    const lng = Number(
      coordinates.lng,
    );
  
    return (
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180 &&
      lat !== 0 &&
      lng !== 0
    );
  }
  
  const createDriverIcon = () =>
    L.divIcon({
      className: "",
      html: `
        <div
          style="
            width:42px;
            height:42px;
            border-radius:50%;
            background:#174a4a;
            border:3px solid white;
            box-shadow:0 2px 10px rgba(0,0,0,0.35);
            display:flex;
            align-items:center;
            justify-content:center;
            color:white;
            font-family:Arial,sans-serif;
            font-size:18px;
            font-weight:bold;
          "
        >
          D
        </div>
      `,
      iconSize: [42, 42],
      iconAnchor: [21, 21],
      popupAnchor: [0, -21],
    });
  
  const createCustomerIcon = () =>
    L.divIcon({
      className: "",
      html: `
        <div
          style="
            width:38px;
            height:38px;
            border-radius:50% 50% 50% 0;
            background:#f2a900;
            border:3px solid white;
            box-shadow:0 2px 10px rgba(0,0,0,0.35);
            transform:rotate(-45deg);
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
              top:8px;
              left:8px;
            "
          ></div>
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 38],
      popupAnchor: [0, -38],
    });
  
  export default function TrackingMapWeb({
    driverCoordinates,
    customerCoordinates,
    driverLabel = "Driver",
    customerLabel = "Your delivery address",
    driverColor = "#174a4a",
  }: TrackingMapProps) {
    const mapElementRef =
      useRef<HTMLDivElement | null>(
        null,
      );
  
    const mapRef =
      useRef<L.Map | null>(
        null,
      );
  
    const driverMarkerRef =
      useRef<L.Marker | null>(
        null,
      );
  
    const customerMarkerRef =
      useRef<L.Marker | null>(
        null,
      );
  
    const lineRef =
      useRef<L.Polyline | null>(
        null,
      );
  
    useEffect(() => {
      if (
        !mapElementRef.current ||
        mapRef.current
      ) {
        return;
      }
  
      const map =
        L.map(
          mapElementRef.current,
          {
            zoomControl: true,
            attributionControl: true,
            preferCanvas: true,
          },
        );
  
      L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          maxZoom: 19,
          attribution:
            "&copy; OpenStreetMap contributors",
        },
      ).addTo(map);
  
      map.setView(
        [-29.8587, 31.0218],
        14,
      );
  
      mapRef.current =
        map;
  
      setTimeout(() => {
        map.invalidateSize();
      }, 300);
  
      return () => {
        map.remove();
  
        mapRef.current =
          null;
  
        driverMarkerRef.current =
          null;
  
        customerMarkerRef.current =
          null;
  
        lineRef.current =
          null;
      };
    }, []);
  
    useEffect(() => {
      const map =
        mapRef.current;
  
      if (
        !map ||
        !isValidCoordinate(
          driverCoordinates,
        ) ||
        !isValidCoordinate(
          customerCoordinates,
        )
      ) {
        return;
      }
  
      const driver: [
        number,
        number,
      ] = [
        Number(
          driverCoordinates.lat,
        ),
        Number(
          driverCoordinates.lng,
        ),
      ];
  
      const customer: [
        number,
        number,
      ] = [
        Number(
          customerCoordinates.lat,
        ),
        Number(
          customerCoordinates.lng,
        ),
      ];
  
      if (
        !driverMarkerRef.current
      ) {
        driverMarkerRef.current =
          L.marker(
            driver,
            {
              icon:
                createDriverIcon(),
              zIndexOffset: 1000,
            },
          )
            .addTo(map)
            .bindPopup(
              driverLabel,
            );
      } else {
        driverMarkerRef.current.setLatLng(
          driver,
        );
      }
  
      if (
        !customerMarkerRef.current
      ) {
        customerMarkerRef.current =
          L.marker(
            customer,
            {
              icon:
                createCustomerIcon(),
              zIndexOffset: 900,
            },
          )
            .addTo(map)
            .bindPopup(
              customerLabel,
            );
      } else {
        customerMarkerRef.current.setLatLng(
          customer,
        );
      }
  
      if (
        !lineRef.current
      ) {
        lineRef.current =
          L.polyline(
            [
              driver,
              customer,
            ],
            {
              color:
                driverColor,
              weight: 4,
              opacity: 0.8,
            },
          ).addTo(map);
      } else {
        lineRef.current.setLatLngs(
          [
            driver,
            customer,
          ],
        );
      }
  
      const bounds =
        L.latLngBounds([
          driver,
          customer,
        ]);
  
      map.fitBounds(
        bounds,
        {
          padding: [
            45,
            45,
          ],
          maxZoom: 14,
          animate: true,
        },
      );
    }, [
      driverCoordinates.lat,
      driverCoordinates.lng,
      customerCoordinates.lat,
      customerCoordinates.lng,
      driverLabel,
      customerLabel,
      driverColor,
    ]);
  
    return (
      <View
        style={
          styles.container
        }
      >
        <div
          ref={
            mapElementRef
          }
          style={{
            width: "100%",
            height: "100%",
          }}
        />
      </View>
    );
  }
  
  const styles =
    StyleSheet.create({
      container: {
        flex: 1,
        overflow: "hidden",
      },
    });