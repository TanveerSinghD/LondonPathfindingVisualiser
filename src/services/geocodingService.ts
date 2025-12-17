import { LONDON_BOUNDS } from "../constants/bounds";
import { Coordinates } from "./locationService";
import { assertValidCoordinate } from "../utils/geo";

export interface GeocodeResult extends Coordinates {
  label: string;
}

const geocodeCache = new Map<string, GeocodeResult[]>();

export async function geocodeAddress(query: string): Promise<GeocodeResult[]> {
  const cached = geocodeCache.get(query);
  if (cached) return cached;
  const bounded = `${LONDON_BOUNDS.minLng},${LONDON_BOUNDS.minLat},${LONDON_BOUNDS.maxLng},${LONDON_BOUNDS.maxLat}`;
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
    query
  )}&format=json&limit=5&bounded=1&viewbox=${bounded}`;

  const response = await fetch(url, {
    headers: {
      "Accept-Language": "en",
      "User-Agent": "London-Pathfinding-Visualizer"
    }
  });

  if (!response.ok) {
    throw new Error("Geocoding failed");
  }

  const data = (await response.json()) as any[];
  const mapped = data.map((item) => {
    const lat = Number(item.lat);
    const lng = Number(item.lon);
    assertValidCoordinate({ lat, lng });
    return {
      lat,
      lng,
      label: item.display_name
    };
  });
  geocodeCache.set(query, mapped);
  return mapped;
}

export async function reverseGeocode(coords: Coordinates): Promise<string> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${coords.lat}&lon=${coords.lng}&format=json&zoom=18`;
  const response = await fetch(url, {
    headers: {
      "Accept-Language": "en",
      "User-Agent": "London-Pathfinding-Visualizer"
    }
  });
  if (!response.ok) {
    throw new Error("Reverse geocoding failed");
  }
  const data = (await response.json()) as any;
  return data.display_name ?? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`;
}
