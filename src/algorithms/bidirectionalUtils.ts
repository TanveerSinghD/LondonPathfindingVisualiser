import { GraphNode } from "../graph/types";
import { haversineDistance } from "../utils/geo";

export function reconstructBidirectionalPath(
  meetingId: string,
  forwardCameFrom: Map<string, string>,
  backwardCameFrom: Map<string, string>,
  startId: string,
  goalId: string
): string[] {
  const forwardPath = [];
  let node: string | undefined = meetingId;
  while (node !== undefined) {
    forwardPath.push(node);
    if (node === startId) break;
    node = forwardCameFrom.get(node);
  }
  forwardPath.reverse();

  const backwardPath: string[] = [];
  node = backwardCameFrom.get(meetingId);
  while (node !== undefined) {
    backwardPath.push(node);
    if (node === goalId) break;
    node = backwardCameFrom.get(node);
  }

  return [...forwardPath, meetingId, ...backwardPath].filter(
    (v, idx, arr) => !(idx > 0 && arr[idx - 1] === v)
  );
}

export function geoHeuristicId(id: string, goalId: string, nodes: Map<string, GraphNode>): number {
  const a = nodes.get(id);
  const b = nodes.get(goalId);
  if (!a || !b) return 0;
  return haversineDistance([a.lat, a.lng], [b.lat, b.lng]);
}
