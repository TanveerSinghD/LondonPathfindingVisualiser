import { algorithms } from "../algorithms";
import { AlgorithmKey } from "../algorithms/types";
import { reconstructPath } from "../algorithms/utils";
import { Visualizer } from "../visualization/Visualizer";
import {
  VisualizationSnapshot,
  buildVisualizationResult,
  VisualizationStep,
  SpeedSetting
} from "../visualization/types";
import { Coordinates } from "../services/locationService";
import { assertValidCoordinate, lengthOfEdge, lengthOfPath } from "../utils/geo";
import { GraphEdge, GraphNode } from "../graph/types";
import { fetchRoadGraphForRoute } from "./graphProvider";
import { snapPointToEdge, SnapResult } from "../graph/snapPointToEdge";
import { buildWorkingGraphWithSnaps } from "../graph/workingGraph";
import { LONDON_BOUNDS } from "../constants/bounds";
import { RoadGraph } from "../graph/graphTypes";
import { edgeSpeedMps } from "../utils/speed";
import { reconstructBidirectionalPath } from "../algorithms/bidirectionalUtils";

export interface PathfindingCallbacks {
  onStep: (snapshot: VisualizationSnapshot) => void;
  onComplete: (result: {
    path: Coordinates[];
    distanceMeters: number;
    durationMinutes: number;
    durationSeconds: number;
    steps: number;
    meetingNodeId?: string;
  }) => void;
  onError: (message: string) => void;
  onDebug?: (info: SnapDebugInfo) => void;
  onWarning?: (message: string) => void;
}

const visualizer = new Visualizer();

export interface SnapDebugInfo {
  inputStart: Coordinates;
  inputDestination: Coordinates;
  snappedStart: Coordinates;
  snappedDestination: Coordinates;
  startDistance: number;
  destinationDistance: number;
  startNodeId: string;
  destinationNodeId: string;
}

function pathToCoordinates(
  pathIds: string[],
  nodes: Map<string, GraphNode>,
  getEdge: (from: string, to: string) => GraphEdge | undefined
): Coordinates[] {
  const coords: Coordinates[] = [];
  for (let i = 0; i < pathIds.length - 1; i++) {
    const from = nodes.get(pathIds[i]);
    const to = nodes.get(pathIds[i + 1]);
    if (!from || !to) continue;
    const edge = getEdge(pathIds[i], pathIds[i + 1]);
    const points = edge?.points ?? [
      [from.lat, from.lng],
      [to.lat, to.lng]
    ];
    points.forEach((pt, idx) => {
      if (i > 0 && idx === 0) return; // avoid duplicate join
      coords.push({ lat: pt[0], lng: pt[1] });
    });
  }
  if (pathIds.length === 1) {
    const only = nodes.get(pathIds[0]);
    if (only) coords.push({ lat: only.lat, lng: only.lng });
  }
  return coords;
}

function buildEdgePaths(
  ids: string[],
  cameFrom: Map<string, string>,
  nodes: Map<string, GraphNode>,
  getEdge: (from: string, to: string) => GraphEdge | undefined
): Coordinates[][] {
  const paths: Coordinates[][] = [];
  ids.forEach((id) => {
    const parent = cameFrom.get(id);
    if (!parent) return;
    const edge = getEdge(parent, id);
    const from = nodes.get(parent);
    const to = nodes.get(id);
    if (!edge || !from || !to) return;
    const coords = edge.points ?? [
      [from.lat, from.lng],
      [to.lat, to.lng]
    ];
    paths.push(coords.map((p) => ({ lat: p[0], lng: p[1] })));
  });
  return paths;
}

