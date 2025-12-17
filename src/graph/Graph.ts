import { Graph, GraphEdge, GraphNode } from "./types";

export class WeightedGraph implements Graph {
  nodes = new Map<string, GraphNode>();
  adjacency = new Map<string, GraphEdge[]>();

  addNode(node: GraphNode): void {
    if (!this.nodes.has(node.id)) {
      this.nodes.set(node.id, node);
      this.adjacency.set(node.id, []);
    }
  }

  addEdge(from: string, edge: GraphEdge): void {
    const edges = this.adjacency.get(from);
    if (!edges) {
      throw new Error(`Node ${from} missing in graph`);
    }
    edges.push(edge);
  }

  getNeighbors(id: string): GraphEdge[] {
    return this.adjacency.get(id) ?? [];
  }
}
