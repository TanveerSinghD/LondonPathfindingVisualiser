import { GraphEdge, GraphNode } from "../graph/types";

export interface TraversableGraph {
  nodes: Map<string, GraphNode>;
  getNeighbors(id: string): GraphEdge[];
}

export type AlgorithmKey =
  | "dijkstra"
  | "astar"
  | "bfs"
  | "dfs"
  | "greedy"
  | "bidi-dijkstra"
  | "bidi-astar"
  | "bidi-dfs"
  | "bidi-greedy"
  | "typical";

export type HeuristicFn = (
  id: string,
  goalId: string,
  nodes: Map<string, GraphNode>
) => number;

export interface AlgorithmStep {
  current: string;
  visited: Set<string>;
  frontier: Set<string>;
  distances: Map<string, number>;
  cameFrom: Map<string, string>;
  status?: "processing" | "success" | "failed";
  backCurrent?: string;
  backVisited?: Set<string>;
  backFrontier?: Set<string>;
  backDistances?: Map<string, number>;
  backCameFrom?: Map<string, string>;
  meetingId?: string;
}

export interface AlgorithmResult {
  path: string[];
  cost: number;
  visitedOrder: string[];
  meetingId?: string;
}

export type AlgorithmGenerator = Generator<AlgorithmStep, AlgorithmResult, void>;

export interface PathfindingAlgorithm {
  key: AlgorithmKey;
  label: string;
  run: (
    graph: TraversableGraph,
    startId: string,
    goalId: string,
    heuristic?: HeuristicFn
  ) => AlgorithmGenerator;
  supportsHeuristic?: boolean;
}
