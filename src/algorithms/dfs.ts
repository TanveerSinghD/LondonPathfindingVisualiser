import { AlgorithmGenerator, AlgorithmStep, PathfindingAlgorithm, TraversableGraph } from "./types";
import { buildResult } from "./utils";

function* dfs(graph: TraversableGraph, startId: string, goalId: string): AlgorithmGenerator {
  const visited = new Set<string>();
  const frontier = new Set<string>();
  const cameFrom = new Map<string, string>();
  const distances = new Map<string, number>();
  const stack: string[] = [startId];
  const visitedOrder: string[] = [];
  distances.set(startId, 0);

  while (stack.length) {
    const current = stack.pop()!;
    if (visited.has(current)) continue;
    visited.add(current);
    visitedOrder.push(current);

    frontier.clear();
    stack.forEach((id) => frontier.add(id));

    const step: AlgorithmStep = {
      current,
      visited: new Set(visited),
      frontier: new Set(frontier),
      distances: new Map(distances),
      cameFrom: new Map(cameFrom),
      status: "processing"
    };
    yield step;

    if (current === goalId) {
      return buildResult(cameFrom, current, startId, distances, visitedOrder);
    }

    for (const edge of graph.getNeighbors(current)) {
      if (!visited.has(edge.to)) {
        cameFrom.set(edge.to, current);
        distances.set(edge.to, (distances.get(current) ?? 0) + edge.weight);
        stack.push(edge.to);
      }
    }
  }

  return {
    path: [],
    cost: Number.POSITIVE_INFINITY,
    visitedOrder
  };
}

export const dfsAlgorithm: PathfindingAlgorithm = {
  key: "dfs",
  label: "Depth-First",
  run: dfs
};
