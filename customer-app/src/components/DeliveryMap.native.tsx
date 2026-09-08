import React, { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";

import MapView, { Marker, Region } from "react-native-maps";

interface Coordinates {
  lat: number;
  lng: number;
}

interface Props {
  coordinates: Coordinates | null;
}

const DEFAULT_REGION: Region = {
  latitude: -29.8587,
  longitude: 31.0218,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

export default function DeliveryMap({ coordinates }: Props) {
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (!coordinates) {
      return;
    }

    mapRef.current?.animateToRegion(
      {
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      700,
    );
  }, [coordinates]);

  const region: Region = coordinates
    ? {
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    : DEFAULT_REGION;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={region}
      >
        {coordinates && (
          <Marker
            coordinate={{
              latitude: coordinates.lat,
              longitude: coordinates.lng,
            }}
            title="Delivery location"
            description="Fuel delivery address"
          />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 300,
    overflow: "hidden",
    borderRadius: 18,
  },
});
