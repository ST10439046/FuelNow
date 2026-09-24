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

interface NominatimAddress {
  house_number?: string;
  road?: string;
  pedestrian?: string;
  footway?: string;
  neighbourhood?: string;
  suburb?: string;
  city_district?: string;
  town?: string;
  city?: string;
  municipality?: string;
  state?: string;
  province?: string;
  postcode?: string;
  country?: string;
  country_code?: string;
}

interface NominatimResponse {
  lat: string;
  lon: string;
  display_name: string;
  address?: NominatimAddress;
}

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";

function normaliseProvince(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const province = value.trim();

  if (!province) {
    return undefined;
  }

  const mappings: Record<string, string> = {
    "kwazulu-natal": "KwaZulu-Natal",
    "kwazulu natal": "KwaZulu-Natal",
    kzn: "KwaZulu-Natal",

    gauteng: "Gauteng",
    gp: "Gauteng",

    "western cape": "Western Cape",
    wc: "Western Cape",

    "eastern cape": "Eastern Cape",
    ec: "Eastern Cape",

    limpopo: "Limpopo",
    lp: "Limpopo",

    mpumalanga: "Mpumalanga",
    mp: "Mpumalanga",

    "north west": "North West",
    northwest: "North West",
    nw: "North West",

    "free state": "Free State",
    fs: "Free State",

    "northern cape": "Northern Cape",
    nc: "Northern Cape",
  };

  return mappings[province.toLowerCase()] ?? province;
}

function mapNominatimResult(
  result: NominatimResponse,
): GeocodingResult {
  const address = result.address ?? {};

  const streetNumber = address.house_number?.trim();

  const streetName =
    address.road?.trim() ||
    address.pedestrian?.trim() ||
    address.footway?.trim();

  const suburb =
    address.suburb?.trim() ||
    address.neighbourhood?.trim() ||
    address.city_district?.trim();

  const city =
    address.city?.trim() ||
    address.town?.trim() ||
    address.municipality?.trim();

  const province = normaliseProvince(
    address.state ?? address.province,
  );

  const postalCode = address.postcode?.trim();

  return {
    latitude: Number(result.lat),
    longitude: Number(result.lon),
    displayName: result.display_name,

    streetNumber,
    streetName,
    suburb,
    city,
    province,
    postalCode,
  };
}

async function reverseGeocodeWithNominatim(
  latitude: number,
  longitude: number,
): Promise<GeocodingResult | null> {
  const url =
    `${NOMINATIM_BASE_URL}/reverse` +
    `?format=jsonv2` +
    `&lat=${encodeURIComponent(latitude)}` +
    `&lon=${encodeURIComponent(longitude)}` +
    `&addressdetails=1` +
    `&zoom=18` +
    `&accept-language=en`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "User-Agent": "FuelNow/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Reverse geocoding failed with HTTP ${response.status}.`,
    );
  }

  const data = (await response.json()) as NominatimResponse;

  if (
    !data ||
    !data.lat ||
    !data.lon ||
    !data.display_name
  ) {
    return null;
  }

  return mapNominatimResult(data);
}

async function searchWithNominatim(
  address: string,
): Promise<GeocodingResult | null> {
  const url =
    `${NOMINATIM_BASE_URL}/search` +
    `?format=jsonv2` +
    `&q=${encodeURIComponent(address)}` +
    `&addressdetails=1` +
    `&limit=1` +
    `&countrycodes=za` +
    `&accept-language=en`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "User-Agent": "FuelNow/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Address search failed with HTTP ${response.status}.`,
    );
  }

  const data = (await response.json()) as NominatimResponse[];

  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  return mapNominatimResult(data[0]);
}

async function callGeocodingFunction(
  body: Record<string, unknown>,
): Promise<GeocodingResult | null> {
  const { data, error } =
    await supabase.functions.invoke<GeocodingFunctionResponse>(
      "geocode-address",
      {
        body,
      },
    );

  if (error) {
    console.warn(
      "Geocoding Edge Function failed. Falling back to OpenStreetMap Nominatim:",
      error.message,
    );

    return null;
  }

  if (!data) {
    console.warn(
      "Geocoding Edge Function returned no response. Falling back to OpenStreetMap Nominatim.",
    );

    return null;
  }

  if (!data.success) {
    console.warn(
      "Geocoding Edge Function returned an error. Falling back to OpenStreetMap Nominatim:",
      data.error,
    );

    return null;
  }

  return data.result;
}

export async function geocodeAddress(
  address: string,
): Promise<GeocodingResult | null> {
  const trimmed = address.trim();

  if (!trimmed) {
    return null;
  }

  try {
    const edgeResult = await callGeocodingFunction({
      mode: "search",
      address: trimmed,
    });

    if (edgeResult) {
      return edgeResult;
    }
  } catch (error) {
    console.warn(
      "Geocoding Edge Function search failed:",
      error,
    );
  }

  try {
    return await searchWithNominatim(trimmed);
  } catch (error) {
    console.error(
      "Nominatim address search failed:",
      error,
    );

    throw new Error(
      "Unable to search for that location right now.",
    );
  }
}

export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<GeocodingResult | null> {
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return null;
  }

  try {
    const edgeResult = await callGeocodingFunction({
      mode: "reverse",
      latitude,
      longitude,
    });

    if (edgeResult) {
      return edgeResult;
    }
  } catch (error) {
    console.warn(
      "Geocoding Edge Function reverse lookup failed:",
      error,
    );
  }

  try {
    return await reverseGeocodeWithNominatim(
      latitude,
      longitude,
    );
  } catch (error) {
    console.error(
      "Nominatim reverse geocoding failed:",
      error,
    );

    throw new Error(
      "Unable to determine the address for this map location.",
    );
  }
}