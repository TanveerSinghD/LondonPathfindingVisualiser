import { AlgorithmResult, AlgorithmStep } from "../algorithms/types";
import { GraphNode } from "../graph/types";
import { Coordinates } from "../services/locationService";

export type SpeedSetting = "slow" | "normal" | "fast";

export const SPEED_MAP: Record<SpeedSetting, number> = {
  slow: 700,
  normal: 280,
  fast: 80
};

export interface VisualizationStep {
  visitedIds: string[];
  frontierIds: string[];
  currentId: string;
  cameFrom: Map<string, string>;
  distances: Map<string, number>;
  backVisitedIds?: string[];
  backFrontierIds?: string[];
  backCurrentId?: string;
  backCameFrom?: Map<string, string>;
  backDistances?: Map<string, number>;
  meetingId?: string;
}

export interface VisualizationResult {
  pathIds: string[];
  pathNodes: GraphNode[];
  cost: number;
  visitedOrder: string[];
  meetingId?: string;
}

export interface VisualizationSnapshot {
  visitedNodes: Coordinates[];
  frontierNodes: Coordinates[];
  backVisitedNodes?: Coordinates[];
  backFrontierNodes?: Coordinates[];
  visitedPaths: Coordinates[][];
  frontierPaths: Coordinates[][];
  backVisitedPaths?: Coordinates[][];
  backFrontierPaths?: Coordinates[][];
  path: Coordinates[];
  meetingPoint?: Coordinates | null;
  stepCounts?: { forward: number; backward: number };
}

export function normalizeStep(step: AlgorithmStep): VisualizationStep {
  return {
    visitedIds: Array.from(step.visited),
    frontierIds: Array.from(step.frontier),
    currentId: step.current,
    cameFrom: new Map(step.cameFrom),
    distances: new Map(step.distances),
    backVisitedIds: step.backVisited ? Array.from(step.backVisited) : undefined,
    backFrontierIds: step.backFrontier ? Array.from(step.backFrontier) : undefined,
    backCurrentId: step.backCurrent,
    backCameFrom: step.backCameFrom ? new Map(step.backCameFrom) : undefined,
    backDistances: step.backDistances ? new Map(step.backDistances) : undefined,
    meetingId: step.meetingId
  };
}

export function buildVisualizationResult(
  result: AlgorithmResult,
  nodes: Map<string, GraphNode>
): VisualizationResult {
  return {
    pathIds: result.path,
    pathNodes: result.path.map((id) => nodes.get(id)).filter(Boolean) as GraphNode[],
    cost: result.cost,
    visitedOrder: result.visitedOrder,
    meetingId: result.meetingId
  };
}
