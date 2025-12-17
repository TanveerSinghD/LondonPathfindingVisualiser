import { AlgorithmKey } from "../algorithms/types";
import { SpeedSetting, VisualizationSnapshot } from "../visualization/types";
import { Coordinates } from "../services/locationService";
import { create } from "zustand";
import { SnapDebugInfo } from "../core/pathfindingEngine";

export type AppStatus = "idle" | "locating" | "calculating" | "completed" | "error";

export interface PathSummary {
  distanceMeters: number;
  durationMinutes: number;
  path: Coordinates[];
  steps?: number;
  meetingNodeId?: string;
  algorithm?: AlgorithmKey;
  isOptimal?: boolean;
}

interface AppState {
  status: AppStatus;
  algorithm: AlgorithmKey;
  speed: SpeedSetting;
  start?: Coordinates;
  startLabel?: string;
  startAddress?: string;
  destination?: Coordinates;
  destinationLabel?: string;
  destinationAddress?: string;
  visualization: VisualizationSnapshot;
  summary?: PathSummary;
  errorMessage?: string;
  warningMessage?: string;
  snapDebug?: SnapDebugInfo;
  navigationMode: boolean;
  routeModalOpen: boolean;
  stepCounts?: { forward: number; backward: number };
  setStatus: (status: AppStatus) => void;
  setAlgorithm: (key: AlgorithmKey) => void;
  setSpeed: (speed: SpeedSetting) => void;
  setStart: (coords: Coordinates | undefined, label?: string, address?: string) => void;
  setDestination: (coords: Coordinates | undefined, label?: string, address?: string) => void;
  setStartAddress: (address: string) => void;
  setDestinationAddress: (address: string) => void;
  setVisualization: (snapshot: VisualizationSnapshot) => void;
  setSummary: (summary?: PathSummary) => void;
  setError: (message: string) => void;
  setWarning: (message?: string) => void;
  setSnapDebug: (debug?: SnapDebugInfo) => void;
  setNavigationMode: (enabled: boolean) => void;
  setRouteModalOpen: (open: boolean) => void;
  setStepCounts: (counts?: { forward: number; backward: number }) => void;
  reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  status: "idle",
  algorithm: "dijkstra",
  speed: "normal",
  navigationMode: false,
  routeModalOpen: false,
  visualization: {
    visitedNodes: [],
    frontierNodes: [],
    visitedPaths: [],
    frontierPaths: [],
    path: []
  },
  setStatus: (status) => set({ status, errorMessage: undefined }),
  setAlgorithm: (algorithm) => set({ algorithm }),
  setSpeed: (speed) => set({ speed }),
  setStart: (start, label, address) => set({ start, startLabel: label, startAddress: address }),
  setDestination: (destination, label, address) =>
    set({ destination, destinationLabel: label, destinationAddress: address }),
  setStartAddress: (startAddress) => set({ startAddress }),
  setDestinationAddress: (destinationAddress) => set({ destinationAddress }),
  setVisualization: (visualization) => set({ visualization }),
  setSummary: (summary) => set({ summary }),
  setError: (message) =>
    set({
      errorMessage: message,
      status: "error",
      summary: undefined,
      warningMessage: undefined,
      navigationMode: false,
      routeModalOpen: false
    }),
  setWarning: (message) => set({ warningMessage: message }),
  setSnapDebug: (snapDebug) => set({ snapDebug }),
  setNavigationMode: (enabled) => set({ navigationMode: enabled }),
  setRouteModalOpen: (open) => set({ routeModalOpen: open }),
  setStepCounts: (counts) => set({ stepCounts: counts }),
  reset: () =>
    set({
      status: "idle",
      visualization: {
        visitedNodes: [],
        frontierNodes: [],
        visitedPaths: [],
        frontierPaths: [],
        path: []
      },
      summary: undefined,
      errorMessage: undefined,
      warningMessage: undefined,
      snapDebug: undefined,
      navigationMode: false,
      routeModalOpen: false,
      stepCounts: undefined,
      start: undefined,
      destination: undefined,
      startAddress: undefined,
      destinationAddress: undefined,
      startLabel: undefined,
      destinationLabel: undefined
    })
}));
