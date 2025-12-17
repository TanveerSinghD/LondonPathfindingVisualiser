import { AlgorithmGenerator, AlgorithmStep, PathfindingAlgorithm, TraversableGraph } from "./types";
import { buildResult } from "./utils";

function* bfs(graph: TraversableGraph, startId: string, goalId: string): AlgorithmGenerator {
  const visited = new Set<string>([startId]);
  const frontier = new Set<string>();
  const cameFrom = new Map<string, string>();
  const distances = new Map<string, number>([[startId, 0]]);
  const queue: string[] = [startId];
  const visitedOrder: string[] = [];

  while (queue.length) {
    const current = queue.shift()!;
    visitedOrder.push(current);

    frontier.clear();
    queue.forEach((id) => frontier.add(id));

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
        visited.add(edge.to);
        cameFrom.set(edge.to, current);
        distances.set(edge.to, (distances.get(current) ?? 0) + edge.weight);
        queue.push(edge.to);
      }
    }
  }

  return {
    path: [],
    cost: Number.POSITIVE_INFINITY,
    visitedOrder
  };
}

export const bfsAlgorithm: PathfindingAlgorithm = {
  key: "bfs",
  label: "Breadth-First",
  run: bfs
};
