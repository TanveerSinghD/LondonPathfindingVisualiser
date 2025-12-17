import { AlgorithmGenerator, AlgorithmStep, PathfindingAlgorithm, TraversableGraph } from "./types";
import { buildResult } from "./utils";

function* dijkstra(
  graph: TraversableGraph,
  startId: string,
  goalId: string
): AlgorithmGenerator {
  const visited = new Set<string>();
  const frontier = new Set<string>();
  const cameFrom = new Map<string, string>();
  const distances = new Map<string, number>();
  const visitedOrder: string[] = [];

  distances.set(startId, 0);
  const queue: Array<{ id: string; priority: number }> = [{ id: startId, priority: 0 }];

  while (queue.length) {
    queue.sort((a, b) => a.priority - b.priority);
    const current = queue.shift()!;
    if (visited.has(current.id)) continue;
    visited.add(current.id);
    visitedOrder.push(current.id);

    frontier.clear();
    queue.forEach((item) => frontier.add(item.id));

    const step: AlgorithmStep = {
      current: current.id,
      visited: new Set(visited),
      frontier: new Set(frontier),
      distances: new Map(distances),
      cameFrom: new Map(cameFrom),
      status: "processing"
    };
    yield step;

    if (current.id === goalId) {
      return buildResult(cameFrom, current.id, startId, distances, visitedOrder);
    }

    for (const edge of graph.getNeighbors(current.id)) {
      const nextDist = (distances.get(current.id) ?? Infinity) + edge.weight;
      if (nextDist < (distances.get(edge.to) ?? Infinity)) {
        distances.set(edge.to, nextDist);
        cameFrom.set(edge.to, current.id);
        queue.push({ id: edge.to, priority: nextDist });
      }
    }
  }

  return {
    path: [],
    cost: Number.POSITIVE_INFINITY,
    visitedOrder
  };
}

export const dijkstraAlgorithm: PathfindingAlgorithm = {
  key: "dijkstra",
  label: "Dijkstra",
  run: dijkstra
};
