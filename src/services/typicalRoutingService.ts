import { Coordinates } from "./locationService";
import { assertValidCoordinate } from "../utils/geo";

const cache = new Map<string, { path: Coordinates[]; distance: number; duration: number }>();

function cacheKey(a: Coordinates, b: Coordinates) {
  return `${a.lat.toFixed(5)},${a.lng.toFixed(5)}-${b.lat.toFixed(5)},${b.lng.toFixed(5)}`;
}

export async function fetchTypicalRoute(
  start: Coordinates,
  dest: Coordinates
): Promise<{ path: Coordinates[]; distance: number; duration: number }> {
  assertValidCoordinate(start);
  assertValidCoordinate(dest);
  const key = cacheKey(start, dest);
  const cached = cache.get(key);
  if (cached) return cached;

  const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson&steps=false`;
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error("Typical routing service failed.");
  }
  const json = await resp.json();
  const route = json?.routes?.[0];
  if (!route || !route.geometry?.coordinates) {
    throw new Error("No route returned from routing service.");
  }
  const coords: Coordinates[] = route.geometry.coordinates.map(([lng, lat]: [number, number]) => ({
    lat,
    lng
  }));
  const result = { path: coords, distance: route.distance, duration: route.duration };
  cache.set(key, result);
  return result;
}
