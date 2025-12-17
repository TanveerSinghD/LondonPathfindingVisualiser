import { AlgorithmGenerator, AlgorithmStep, PathfindingAlgorithm, TraversableGraph } from "./types";
import { buildResult } from "./utils";
import { geoHeuristic } from "./heuristics";

function* greedyBestFirst(
  graph: TraversableGraph,
  startId: string,
  goalId: string
): AlgorithmGenerator {
  const visited = new Set<string>();
  const frontier = new Set<string>();
  const cameFrom = new Map<string, string>();
  const distances = new Map<string, number>([[startId, 0]]);
  const visitedOrder: string[] = [];
  const queue: Array<{ id: string; priority: number }> = [
    { id: startId, priority: geoHeuristic(startId, goalId, graph.nodes) }
  ];

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
      if (!visited.has(edge.to)) {
        const weight = (distances.get(current.id) ?? 0) + edge.weight;
        distances.set(edge.to, weight);
        cameFrom.set(edge.to, current.id);
        queue.push({ id: edge.to, priority: geoHeuristic(edge.to, goalId, graph.nodes) });
      }
    }
  }

  return {
    path: [],
    cost: Number.POSITIVE_INFINITY,
    visitedOrder
  };
}

export const greedyBestFirstAlgorithm: PathfindingAlgorithm = {
  key: "greedy",
  label: "Greedy Best-First",
  run: greedyBestFirst,
  supportsHeuristic: true
};
