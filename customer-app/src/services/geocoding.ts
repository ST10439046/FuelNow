import { supabase } from "./supabase";

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  displayName: string;

  streetNumber?: string;
  streetName?: string;
  suburb?: string;
  city?: string;
  province?: string;
  postalCode?: string;
}

interface GeocodingFunctionResponse {
  success: boolean;
  result: GeocodingResult | null;
  error?: string;
}

async function callGeocodingFunction(
  body: Record<string, unknown>
): Promise<GeocodingResult | null> {
  const { data, error } =
    await supabase.functions.invoke<GeocodingFunctionResponse>(
      "geocode-address",
      {
        body,
      }
    );

  if (error) {
    console.error(
      "Geocoding Edge Function error:",
      error
    );

    throw new Error(
      error.message ||
        "Unable to contact the geocoding service."
    );
  }

  if (!data) {
    throw new Error(
      "The geocoding service returned no response."
    );
  }

  if (!data.success) {
    throw new Error(
      data.error ||
        "The geocoding service returned an error."
    );
  }

  return data.result;
}

export async function geocodeAddress(
  address: string
): Promise<GeocodingResult | null> {
  const trimmed = address.trim();

  if (!trimmed) {
    return null;
  }

  return callGeocodingFunction({
    mode: "search",
    address: trimmed,
  });
}

export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<GeocodingResult | null> {
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return null;
  }

  return callGeocodingFunction({
    mode: "reverse",
    latitude,
    longitude,
  });
}