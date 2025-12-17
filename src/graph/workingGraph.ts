import { lengthOfEdge } from "../utils/geo";
import { GraphEdge, GraphNode } from "./types";
import { RoadGraph } from "./graphTypes";
import { SnapResult } from "./snapPointToEdge";

export interface WorkingGraph {
  nodes: Map<string, GraphNode>;
  adjacency: Map<string, GraphEdge[]>;
  getNeighbors(id: string): GraphEdge[];
  getEdge(from: string, to: string): GraphEdge | undefined;
}

type TempNodeKind = "start" | "dest";

let tempIdCounter = 0;

function cloneGraph(base: RoadGraph): WorkingGraph {
  const nodes = new Map<string, GraphNode>(base.nodes);
  const adjacency = new Map<string, GraphEdge[]>();
  base.adjacency.forEach((edges, key) => {
    adjacency.set(
      key,
      edges.map((edge) => ({
        ...edge,
        points: edge.points ? [...edge.points] : undefined
      }))
    );
  });

  return {
    nodes,
    adjacency,
    getNeighbors: (id: string) => adjacency.get(id) ?? [],
    getEdge: (from: string, to: string) =>
      (adjacency.get(from) ?? []).find((edge) => edge.to === to)
  };
}

function splitPolylineAtIndex(
  coords: [number, number][],
  segmentIndex: number,
  snapped: [number, number]
): { first: [number, number][]; second: [number, number][] } {
  const first = coords.slice(0, segmentIndex + 1);
  first.push(snapped);
  const second = [snapped, ...coords.slice(segmentIndex + 1)];
  return { first, second };
}

function findEdge(graph: WorkingGraph, from: string, to: string, edgeId?: string) {
  const edges = graph.getNeighbors(from).filter((e) => e.to === to);
  if (!edgeId) return edges[0];
  return edges.find((e) => e.id === edgeId) ?? edges[0];
}

function insertTemporaryNode(graph: WorkingGraph, snap: SnapResult, kind: TempNodeKind): string {
  const id = `${kind}-temp-${Date.now()}-${tempIdCounter++}`;
  const edge = findEdge(graph, snap.from, snap.to, snap.edgeId);

  if (!edge) {
    throw new Error(`Cannot insert snapped node, edge ${snap.from}->${snap.to} missing`);
  }

  const coords = edge.points ?? [
    [graph.nodes.get(snap.from)!.lat, graph.nodes.get(snap.from)!.lng],
    [graph.nodes.get(snap.to)!.lat, graph.nodes.get(snap.to)!.lng]
  ];

  const { first, second } = splitPolylineAtIndex(coords, snap.segmentIndex, snap.snappedPoint);

  const snappedNode: GraphNode = { id, lat: snap.snappedPoint[0], lng: snap.snappedPoint[1] };
  graph.nodes.set(id, snappedNode);

  const neighbors = graph.getNeighbors(snap.from).filter((e) => e.to !== snap.to);
  neighbors.push({
    id: `${edge.id}-partA-${kind}`,
    to: id,
    name: edge.name,
    points: first,
    weight: lengthOfEdge(
      { to: id, weight: 0, name: edge.name, points: first },
      graph.nodes.get(snap.from)!,
      snappedNode
    )
  });
  graph.adjacency.set(snap.from, neighbors);

  graph.adjacency.set(id, [
    {
      id: `${edge.id}-partB-${kind}`,
      to: snap.to,
      name: edge.name,
      points: second,
      weight: lengthOfEdge(
        { to: snap.to, weight: 0, name: edge.name, points: second },
        snappedNode,
        graph.nodes.get(snap.to)!
      )
    }
  ]);

  // Handle reverse edge if present
  const reverse = graph.getEdge(snap.to, snap.from);
  if (reverse) {
    const reversedCoords = reverse.points ?? [
      [graph.nodes.get(snap.to)!.lat, graph.nodes.get(snap.to)!.lng],
      [graph.nodes.get(snap.from)!.lat, graph.nodes.get(snap.from)!.lng]
    ];
    const reversed = [...reversedCoords].reverse();
    const { first: rFirst, second: rSecond } = splitPolylineAtIndex(
      reversed,
      reversed.length - snap.segmentIndex - 2,
      snap.snappedPoint
    );
    const cleaned = graph.getNeighbors(snap.to).filter((e) => e.to !== snap.from);
    cleaned.push({
      id: `${reverse.id}-partA-${kind}`,
      to: id,
      name: reverse.name,
      points: rFirst,
      weight: lengthOfEdge(
        { to: id, weight: 0, name: reverse.name, points: rFirst },
        graph.nodes.get(snap.to)!,
        snappedNode
      )
    });
    graph.adjacency.set(snap.to, cleaned);

    const atTemp = graph.getNeighbors(id);
    atTemp.push({
      id: `${reverse.id}-partB-${kind}`,
      to: snap.to,
      name: reverse.name,
      points: rSecond,
      weight: lengthOfEdge(
        { to: snap.to, weight: 0, name: reverse.name, points: rSecond },
        snappedNode,
        graph.nodes.get(snap.to)!
      )
    });
    graph.adjacency.set(id, atTemp);
  }

  return id;
}

export function buildWorkingGraphWithSnaps(
  base: RoadGraph,
  startSnap: SnapResult,
  destSnap: SnapResult
): { graph: WorkingGraph; startId: string; destId: string } {
  const graph = cloneGraph(base);
  const startId = insertTemporaryNode(graph, startSnap, "start");
  const destId = insertTemporaryNode(graph, destSnap, "dest");

  return { graph, startId, destId };
}
