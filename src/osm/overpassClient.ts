import { LONDON_BOUNDS } from "../constants/bounds";
import { BoundingBox } from "../graph/graphTypes";
import { Coordinates } from "../services/locationService";
import { assertValidCoordinate } from "../utils/geo";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const DEFAULT_PADDING_METERS = 2500;

function metersToLatDelta(meters: number) {
  return meters / 111320;
}

function metersToLngDelta(meters: number, atLat: number) {
  const rad = (Math.PI / 180) * atLat;
  return meters / (111320 * Math.cos(rad || 1e-6));
}

export function clampToLondonBounds(box: BoundingBox): BoundingBox {
  return {
    south: Math.max(box.south, LONDON_BOUNDS.minLat),
    west: Math.max(box.west, LONDON_BOUNDS.minLng),
    north: Math.min(box.north, LONDON_BOUNDS.maxLat),
    east: Math.min(box.east, LONDON_BOUNDS.maxLng)
  };
}

export function buildBoundingBoxAroundPoints(
  start: Coordinates,
  dest: Coordinates,
  paddingMeters = DEFAULT_PADDING_METERS
): BoundingBox {
  assertValidCoordinate(start);
  assertValidCoordinate(dest);
  const minLat = Math.min(start.lat, dest.lat);
  const maxLat = Math.max(start.lat, dest.lat);
  const minLng = Math.min(start.lng, dest.lng);
  const maxLng = Math.max(start.lng, dest.lng);
  const midLat = (minLat + maxLat) / 2;

  const padLat = metersToLatDelta(paddingMeters);
  const padLng = metersToLngDelta(paddingMeters, midLat);

  return clampToLondonBounds({
    south: minLat - padLat,
    west: minLng - padLng,
    north: maxLat + padLat,
    east: maxLng + padLng
  });
}

function bboxToString(box: BoundingBox) {
  return `${box.south},${box.west},${box.north},${box.east}`;
}

export async function fetchRoadData(bbox: BoundingBox, signal?: AbortSignal) {
  const bboxString = bboxToString(bbox);
  const query = `
    [out:json][timeout:25];
    (
      way["highway"~"^(motorway|trunk|primary|secondary|tertiary|unclassified|residential|living_street|service|pedestrian|track|path|cycleway|footway|bridleway|steps)$"]["area"!="yes"]["highway"!="construction"]["highway"!="proposed"](${bboxString});
    );
    (._;>;);
    out body;
  `;

  const response = await fetch(OVERPASS_URL, {
    method: "POST",
    body: query,
    headers: {
      "Content-Type": "text/plain;charset=UTF-8",
      "User-Agent": "London-Pathfinding-Visualizer",
      "Accept-Language": "en"
    },
    signal
  });

  if (!response.ok) {
    throw new Error(`Overpass request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
