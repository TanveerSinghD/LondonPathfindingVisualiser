import { WeightedGraph } from "../graph/Graph";
import { GraphEdge, GraphNode } from "../graph/types";
import { haversineDistance } from "../utils/geo";
import { RoadEdgeInput, RoadGraph, RoadGraphData } from "./types";
import rawData from "../data/london_roads.json";
import { densifyGeometry } from "./densify";

const STEP_METERS = 8; // dense sampling for smooth animation and no jumps

function coordKey(lat: number, lng: number) {
  return `${lat.toFixed(6)},${lng.toFixed(6)}`;
}

function getOrCreateNode(
  graph: WeightedGraph,
  coordToId: Map<string, string>,
  lat: number,
  lng: number
): string {
  const key = coordKey(lat, lng);
  const existing = coordToId.get(key);
  if (existing) return existing;
  const id = `n-${graph.nodes.size + 1}`;
  const node: GraphNode = { id, lat, lng };
  graph.addNode(node);
  coordToId.set(key, id);
  return id;
}

function addSegmentEdge(
  graph: WeightedGraph,
  fromId: string,
  toId: string,
  points: [number, number][],
  name: string | undefined,
  edgeIndex: number,
  segmentIndex: number
) {
  const weight = haversineDistance(points[0], points[points.length - 1]);
  const edge: GraphEdge = {
    id: `e-${edgeIndex}-${segmentIndex}-${fromId}-${toId}`,
    to: toId,
    name,
    points,
    weight
  };
  graph.addEdge(fromId, edge);
}

export function buildRoadGraph(): RoadGraph {
  const graph = new WeightedGraph();
  const data = rawData as RoadGraphData;
  const coordToId = new Map<string, string>();
  const densifiedEdges: RoadEdgeInput[] = [];

  data.nodes.forEach((n) => {
    graph.addNode(n);
    coordToId.set(coordKey(n.lat, n.lng), n.id);
  });

  let originalEdgeCount = 0;
  let densifiedEdgeCount = 0;

  data.edges.forEach((edge, edgeIdx) => {
    originalEdgeCount += 1;
    const baseCoords = (edge.coords as [number, number][] | undefined) ?? [];
    if (!baseCoords.length) return;

    const denseCoords = densifyGeometry(baseCoords, STEP_METERS);

    for (let i = 0; i < denseCoords.length - 1; i++) {
      const a = denseCoords[i];
      const b = denseCoords[i + 1];
      const fromId = getOrCreateNode(graph, coordToId, a[0], a[1]);
      const toId = getOrCreateNode(graph, coordToId, b[0], b[1]);
      addSegmentEdge(graph, fromId, toId, [a, b], edge.name, edgeIdx, i);
      addSegmentEdge(graph, toId, fromId, [b, a], edge.name, edgeIdx, i); // bidirectional
      densifiedEdges.push({ from: fromId, to: toId, name: edge.name, coords: [a, b] });
      densifiedEdges.push({ from: toId, to: fromId, name: edge.name, coords: [b, a] });
      densifiedEdgeCount += 2;
    }
  });

  console.info(
    `[roadGraph] edges original=${originalEdgeCount}, densified segments=${densifiedEdgeCount}, nodes=${graph.nodes.size}`
  );

  return {
    nodes: graph.nodes,
    adjacency: graph.adjacency,
    getNeighbors: (id: string) => graph.getNeighbors(id),
    getEdge: (from: string, to: string) =>
      graph.getNeighbors(from).find((edge) => edge.to === to),
    edges: densifiedEdges
  };
}
