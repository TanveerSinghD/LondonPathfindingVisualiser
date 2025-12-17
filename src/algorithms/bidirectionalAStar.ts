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

function* bidirectionalAStar(
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

  const forwardQueue: QueueItem[] = [
    { id: startId, priority: geoHeuristicId(startId, goalId, graph.nodes) }
  ];
  const backwardQueue: QueueItem[] = [
    { id: goalId, priority: geoHeuristicId(goalId, startId, graph.nodes) }
  ];

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
      const gScore = (forwardDistances.get(fCurrent.id) ?? Infinity) + edge.weight;
      if (gScore < (forwardDistances.get(edge.to) ?? Infinity)) {
        forwardDistances.set(edge.to, gScore);
        forwardCameFrom.set(edge.to, fCurrent.id);
        const priority = gScore + geoHeuristicId(edge.to, goalId, graph.nodes);
        forwardQueue.push({ id: edge.to, priority });
      }
    }

    for (const edge of graph.getNeighbors(bCurrent.id)) {
      const gScore = (backwardDistances.get(bCurrent.id) ?? Infinity) + edge.weight;
      if (gScore < (backwardDistances.get(edge.to) ?? Infinity)) {
        backwardDistances.set(edge.to, gScore);
        backwardCameFrom.set(edge.to, bCurrent.id);
        const priority = gScore + geoHeuristicId(edge.to, startId, graph.nodes);
        backwardQueue.push({ id: edge.to, priority });
      }
    }
  }

  return { path: [], cost: Number.POSITIVE_INFINITY, visitedOrder };
}

export const bidirectionalAStarAlgorithm: PathfindingAlgorithm = {
  key: "bidi-astar",
  label: "Bidirectional A*",
  run: bidirectionalAStar,
  supportsHeuristic: true
};
