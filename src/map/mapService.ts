import { MapManager } from "./mapManager";
import { Coordinates } from "../services/locationService";
import { VisualizationSnapshot } from "../visualization/types";

let manager: MapManager | null = null;

export function initialiseMap(containerId: string) {
  if (!manager) {
    manager = new MapManager(containerId);
    manager.initialiseMap();
  }
  return manager;
}

export function destroyMap() {
  manager?.destroy();
  manager = null;
}

export function setStartMarker(coords: Coordinates | null) {
  manager?.setStartMarker(coords);
}

export function setEndMarker(coords: Coordinates | null) {
  manager?.setEndMarker(coords);
}

export function setSnappedStartMarker(coords: Coordinates | null) {
  manager?.setSnappedStartMarker(coords);
}

export function setSnappedEndMarker(coords: Coordinates | null) {
  manager?.setSnappedEndMarker(coords);
}

export function flyTo(coords: Coordinates) {
  manager?.flyTo(coords);
}

export function updateVisualization(snapshot: VisualizationSnapshot) {
  manager?.updateVisualization(snapshot);
}

export function resetMap() {
  manager?.resetMap();
}

export function setNavigationMode(enabled: boolean) {
  manager?.setNavigationMode(enabled);
}
