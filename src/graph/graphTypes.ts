import { GraphEdge, GraphNode } from "./types";

export interface RoadEdge {
  id: string;
  from: string;
  to: string;
  name?: string;
  points: [number, number][];
  highway?: string;
  maxspeedMps?: number;
}

export interface RoadGraph {
  nodes: Map<string, GraphNode>;
  adjacency: Map<string, GraphEdge[]>;
  edges: RoadEdge[];
  getNeighbors(id: string): GraphEdge[];
  getEdge(from: string, to: string): GraphEdge | undefined;
}

export interface BoundingBox {
  south: number;
  west: number;
  north: number;
  east: number;
}
