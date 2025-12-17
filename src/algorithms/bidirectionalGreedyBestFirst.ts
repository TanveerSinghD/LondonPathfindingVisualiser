import { AlgorithmGenerator, AlgorithmStep, PathfindingAlgorithm, TraversableGraph } from "./types";
import { reconstructBidirectionalPath, geoHeuristicId } from "./bidirectionalUtils";

interface QueueItem {
  id: string;
  priority: number;
}

function popMin(queue: QueueItem[]) {
  queue.sort((a, b) => a.priority - b.priority);
  return queue.shift();
}

function* bidirectionalGreedy(
  graph: TraversableGraph,
  startId: string,
  goalId: string
): AlgorithmGenerator {
  const forwardVisited = new Set<string>();
  const backwardVisited = new Set<string>();
  const forwardFrontier = new Set<string>();
  const backwardFrontier = new Set<string>();
  const forwardCameFrom = new Map<string, string>();
  const backwardCameFrom = new Map<string, string>();
  const visitedOrder: string[] = [];

  const forwardQueue: QueueItem[] = [{ id: startId, priority: geoHeuristicId(startId, goalId, graph.nodes) }];
  const backwardQueue: QueueItem[] = [{ id: goalId, priority: geoHeuristicId(goalId, startId, graph.nodes) }];
  let meetingId: string | undefined;

  while (forwardQueue.length && backwardQueue.length) {
    const fCurrent = popMin(forwardQueue);
    if (!fCurrent) break;
    if (forwardVisited.has(fCurrent.id)) continue;
    forwardVisited.add(fCurrent.id);
    visitedOrder.push(fCurrent.id);
    if (backwardVisited.has(fCurrent.id)) meetingId = fCurrent.id;

    forwardFrontier.clear();
    forwardQueue.forEach((i) => forwardFrontier.add(i.id));

    const bCurrent = popMin(backwardQueue);
    if (!bCurrent) break;
    if (backwardVisited.has(bCurrent.id)) continue;
    backwardVisited.add(bCurrent.id);
    visitedOrder.push(bCurrent.id);
    if (forwardVisited.has(bCurrent.id)) meetingId = bCurrent.id;

    backwardFrontier.clear();
    backwardQueue.forEach((i) => backwardFrontier.add(i.id));

    const step: AlgorithmStep = {
      current: fCurrent.id,
      backCurrent: bCurrent.id,
      visited: new Set(forwardVisited),
      frontier: new Set(forwardFrontier),
      distances: new Map(),
      cameFrom: new Map(forwardCameFrom),
      backVisited: new Set(backwardVisited),
      backFrontier: new Set(backwardFrontier),
      backDistances: new Map(),
      backCameFrom: new Map(backwardCameFrom),
      meetingId
    };
    yield step;

    if (meetingId) {
      const path = reconstructBidirectionalPath(
        meetingId,
        forwardCameFrom,
        backwardCameFrom,
        startId,
        goalId
      );
      return { path, cost: path.length, visitedOrder, meetingId };
    }

    for (const edge of graph.getNeighbors(fCurrent.id)) {
      if (forwardVisited.has(edge.to)) continue;
      forwardCameFrom.set(edge.to, fCurrent.id);
      forwardQueue.push({ id: edge.to, priority: geoHeuristicId(edge.to, goalId, graph.nodes) });
    }

    for (const edge of graph.getNeighbors(bCurrent.id)) {
      if (backwardVisited.has(edge.to)) continue;
      backwardCameFrom.set(edge.to, bCurrent.id);
      backwardQueue.push({ id: edge.to, priority: geoHeuristicId(edge.to, startId, graph.nodes) });
    }
  }

  return { path: [], cost: Number.POSITIVE_INFINITY, visitedOrder };
}

export const bidirectionalGreedyBestFirstAlgorithm: PathfindingAlgorithm = {
  key: "bidi-greedy",
  label: "Bidirectional Greedy Best-First",
  run: bidirectionalGreedy,
  supportsHeuristic: true
};
