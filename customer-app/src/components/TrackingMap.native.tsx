import {
  StyleSheet,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import type {
  TrackingMapProps,
} from "./TrackingMap";

function isValidCoordinate(
  value: TrackingMapProps["driverCoordinates"],
): boolean {
  if (!value) {
    return false;
  }

  const lat = Number(value.lat);
  const lng = Number(value.lng);

  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !(lat === 0 && lng === 0)
  );
}

function escapeAttribute(
  value: string,
): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export default function TrackingMapNative({
  driverCoordinates,
  customerCoordinates,
  driverLabel = "Driver",
  customerLabel = "Your delivery address",
  driverColor = "#174A5B",
  customerColor = "#F5A623",
}: TrackingMapProps) {
  const hasDriver =
    isValidCoordinate(driverCoordinates);

  const hasCustomer =
    isValidCoordinate(customerCoordinates);

  if (!hasDriver || !hasCustomer) {
    return (
      <View style={styles.fallback} />
    );
  }

  const driverLat = Number(
    driverCoordinates.lat,
  );

  const driverLng = Number(
    driverCoordinates.lng,
  );

  const customerLat = Number(
    customerCoordinates.lat,
  );

  const customerLng = Number(
    customerCoordinates.lng,
  );

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta
  name="viewport"
  content="width=device-width,
  initial-scale=1.0,
  maximum-scale=1.0,
  user-scalable=no"
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
  }

  body {
    background: #f4f1eb;
  }

  .driver-marker,
  .customer-marker {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 3px solid white;
    box-shadow:
      0 2px 8px rgba(0,0,0,0.28);
    color: white;
    font-size: 16px;
    font-weight: 700;
  }

  .driver-marker {
    background: ${escapeAttribute(driverColor)};
  }

  .customer-marker {
    background: ${escapeAttribute(customerColor)};
  }

  .leaflet-control-attribution {
    font-size: 9px;
  }
</style>
</head>

<body>
<div id="map"></div>

<script
  src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js">
</script>

<script>
  const driver = [
    ${driverLat},
    ${driverLng}
  ];

  const customer = [
    ${customerLat},
    ${customerLng}
  ];

  const map = L.map("map", {
    zoomControl: true,
    attributionControl: true,
    preferCanvas: true
  });

  L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      maxZoom: 19,
      attribution:
        "&copy; OpenStreetMap contributors"
    }
  ).addTo(map);

  const driverIcon =
    L.divIcon({
      className: "",
      html:
        '<div class="driver-marker">D</div>',
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });

  const customerIcon =
    L.divIcon({
      className: "",
      html:
        '<div class="customer-marker">Y</div>',
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });

  const driverMarker =
    L.marker(driver, {
      icon: driverIcon
    })
      .addTo(map)
      .bindPopup(
        ${JSON.stringify(driverLabel)}
      );

  const customerMarker =
    L.marker(customer, {
      icon: customerIcon
    })
      .addTo(map)
      .bindPopup(
        ${JSON.stringify(customerLabel)}
      );

  const routeLine =
    L.polyline(
      [driver, customer],
      {
        color:
          ${JSON.stringify(driverColor)},
        weight: 4,
        opacity: 0.85
      }
    ).addTo(map);

  const bounds =
    L.latLngBounds([
      driver,
      customer
    ]);

  map.fitBounds(bounds, {
    padding: [45, 45],
    maxZoom: 15
  });

  window.addEventListener(
    "message",
    function(event) {
      try {
        const data =
          JSON.parse(event.data);

        if (
          !data ||
          !data.driver ||
          !data.customer
        ) {
          return;
        }

        const newDriver = [
          Number(data.driver.lat),
          Number(data.driver.lng)
        ];

        const newCustomer = [
          Number(data.customer.lat),
          Number(data.customer.lng)
        ];

        if (
          !Number.isFinite(newDriver[0]) ||
          !Number.isFinite(newDriver[1]) ||
          !Number.isFinite(newCustomer[0]) ||
          !Number.isFinite(newCustomer[1])
        ) {
          return;
        }

        driverMarker.setLatLng(
          newDriver
        );

        customerMarker.setLatLng(
          newCustomer
        );

        routeLine.setLatLngs([
          newDriver,
          newCustomer
        ]);

        map.fitBounds(
          L.latLngBounds([
            newDriver,
            newCustomer
          ]),
          {
            padding: [45, 45],
            maxZoom: 15,
            animate: true
          }
        );
      } catch (_) {
        return;
      }
    }
  );
</script>
</body>
</html>
`;

  return (
    <View style={styles.container}>
      <WebView
        source={{
          html,
          baseUrl: "https://unpkg.com/",
        }}
        originWhitelist={[
          "*",
        ]}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        mixedContentMode="always"
        setSupportMultipleWindows={false}
        style={styles.webView}
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 260,
    width: "100%",
    overflow: "hidden",
  },

  webView: {
    flex: 1,
    backgroundColor: "transparent",
  },

  fallback: {
    height: 260,
    width: "100%",
  },
});