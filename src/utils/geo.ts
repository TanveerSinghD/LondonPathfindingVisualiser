import { GraphEdge, GraphNode } from "../graph/types";
import { Coordinates } from "../services/locationService";

export function toRad(value: number): number {
  return (value * Math.PI) / 180;
}

export function haversineDistance(a: [number, number], b: [number, number]): number {
  const R = 6371000; // meters
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);

  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);

  const h =
    sinLat * sinLat +
    Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}

export function nearestNode(nodes: GraphNode[], point: [number, number]): GraphNode | null {
  let best: GraphNode | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const node of nodes) {
    const d = haversineDistance([node.lat, node.lng], point);
    if (d < bestDistance) {
      bestDistance = d;
      best = node;
    }
  }

  return best;
}

export function lengthOfEdge(edge: GraphEdge, from: GraphNode, to: GraphNode): number {
  const coords = edge.points ?? [
    [from.lat, from.lng],
    [to.lat, to.lng]
  ];
  let total = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    total += haversineDistance(coords[i], coords[i + 1]);
  }
  return total;
}

export function lengthOfPath(
  pathIds: string[],
  nodes: Map<string, GraphNode>,
  getEdge: (from: string, to: string) => GraphEdge | undefined
): number {
  let total = 0;
  for (let i = 0; i < pathIds.length - 1; i++) {
    const fromId = pathIds[i];
    const toId = pathIds[i + 1];
    const edge = getEdge(fromId, toId);
    const from = nodes.get(fromId);
    const to = nodes.get(toId);
    if (!edge || !from || !to) continue;
    total += lengthOfEdge(edge, from, to);
  }
  return total;
}

export function assertValidCoordinate(coord: Coordinates | [number, number]) {
  const lat = Array.isArray(coord) ? coord[0] : coord.lat;
  const lng = Array.isArray(coord) ? coord[1] : coord.lng;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error("Coordinate missing numeric lat/lng");
  }
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    throw new Error(`Coordinate out of range: lat=${lat}, lng=${lng}`);
  }
}
