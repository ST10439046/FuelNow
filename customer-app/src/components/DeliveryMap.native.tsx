import React, { useEffect, useRef } from "react";

import { ActivityIndicator, StyleSheet, View } from "react-native";

import WebView from "react-native-webview";

import type { Coordinates, DeliveryMapProps } from "./DeliveryMap";

const DEFAULT_COORDINATES: Coordinates = {
  lat: -29.8587,
  lng: 31.0218,
};

const LEAFLET_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
  />

  <link
    rel="stylesheet"
    href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
  />

  <style>
    html,
    body,
    #map {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      overflow: hidden;
      background: #e8e8e8;
    }

    .leaflet-control-attribution {
      font-size: 9px;
    }

    .fuelnow-pin {
      width: 30px;
      height: 30px;
      border-radius: 50% 50% 50% 0;
      background: #174a4a;
      border: 3px solid white;
      transform: rotate(-45deg);
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      position: relative;
    }

    .fuelnow-pin::after {
      content: "";
      position: absolute;
      width: 10px;
      height: 10px;
      background: white;
      border-radius: 50%;
      top: 7px;
      left: 7px;
    }
  </style>
</head>

<body>
  <div id="map"></div>

  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

  <script>
    let map = null;
    let marker = null;
    let currentCoordinates = null;
    let leafletReady = false;

    const defaultCoordinates = {
      lat: ${DEFAULT_COORDINATES.lat},
      lng: ${DEFAULT_COORDINATES.lng}
    };

    function sendMessage(payload) {
      try {
        if (
          window.ReactNativeWebView &&
          window.ReactNativeWebView.postMessage
        ) {
          window.ReactNativeWebView.postMessage(
            JSON.stringify(payload)
          );
        }
      } catch (error) {
        console.error(error);
      }
    }

    function createIcon() {
      return L.divIcon({
        className: "",
        html: '<div class="fuelnow-pin"></div>',
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
      });
    }

    function emitLocation(lat, lng) {
      const coordinates = {
        lat: Number(lat),
        lng: Number(lng)
      };

      currentCoordinates = coordinates;

      sendMessage({
        type: "location_selected",
        coordinates
      });
    }

    function setMarker(lat, lng, shouldEmit) {
      if (!map) {
        return;
      }

      const coordinates = {
        lat: Number(lat),
        lng: Number(lng)
      };

      currentCoordinates = coordinates;

      if (!marker) {
        marker = L.marker(
          [coordinates.lat, coordinates.lng],
          {
            draggable: true,
            icon: createIcon()
          }
        ).addTo(map);

        marker.on("dragend", function () {
          const position = marker.getLatLng();

          emitLocation(
            position.lat,
            position.lng
          );
        });
      } else {
        marker.setLatLng([
          coordinates.lat,
          coordinates.lng
        ]);
      }

      if (shouldEmit) {
        emitLocation(
          coordinates.lat,
          coordinates.lng
        );
      }
    }

    function initialiseMap() {
      if (leafletReady || typeof L === "undefined") {
        return;
      }

      leafletReady = true;

      map = L.map("map", {
        zoomControl: true,
        attributionControl: true
      }).setView(
        [
          defaultCoordinates.lat,
          defaultCoordinates.lng
        ],
        13
      );

      L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          maxZoom: 19,
          attribution: "&copy; OpenStreetMap contributors"
        }
      ).addTo(map);

      map.on("click", function (event) {
        setMarker(
          event.latlng.lat,
          event.latlng.lng,
          true
        );

        map.setView(
          [
            event.latlng.lat,
            event.latlng.lng
          ],
          Math.max(map.getZoom(), 15),
          {
            animate: true
          }
        );
      });

      sendMessage({
        type: "map_ready"
      });
    }

    function waitForLeaflet() {
      if (
        typeof L !== "undefined"
      ) {
        initialiseMap();
        return;
      }

      setTimeout(
        waitForLeaflet,
        100
      );
    }

    function setLocation(
      lat,
      lng,
      zoom
    ) {
      if (!map) {
        return;
      }

      setMarker(
        lat,
        lng,
        false
      );

      map.setView(
        [
          Number(lat),
          Number(lng)
        ],
        zoom || 15,
        {
          animate: true
        }
      );
    }

    document.addEventListener(
      "message",
      function (event) {
        try {
          const message =
            JSON.parse(
              event.data
            );

          if (
            message.type ===
            "set_location"
          ) {
            setLocation(
              message.lat,
              message.lng,
              message.zoom
            );
          }
        } catch (error) {
          console.error(error);
        }
      }
    );

    window.addEventListener(
      "message",
      function (event) {
        try {
          const message =
            JSON.parse(
              event.data
            );

          if (
            message.type ===
            "set_location"
          ) {
            setLocation(
              message.lat,
              message.lng,
              message.zoom
            );
          }
        } catch (error) {
          console.error(error);
        }
      }
    );

    waitForLeaflet();
  </script>
</body>
</html>
`;

export default function DeliveryMapNative({
  coordinates,
  interactive = true,
  onLocationSelect,
}: DeliveryMapProps) {
  const webViewRef = useRef<WebView>(null);

  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (!coordinates) {
      return;
    }

    if (!hasLoadedRef.current) {
      return;
    }

    sendCoordinatesToMap(coordinates);
  }, [coordinates?.lat, coordinates?.lng]);

  const sendCoordinatesToMap = (value: Coordinates) => {
    if (!webViewRef.current) {
      return;
    }

    const message = JSON.stringify({
      type: "set_location",
      lat: value.lat,
      lng: value.lng,
      zoom: 16,
    });

    webViewRef.current.postMessage(message);
  };

  const handleMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);

      if (message.type === "map_ready") {
        hasLoadedRef.current = true;

        if (coordinates) {
          sendCoordinatesToMap(coordinates);
        }

        return;
      }

      if (message.type === "location_selected") {
        if (!interactive) {
          return;
        }

        const selected = message.coordinates;

        if (
          selected &&
          Number.isFinite(Number(selected.lat)) &&
          Number.isFinite(Number(selected.lng))
        ) {
          onLocationSelect?.({
            lat: Number(selected.lat),
            lng: Number(selected.lng),
          });
        }
      }
    } catch (error) {
      console.warn("DeliveryMap.native: invalid WebView message:", error);
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{
          html: LEAFLET_HTML,
          baseUrl: "https://unpkg.com/",
        }}
        originWhitelist={["*"]}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        scrollEnabled={false}
        bounces={false}
        onMessage={handleMessage}
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="small" />
          </View>
        )}
        onError={(event) => {
          console.error("DeliveryMap.native WebView error:", event.nativeEvent);
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

  loading: {
    ...StyleSheet.absoluteFill,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#E8E8E8",
  },
});