function snapshotFromStep(
  step: VisualizationStep,
  nodes: Map<string, GraphNode>,
  getEdge: (from: string, to: string) => GraphEdge | undefined,
  startId: string,
  destId: string,
  counts?: { forward: number; backward: number }
): VisualizationSnapshot {
  const pathIds =
    step.meetingId && step.backCameFrom
      ? reconstructBidirectionalPath(step.meetingId, step.cameFrom, step.backCameFrom, startId, destId)
      : reconstructPath(step.cameFrom, step.currentId, startId);
  const meetingPoint =
    step.meetingId && nodes.get(step.meetingId)
      ? { lat: nodes.get(step.meetingId)!.lat, lng: nodes.get(step.meetingId)!.lng }
      : null;
  return {
    visitedNodes: step.visitedIds
      .map((id) => nodes.get(id))
      .filter(Boolean)
      .map((node) => ({ lat: node!.lat, lng: node!.lng })),
    frontierNodes: step.frontierIds
      .map((id) => nodes.get(id))
      .filter(Boolean)
      .map((node) => ({ lat: node!.lat, lng: node!.lng })),
    backVisitedNodes: (step.backVisitedIds ?? [])
      .map((id) => nodes.get(id))
      .filter(Boolean)
      .map((node) => ({ lat: node!.lat, lng: node!.lng })),
    backFrontierNodes: (step.backFrontierIds ?? [])
      .map((id) => nodes.get(id))
      .filter(Boolean)
      .map((node) => ({ lat: node!.lat, lng: node!.lng })),
    visitedPaths: buildEdgePaths(step.visitedIds, step.cameFrom, nodes, getEdge),
    frontierPaths: buildEdgePaths(step.frontierIds, step.cameFrom, nodes, getEdge),
    backVisitedPaths: step.backVisitedIds && step.backCameFrom
      ? buildEdgePaths(step.backVisitedIds, step.backCameFrom, nodes, getEdge)
      : [],
    backFrontierPaths: step.backFrontierIds && step.backCameFrom
      ? buildEdgePaths(step.backFrontierIds, step.backCameFrom, nodes, getEdge)
      : [],
    path: pathToCoordinates(pathIds, nodes, getEdge),
    meetingPoint,
    stepCounts: counts
  };
}

function ensureWithinLondon(coords: Coordinates) {
  if (
    coords.lat < LONDON_BOUNDS.minLat ||
    coords.lat > LONDON_BOUNDS.maxLat ||
    coords.lng < LONDON_BOUNDS.minLng ||
    coords.lng > LONDON_BOUNDS.maxLng
  ) {
    throw new Error("Only London coordinates are supported. Please pick points within Greater London.");
  }
}

const SNAP_OK_METERS = 50;
const SNAP_WARN_METERS = 100;

function computeDurationSeconds(
  pathIds: string[],
  nodes: Map<string, GraphNode>,
  getEdge: (from: string, to: string) => GraphEdge | undefined
): number {
  let totalSeconds = 0;
  for (let i = 0; i < pathIds.length - 1; i++) {
    const fromId = pathIds[i];
    const toId = pathIds[i + 1];
    const edge = getEdge(fromId, toId);
    const from = nodes.get(fromId);
    const to = nodes.get(toId);
    if (!edge || !from || !to) continue;
    const distance = lengthOfEdge(edge, from, to);
    const speed = edgeSpeedMps(edge.highway, edge.maxspeedMps);
    if (speed > 0) totalSeconds += distance / speed;
  }
  return totalSeconds;
}

async function buildGraphWithSnaps(
  start: Coordinates,
  destination: Coordinates,
  callbacks: PathfindingCallbacks
): Promise<{
  graph: RoadGraph;
  startSnap: SnapResult;
  destSnap: SnapResult;
}> {
  const paddings = [2500, 5000];
  let lastError: Error | null = null;

  for (const padding of paddings) {
    try {
      const { graph } = await fetchRoadGraphForRoute(start, destination, padding);
      const startSnap = snapPointToEdge(graph, [start.lat, start.lng]);
      const destSnap = snapPointToEdge(graph, [destination.lat, destination.lng]);
      if (!startSnap || !destSnap) {
        lastError = new Error("Unable to snap start or destination to a nearby road.");
        continue;
      }

      if (
        startSnap.distanceMeters <= SNAP_OK_METERS &&
        destSnap.distanceMeters <= SNAP_OK_METERS
      ) {
        return { graph, startSnap, destSnap };
      }

      if (padding === paddings[paddings.length - 1]) {
        callbacks.onWarning?.(
          "Start point too far from nearest road, expanding search area… using best effort."
        );
        return { graph, startSnap, destSnap };
      }

      console.warn(
        `[snap] start ${startSnap.distanceMeters.toFixed(
          1
        )}m, dest ${destSnap.distanceMeters.toFixed(1)}m — expanding bbox`
      );
    } catch (e: any) {
      lastError = e instanceof Error ? e : new Error("Failed to build road graph.");
    }
  }

  throw lastError ?? new Error("Unable to prepare road network for this route.");
}

