export interface GeocodingResult {
  latitude: number;
  longitude: number;
  displayName: string;
}

const NOMINATIM_URL =
  'https://nominatim.openstreetmap.org/search';

export async function geocodeAddress(
  address: string
): Promise<GeocodingResult | null> {
  const trimmed = address.trim();

  if (!trimmed) {
    return null;
  }

  const params = new URLSearchParams({
    format: 'jsonv2',
    q: trimmed,
    limit: '1',
    countrycodes: 'za',
  });

  const response = await fetch(
    `${NOMINATIM_URL}?${params.toString()}`,
    {
      headers: {
        Accept: 'application/json',

        // Replace this with a real project contact email.
        'User-Agent':
          'FuelNow/1.0 (replace-with-your-contact-email)',
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Geocoding failed with status ${response.status}.`
    );
  }

  const results = await response.json();

  if (!Array.isArray(results) || results.length === 0) {
    return null;
  }

  const result = results[0];

  const latitude = Number(result.lat);
  const longitude = Number(result.lon);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return null;
  }

  return {
    latitude,
    longitude,
    displayName: result.display_name,
  };
}