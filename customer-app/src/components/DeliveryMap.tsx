import React from "react";
import { Platform } from "react-native";
import NativeMap from "./DeliveryMap.native";
import WebMap from "./DeliveryMap.web";

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface DeliveryMapProps {
  coordinates: Coordinates | null;
}

export default function DeliveryMap(props: DeliveryMapProps) {
  if (Platform.OS === "web") {
    return <WebMap {...props} />;
  }
  return <NativeMap {...props} />;
}
