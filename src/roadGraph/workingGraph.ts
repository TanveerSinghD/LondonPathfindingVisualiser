import { GraphEdge, GraphNode } from "../graph/types";
import { lengthOfEdge } from "../utils/geo";
import { RoadGraph } from "./types";
import { SnapResult, snapPointToRoad } from "./snap";

export interface WorkingGraph {
  nodes: Map<string, GraphNode>;
  adjacency: Map<string, GraphEdge[]>;
  getNeighbors(id: string): GraphEdge[];
  getEdge(from: string, to: string): GraphEdge | undefined;
}

type TempNodeKind = "start" | "dest";

function cloneGraph(base: RoadGraph): WorkingGraph {
  const nodes = new Map<string, GraphNode>(base.nodes);
  const adjacency = new Map<string, GraphEdge[]>();
  base.adjacency.forEach((edges, key) => {
    adjacency.set(
      key,
      edges.map((e) => ({ ...e, points: e.points ? [...e.points] : undefined }))
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

function insertTemporaryNode(
  graph: WorkingGraph,
  snap: SnapResult,
  kind: TempNodeKind
): string {
  const id = `${kind}-temp-${Date.now()}`;
  const { edge, snappedPoint, segmentIndex } = snap;

  const coords = edge.points ?? [];
  if (!coords.length) {
    coords.push(
      [graph.nodes.get(snap.from)!.lat, graph.nodes.get(snap.from)!.lng],
      [graph.nodes.get(snap.to)!.lat, graph.nodes.get(snap.to)!.lng]
    );
  }
  const { first, second } = splitPolylineAtIndex(coords, segmentIndex, snappedPoint);

  const snappedNode: GraphNode = { id, lat: snappedPoint[0], lng: snappedPoint[1] };
  graph.nodes.set(id, snappedNode);

  // Replace edge from -> to with two edges
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
    const revCoords = reverse.points ?? [...coords].reverse();
    const reversed = [...revCoords].reverse();
    const { first: rFirst, second: rSecond } = splitPolylineAtIndex(
      reversed,
      reversed.length - segmentIndex - 2,
      snappedPoint
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
  start: [number, number],
  dest: [number, number]
): { graph: WorkingGraph; startId: string; destId: string; snaps: { start: SnapResult; dest: SnapResult } } {
  const graph = cloneGraph(base);

  const startSnap = snapPointToRoad(base, start);
  const destSnap = snapPointToRoad(base, dest);

  if (!startSnap || !destSnap) {
    throw new Error("Unable to snap start or destination to a road.");
  }

  const startId = insertTemporaryNode(graph, startSnap, "start");
  const destId = insertTemporaryNode(graph, destSnap, "dest");

  return { graph, startId, destId, snaps: { start: startSnap, dest: destSnap } };
}
