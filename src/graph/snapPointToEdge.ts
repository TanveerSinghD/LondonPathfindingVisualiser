import { haversineDistance } from "../utils/geo";
import { RoadGraph } from "./graphTypes";

export interface SnapResult {
  edgeId: string;
  from: string;
  to: string;
  snappedPoint: [number, number];
  segmentIndex: number;
  distanceMeters: number;
}

interface Vec2 {
  x: number;
  y: number;
}

function toVec([lat, lng]: [number, number], refLat: number): Vec2 {
  const rad = Math.PI / 180;
  return {
    x: lng * Math.cos(refLat * rad) * 111320,
    y: lat * 110540
  };
}

function dot(a: Vec2, b: Vec2) {
  return a.x * b.x + a.y * b.y;
}

function projectPointOnSegment(
  p: Vec2,
  a: Vec2,
  b: Vec2
): { projected: Vec2; t: number } {
  const ab = { x: b.x - a.x, y: b.y - a.y };
  const abLen2 = dot(ab, ab);
  if (abLen2 === 0) return { projected: a, t: 0 };
  const t = Math.max(0, Math.min(1, dot({ x: p.x - a.x, y: p.y - a.y }, ab) / abLen2));
  return { projected: { x: a.x + ab.x * t, y: a.y + ab.y * t }, t };
}

export function snapPointToEdge(graph: RoadGraph, point: [number, number]): SnapResult | null {
  const refLat = point[0];
  let best: SnapResult | null = null;

  graph.edges.forEach((edge) => {
    const coords = edge.points;
    for (let i = 0; i < coords.length - 1; i++) {
      const a = toVec([coords[i][0], coords[i][1]], refLat);
      const b = toVec([coords[i + 1][0], coords[i + 1][1]], refLat);
      const p = toVec(point, refLat);
      const { projected } = projectPointOnSegment(p, a, b);
      const snappedLat = projected.y / 110540;
      const snappedLng = projected.x / (111320 * Math.cos(refLat * Math.PI / 180));
      const snapped: [number, number] = [snappedLat, snappedLng];
      const distanceMeters = haversineDistance(point, snapped);

      if (!best || distanceMeters < best.distanceMeters) {
        best = {
          edgeId: edge.id,
          from: edge.from,
          to: edge.to,
          snappedPoint: snapped,
          segmentIndex: i,
          distanceMeters
        };
      }
    }
  });

  return best;
}
