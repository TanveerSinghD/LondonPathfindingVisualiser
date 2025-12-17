import { AlgorithmResult } from "./types";

export function reconstructPath(
  cameFrom: Map<string, string>,
  current: string,
  start: string
): string[] {
  const path = [current];
  let node = current;
  while (cameFrom.has(node)) {
    node = cameFrom.get(node)!;
    path.push(node);
    if (node === start) break;
  }
  return path.reverse();
}

export function buildResult(
  cameFrom: Map<string, string>,
  current: string,
  start: string,
  distances: Map<string, number>,
  visitedOrder: string[]
): AlgorithmResult {
  const path = reconstructPath(cameFrom, current, start);
  return {
    path,
    cost: distances.get(current) ?? Number.POSITIVE_INFINITY,
    visitedOrder
  };
}
