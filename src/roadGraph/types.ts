import { GraphEdge, GraphNode } from "../graph/types";

export interface RoadGraph {
  nodes: Map<string, GraphNode>;
  adjacency: Map<string, GraphEdge[]>;
  getNeighbors(id: string): GraphEdge[];
  getEdge(from: string, to: string): GraphEdge | undefined;
  edges: RoadEdgeInput[];
}

export interface RoadEdgeInput {
  from: string;
  to: string;
  name?: string;
  coords?: number[][];
}

export interface RoadGraphData {
  nodes: { id: string; lat: number; lng: number; name?: string }[];
  edges: RoadEdgeInput[];
}
