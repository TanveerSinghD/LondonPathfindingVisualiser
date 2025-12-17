import { AlgorithmGenerator, AlgorithmStep, PathfindingAlgorithm, TraversableGraph } from "./types";
import { reconstructBidirectionalPath } from "./bidirectionalUtils";

function* bidirectionalDFS(
  graph: TraversableGraph,
  startId: string,
  goalId: string
): AlgorithmGenerator {
  const forwardVisited = new Set<string>();
  const backwardVisited = new Set<string>();
  const forwardStack: string[] = [startId];
  const backwardStack: string[] = [goalId];
  const forwardCameFrom = new Map<string, string>();
  const backwardCameFrom = new Map<string, string>();
  const visitedOrder: string[] = [];
  let meetingId: string | undefined;

  while (forwardStack.length && backwardStack.length) {
    const fCurrent = forwardStack.pop()!;
    if (forwardVisited.has(fCurrent)) continue;
    forwardVisited.add(fCurrent);
    visitedOrder.push(fCurrent);
    if (backwardVisited.has(fCurrent)) meetingId = fCurrent;

    const bCurrent = backwardStack.pop()!;
    if (backwardVisited.has(bCurrent)) continue;
    backwardVisited.add(bCurrent);
    visitedOrder.push(bCurrent);
    if (forwardVisited.has(bCurrent)) meetingId = bCurrent;

    const step: AlgorithmStep = {
      current: fCurrent,
      backCurrent: bCurrent,
      visited: new Set(forwardVisited),
      frontier: new Set([forwardStack[forwardStack.length - 1]].filter(Boolean)),
      distances: new Map(),
      cameFrom: new Map(forwardCameFrom),
      backVisited: new Set(backwardVisited),
      backFrontier: new Set([backwardStack[backwardStack.length - 1]].filter(Boolean)),
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

    const fNeighbors = graph.getNeighbors(fCurrent);
    for (const edge of fNeighbors) {
      if (!forwardVisited.has(edge.to)) {
        forwardCameFrom.set(edge.to, fCurrent);
        forwardStack.push(edge.to);
      }
    }

    const bNeighbors = graph.getNeighbors(bCurrent);
    for (const edge of bNeighbors) {
      if (!backwardVisited.has(edge.to)) {
        backwardCameFrom.set(edge.to, bCurrent);
        backwardStack.push(edge.to);
      }
    }
  }

  return { path: [], cost: Number.POSITIVE_INFINITY, visitedOrder };
}

export const bidirectionalDFSAlgorithm: PathfindingAlgorithm = {
  key: "bidi-dfs",
  label: "Bidirectional DFS",
  run: bidirectionalDFS
};
