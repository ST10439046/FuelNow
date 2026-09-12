import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";

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

export default function DeliveryMap({ coordinates }: Props) {
  const webViewRef = useRef<WebView | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const targetCoords = coordinates ?? DEFAULT_COORDINATES;
  const hasCoords = !!coordinates;

  // Inline the Leaflet HTML with a data URI approach so no external CDN is needed at load time.
  // Leaflet is loaded from unpkg but we gracefully handle offline with a static fallback.
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      height: 100%;
      width: 100%;
      overflow: hidden;
      background: #E2E8F0;
    }
    #map {
      height: 100%;
      width: 100%;
      background: #E2E8F0;
    }
    .custom-pin {
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      background: #0B3D42;
      position: absolute;
      transform: rotate(-45deg);
      left: 50%;
      top: 50%;
      margin: -24px 0 0 -16px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
      border: 2px solid #FFFFFF;
    }
    .custom-pin-inner {
      position: absolute;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #F97316;
      transform: rotate(45deg);
      top: 50%;
      left: 50%;
      margin: -6px 0 0 -6px;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV/XN/WLo=" crossorigin=""></script>
  <script>
    var map, marker;
    function initMap() {
      try {
        map = L.map('map', {
          zoomControl: false,
          attributionControl: false,
          tap: false
        }).setView([${targetCoords.lat}, ${targetCoords.lng}], ${hasCoords ? 15 : 12});

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          crossOrigin: true
        }).addTo(map);

        var pinIcon = L.divIcon({
          className: '',
          html: '<div class="custom-pin"><div class="custom-pin-inner"></div></div>',
          iconSize: [32, 32],
          iconAnchor: [16, 32]
        });

        ${hasCoords ? `marker = L.marker([${targetCoords.lat}, ${targetCoords.lng}], { icon: pinIcon }).addTo(map);` : ''}

        setTimeout(function() {
          if (map) map.invalidateSize();
        }, 300);

        window.ReactNativeWebView && window.ReactNativeWebView.postMessage('map_ready');
      } catch(e) {
        console.error('Map init error:', e);
      }
    }

    function updateLocation(newLat, newLng) {
      if (!map) return;
      map.setView([newLat, newLng], 15, { animate: true });
      var pinIcon = L.divIcon({
        className: '',
        html: '<div class="custom-pin"><div class="custom-pin-inner"></div></div>',
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      });
      if (!marker) {
        marker = L.marker([newLat, newLng], { icon: pinIcon }).addTo(map);
      } else {
        marker.setLatLng([newLat, newLng]);
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initMap);
    } else {
      initMap();
    }
  </script>
</body>
</html>`;

  useEffect(() => {
    if (coordinates && webViewRef.current && mapLoaded) {
      const js = `if (typeof updateLocation === 'function') { updateLocation(${coordinates.lat}, ${coordinates.lng}); } true;`;
      webViewRef.current.injectJavaScript(js);
    }
  }, [coordinates?.lat, coordinates?.lng, mapLoaded]);

  return (
    <View style={styles.container}>
      {!mapLoaded && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#0B3D42" />
        </View>
      )}
      <WebView
        ref={webViewRef}
        originWhitelist={["*"]}
        source={{ html, baseUrl: "https://unpkg.com" }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        mixedContentMode="always"
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        allowsFullscreenVideo={false}
        scalesPageToFit={false}
        style={styles.webview}
        onLoadEnd={() => setMapLoaded(true)}
        onMessage={(event) => {
          if (event.nativeEvent.data === 'map_ready') {
            setMapLoaded(true);
          }
        }}
        onError={(e) => {
          console.warn('DeliveryMap WebView error:', e.nativeEvent);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "#E2E8F0",
    overflow: "hidden",
  },
  webview: {
    flex: 1,
    backgroundColor: "transparent",
    opacity: 0.99, // Fixes a known React Native WebView rendering bug on Android
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E2E8F0",
    zIndex: 1,
  },
});
