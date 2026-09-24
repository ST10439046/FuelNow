import React from "react";
import { Platform } from "react-native";

import TrackingMapNative from "./TrackingMap.native";
import TrackingMapWeb from "./TrackingMap.web";

export interface TrackingCoordinates {
  lat: number;
  lng: number;
}

export interface TrackingMapProps {
  driverCoordinates: TrackingCoordinates;
  customerCoordinates: TrackingCoordinates;
  driverLabel?: string;
  customerLabel?: string;
  driverColor?: string;
  customerColor?: string;
}

export default function TrackingMap(
  props: TrackingMapProps,
) {
  if (
    Platform.OS === "web"
  ) {
    return (
      <TrackingMapWeb
        {...props}
      />
    );
  }

  return (
    <TrackingMapNative
      {...props}
    />
  );
}