import { AlgorithmGenerator, AlgorithmStep, PathfindingAlgorithm, TraversableGraph } from "./types";
import { reconstructBidirectionalPath } from "./bidirectionalUtils";

interface QueueItem {
  id: string;
  priority: number;
}

function popMin(queue: QueueItem[]) {
  queue.sort((a, b) => a.priority - b.priority);
  return queue.shift();
}

function* bidirectionalDijkstra(
  graph: TraversableGraph,
  startId: string,
  goalId: string
): AlgorithmGenerator {
  const forwardVisited = new Set<string>();
  const backwardVisited = new Set<string>();
  const forwardFrontier = new Set<string>();
  const backwardFrontier = new Set<string>();
  const forwardDistances = new Map<string, number>([[startId, 0]]);
  const backwardDistances = new Map<string, number>([[goalId, 0]]);
  const forwardCameFrom = new Map<string, string>();
  const backwardCameFrom = new Map<string, string>();
  const visitedOrder: string[] = [];

  const forwardQueue: QueueItem[] = [{ id: startId, priority: 0 }];
  const backwardQueue: QueueItem[] = [{ id: goalId, priority: 0 }];

  let meetingId: string | undefined;

  while (forwardQueue.length && backwardQueue.length) {
    const fCurrent = popMin(forwardQueue);
    if (!fCurrent) break;
    if (forwardVisited.has(fCurrent.id)) continue;
    forwardVisited.add(fCurrent.id);
    visitedOrder.push(fCurrent.id);
    if (backwardVisited.has(fCurrent.id)) {
      meetingId = fCurrent.id;
    }

    forwardFrontier.clear();
    forwardQueue.forEach((i) => forwardFrontier.add(i.id));

    const bCurrent = popMin(backwardQueue);
    if (!bCurrent) break;
    if (backwardVisited.has(bCurrent.id)) continue;
    backwardVisited.add(bCurrent.id);
    visitedOrder.push(bCurrent.id);
    if (forwardVisited.has(bCurrent.id)) {
      meetingId = bCurrent.id;
    }

    backwardFrontier.clear();
    backwardQueue.forEach((i) => backwardFrontier.add(i.id));

    const step: AlgorithmStep = {
      current: fCurrent.id,
      backCurrent: bCurrent.id,
      visited: new Set(forwardVisited),
      frontier: new Set(forwardFrontier),
      distances: new Map(forwardDistances),
      cameFrom: new Map(forwardCameFrom),
      backVisited: new Set(backwardVisited),
      backFrontier: new Set(backwardFrontier),
      backDistances: new Map(backwardDistances),
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
      const cost =
        (forwardDistances.get(meetingId) ?? 0) + (backwardDistances.get(meetingId) ?? 0);
      return {
        path,
        cost,
        visitedOrder,
        meetingId
      };
    }

    for (const edge of graph.getNeighbors(fCurrent.id)) {
      const nextDist = (forwardDistances.get(fCurrent.id) ?? Infinity) + edge.weight;
      if (nextDist < (forwardDistances.get(edge.to) ?? Infinity)) {
        forwardDistances.set(edge.to, nextDist);
        forwardCameFrom.set(edge.to, fCurrent.id);
        forwardQueue.push({ id: edge.to, priority: nextDist });
      }
    }

    for (const edge of graph.getNeighbors(bCurrent.id)) {
      const nextDist = (backwardDistances.get(bCurrent.id) ?? Infinity) + edge.weight;
      if (nextDist < (backwardDistances.get(edge.to) ?? Infinity)) {
        backwardDistances.set(edge.to, nextDist);
        backwardCameFrom.set(edge.to, bCurrent.id);
        backwardQueue.push({ id: edge.to, priority: nextDist });
      }
    }
  }

  return { path: [], cost: Number.POSITIVE_INFINITY, visitedOrder };
}

export const bidirectionalDijkstraAlgorithm: PathfindingAlgorithm = {
  key: "bidi-dijkstra",
  label: "Bidirectional Dijkstra",
  run: bidirectionalDijkstra
};
