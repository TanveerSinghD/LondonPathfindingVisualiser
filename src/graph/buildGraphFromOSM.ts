import { OSMNetwork } from "../osm/osmParser";
import { haversineDistance } from "../utils/geo";
import { WeightedGraph } from "./Graph";
import { GraphEdge, GraphNode } from "./types";
import { RoadEdge, RoadGraph } from "./graphTypes";
import { edgeSpeedMps, parseMaxspeedToMps } from "../utils/speed";

function segmentLength(points: [number, number][]) {
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    total += haversineDistance(points[i], points[i + 1]);
  }
  return total;
}

function isOneway(tags: Record<string, string> = {}): "forward" | "reverse" | "both" {
  const tag = (tags.oneway ?? "").toLowerCase();
  if (tag === "yes" || tag === "1" || tag === "true") return "forward";
  if (tag === "-1") return "reverse";
  return "both";
}

export function buildGraphFromOSM(osm: OSMNetwork): RoadGraph {
  const graph = new WeightedGraph();
  const edges: RoadEdge[] = [];

  osm.nodes.forEach((n) => {
    const node: GraphNode = { id: n.id, lat: n.lat, lng: n.lon };
    graph.addNode(node);
  });

  osm.ways.forEach((way) => {
    const oneway = isOneway(way.tags);
    const name = way.tags.name;
    const highway = way.tags.highway;
    const maxspeedMps = parseMaxspeedToMps(way.tags.maxspeed);
    for (let i = 0; i < way.nodes.length - 1; i++) {
      const fromId = way.nodes[i];
      const toId = way.nodes[i + 1];
      const fromNode = graph.nodes.get(fromId);
      const toNode = graph.nodes.get(toId);
      if (!fromNode || !toNode) continue;
      const geometry = way.geometry ?? [];
      const segmentGeometry: [number, number][] =
        geometry.length >= way.nodes.length
          ? (geometry.slice(i, i + 2).map((g) => [g.lat, g.lon]) as [number, number][])
          : [
              [fromNode.lat, fromNode.lng],
              [toNode.lat, toNode.lng]
            ];
      const weight = segmentLength(segmentGeometry);
      const edgeId = `way-${way.id}-${i}`;

      const speed = edgeSpeedMps(highway, maxspeedMps);
      const forward: GraphEdge = {
        id: edgeId,
        to: toId,
        weight,
        name,
        points: segmentGeometry,
        highway,
        maxspeedMps
      };
      if (oneway === "both" || oneway === "forward") {
        graph.addEdge(fromId, forward);
        edges.push({ id: edgeId, from: fromId, to: toId, name, points: segmentGeometry, highway, maxspeedMps: speed });
      }

      const reverseGeometry = [...segmentGeometry].reverse() as [number, number][];
      const reverse: GraphEdge = {
        id: `${edgeId}-rev`,
        to: fromId,
        weight,
        name,
        points: reverseGeometry,
        highway,
        maxspeedMps
      };
      if (oneway === "both" || oneway === "reverse") {
        graph.addEdge(toId, reverse);
        edges.push({
          id: `${edgeId}-rev`,
          from: toId,
          to: fromId,
          name,
          points: reverseGeometry,
          highway,
          maxspeedMps: speed
        });
      }
    }
  });

  console.info(
    `[graph] constructed graph nodes=${graph.nodes.size} edges=${edges.length} adjacency=${graph.adjacency.size}`
  );

  return {
    nodes: graph.nodes,
    adjacency: graph.adjacency,
    edges,
    getNeighbors: (id: string) => graph.getNeighbors(id),
    getEdge: (from: string, to: string) =>
      (graph.getNeighbors(from) ?? []).find((edge) => edge.to === to)
  };
}
