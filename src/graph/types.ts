export interface GraphNode {
  id: string;
  lat: number;
  lng: number;
}

export interface GraphEdge {
  to: string;
  weight: number;
  name?: string;
  points?: [number, number][];
  /** Optional identifier for reverse lookup when splitting edges. */
  id?: string;
  highway?: string;
  maxspeedMps?: number;
}

export interface Graph {
  nodes: Map<string, GraphNode>;
  adjacency: Map<string, GraphEdge[]>;
  addNode(node: GraphNode): void;
  addEdge(from: string, edge: GraphEdge): void;
  getNeighbors(id: string): GraphEdge[];
}
