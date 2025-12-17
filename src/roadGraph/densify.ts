import { haversineDistance } from "../utils/geo";

export function densifyGeometry(
  coords: [number, number][],
  stepMeters: number
): [number, number][] {
  if (coords.length <= 1) return coords;
  const result: [number, number][] = [];
  for (let i = 0; i < coords.length - 1; i++) {
    const start = coords[i];
    const end = coords[i + 1];
    const segmentLength = haversineDistance(start, end);
    result.push(start);
    if (segmentLength > stepMeters) {
      const steps = Math.floor(segmentLength / stepMeters);
      for (let s = 1; s < steps; s++) {
        const t = (s * stepMeters) / segmentLength;
        const lat = start[0] + (end[0] - start[0]) * t;
        const lng = start[1] + (end[1] - start[1]) * t;
        result.push([lat, lng]);
      }
    }
  }
  result.push(coords[coords.length - 1]);
  return result;
}