export async function runPathfinding(
  params: {
    start: Coordinates;
    destination: Coordinates;
    algorithm: AlgorithmKey;
    speed: SpeedSetting;
  },
  callbacks: PathfindingCallbacks
) {
  const algorithm = algorithms[params.algorithm];
  if (!algorithm) {
    callbacks.onError("Algorithm not implemented.");
    return;
  }

  try {
    assertValidCoordinate(params.start);
    assertValidCoordinate(params.destination);
    ensureWithinLondon(params.start);
    ensureWithinLondon(params.destination);
  } catch (e: any) {
    callbacks.onError(e?.message ?? "Invalid coordinates.");
    return;
  }

  let working;
  let startSnap: SnapResult | null = null;
  let destSnap: SnapResult | null = null;
  try {
    const prepared = await buildGraphWithSnaps(params.start, params.destination, callbacks);
    startSnap = prepared.startSnap;
    destSnap = prepared.destSnap;
    working = buildWorkingGraphWithSnaps(prepared.graph, prepared.startSnap, prepared.destSnap);
  } catch (e: any) {
    callbacks.onError(e?.message ?? "Unable to snap locations to roads.");
    return;
  }

  const { graph, startId, destId } = working;

  const generator = algorithm.run(graph, startId, destId);
  visualizer.setSpeed(params.speed);
  let stepCounter = 0;
  let forwardSteps = 0;
  let backwardSteps = 0;

  if (startSnap && destSnap) {
    const debug: SnapDebugInfo = {
      inputStart: params.start,
      inputDestination: params.destination,
      snappedStart: { lat: startSnap.snappedPoint[0], lng: startSnap.snappedPoint[1] },
      snappedDestination: { lat: destSnap.snappedPoint[0], lng: destSnap.snappedPoint[1] },
      startDistance: startSnap.distanceMeters,
    destinationDistance: destSnap.distanceMeters,
    startNodeId: startId,
    destinationNodeId: destId
  };
    console.info(
      `[snap-debug] start ${debug.inputStart.lat},${debug.inputStart.lng} -> ${debug.snappedStart.lat},${debug.snappedStart.lng} (${debug.startDistance.toFixed(1)}m) node=${debug.startNodeId}`
    );
    console.info(
      `[snap-debug] dest ${debug.inputDestination.lat},${debug.inputDestination.lng} -> ${debug.snappedDestination.lat},${debug.snappedDestination.lng} (${debug.destinationDistance.toFixed(1)}m) node=${debug.destinationNodeId}`
    );
    if (
      startSnap.distanceMeters > SNAP_WARN_METERS ||
      destSnap.distanceMeters > SNAP_WARN_METERS
    ) {
      callbacks.onWarning?.(
        "Start point too far from nearest road, expanding search area… using best effort."
      );
    }
    callbacks.onDebug?.(debug);
  }

  visualizer.run(
    generator,
    (step) => {
      stepCounter += 1;
      if (step.currentId) forwardSteps += 1;
      if (step.backCurrentId) backwardSteps += 1;
      callbacks.onStep(
        snapshotFromStep(
          step,
          graph.nodes,
          graph.getEdge,
          startId,
          destId,
          { forward: forwardSteps, backward: backwardSteps }
        )
      );
    },
    (result) => {
      if (!result.done) return;
      const vizResult = buildVisualizationResult(result.value, graph.nodes);
      if (!vizResult.pathNodes.length || !Number.isFinite(vizResult.cost)) {
        callbacks.onError("No route could be found with the current road network.");
        return;
      }
      const finalPathCoords = pathToCoordinates(vizResult.pathIds, graph.nodes, graph.getEdge);
      const distanceMeters = lengthOfPath(vizResult.pathIds, graph.nodes, graph.getEdge);
      const durationSeconds = computeDurationSeconds(vizResult.pathIds, graph.nodes, graph.getEdge);
      const durationMinutes = durationSeconds / 60;
      if (!Number.isFinite(distanceMeters) || distanceMeters <= 0 || durationSeconds <= 0) {
        callbacks.onError("Unable to calculate distance or ETA for this route.");
        return;
      }
      callbacks.onComplete({
        path: finalPathCoords,
        distanceMeters,
        durationMinutes,
        durationSeconds,
        steps: stepCounter,
        meetingNodeId: vizResult.meetingId
      });
    }
  );
}

export function stopPathfinding() {
  visualizer.stop();
}
