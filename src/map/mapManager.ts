import L, { LatLngBoundsExpression, Map as LeafletMap, LayerGroup, Polyline } from "leaflet";
import { LONDON_BOUNDS, LONDON_CENTER } from "../constants/bounds";
import { Coordinates } from "../services/locationService";
import { VisualizationSnapshot } from "../visualization/types";
const bounds: LatLngBoundsExpression = [
  [LONDON_BOUNDS.minLat, LONDON_BOUNDS.minLng],
  [LONDON_BOUNDS.maxLat, LONDON_BOUNDS.maxLng]
];

/**
 * Leaflet-based map manager. Provides imperative helpers for React to drive overlays.
 */
export class MapManager {
  private map?: LeafletMap;
  private startMarker?: L.CircleMarker;
  private destinationMarker?: L.CircleMarker;
  private snappedStartMarker?: L.CircleMarker;
  private snappedDestinationMarker?: L.CircleMarker;
  private navigationMode = false;
  private visitedLayer?: LayerGroup;
  private frontierLayer?: LayerGroup;
  private backVisitedLayer?: LayerGroup;
  private backFrontierLayer?: LayerGroup;
  private visitedLineLayer?: LayerGroup;
  private frontierLineLayer?: LayerGroup;
  private backVisitedLineLayer?: LayerGroup;
  private backFrontierLineLayer?: LayerGroup;
  private pathLine?: Polyline;
  private meetingMarker?: L.CircleMarker;
  private visitedPathsAcc: Coordinates[][] = [];
  private frontierPathsAcc: Coordinates[][] = [];
  private backVisitedPathsAcc: Coordinates[][] = [];
  private backFrontierPathsAcc: Coordinates[][] = [];

  constructor(private containerId: string) {}

  initialiseMap() {
    if (this.map) return this.map;

    this.map = L.map(this.containerId, {
      zoomControl: true,
      center: LONDON_CENTER,
      zoom: 12,
      maxBounds: bounds,
      maxBoundsViscosity: 1.0,
      worldCopyJump: false,
      zoomSnap: 0.1,
      zoomDelta: 0.5,
      preferCanvas: true
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 18,
      minZoom: 10
    }).addTo(this.map);

    this.visitedLayer = L.layerGroup().addTo(this.map);
    this.frontierLayer = L.layerGroup().addTo(this.map);
    this.backVisitedLayer = L.layerGroup().addTo(this.map);
    this.backFrontierLayer = L.layerGroup().addTo(this.map);
    this.visitedLineLayer = L.layerGroup().addTo(this.map);
    this.frontierLineLayer = L.layerGroup().addTo(this.map);
    this.backVisitedLineLayer = L.layerGroup().addTo(this.map);
    this.backFrontierLineLayer = L.layerGroup().addTo(this.map);
    this.pathLine = L.polyline([], {
      color: "#22c55e",
      weight: 5,
      opacity: 0.9,
      lineCap: "round",
      lineJoin: "round"
    }).addTo(this.map);

    return this.map;
  }

  setStartMarker(coords: Coordinates | null) {
    if (!this.map) return;
    if (coords) {
      if (!this.startMarker) {
        this.startMarker = L.circleMarker([coords.lat, coords.lng], {
          radius: 7,
          color: "#1d4ed8",
          weight: 1.5,
          fillColor: "#93c5fd",
          fillOpacity: 0.45,
          opacity: 0.7
        }).addTo(this.map);
      } else {
        this.startMarker.setLatLng([coords.lat, coords.lng]);
      }
    } else {
      this.startMarker?.remove();
      this.startMarker = undefined;
    }
  }

  setEndMarker(coords: Coordinates | null) {
    if (!this.map) return;
    if (coords) {
      if (!this.destinationMarker) {
        this.destinationMarker = L.circleMarker([coords.lat, coords.lng], {
          radius: 7,
          color: "#ef4444",
          weight: 1.5,
          fillColor: "#fecdd3",
          fillOpacity: 0.45,
          opacity: 0.7
        }).addTo(this.map);
      } else {
        this.destinationMarker.setLatLng([coords.lat, coords.lng]);
      }
    } else {
      this.destinationMarker?.remove();
      this.destinationMarker = undefined;
    }
  }

  setSnappedStartMarker(coords: Coordinates | null) {
    if (!this.map) return;
    if (coords) {
      if (!this.snappedStartMarker) {
        this.snappedStartMarker = L.circleMarker([coords.lat, coords.lng], {
          radius: 8,
          color: "#1d4ed8",
          weight: 2.5,
          fillColor: "#1d4ed8",
          fillOpacity: 0.9
        }).addTo(this.map);
      } else {
        this.snappedStartMarker.setLatLng([coords.lat, coords.lng]);
      }
    } else {
      this.snappedStartMarker?.remove();
      this.snappedStartMarker = undefined;
    }
  }

  setSnappedEndMarker(coords: Coordinates | null) {
    if (!this.map) return;
    if (coords) {
      if (!this.snappedDestinationMarker) {
        this.snappedDestinationMarker = L.circleMarker([coords.lat, coords.lng], {
          radius: 8,
          color: "#dc2626",
          weight: 2.5,
          fillColor: "#dc2626",
          fillOpacity: 0.9
        }).addTo(this.map);
      } else {
        this.snappedDestinationMarker.setLatLng([coords.lat, coords.lng]);
      }
    } else {
      this.snappedDestinationMarker?.remove();
      this.snappedDestinationMarker = undefined;
    }
  }

  drawVisitedNodes(nodes: Coordinates[]) {
    if (!this.visitedLayer) return;
    this.visitedLayer.clearLayers();
    nodes.forEach((coord) => {
      L.circleMarker([coord.lat, coord.lng], {
        radius: 4,
        color: "#0ea5e9",
        weight: 1,
        fillColor: "#0ea5e9",
        fillOpacity: 0.7
      }).addTo(this.visitedLayer!);
    });
  }

  drawBackVisitedNodes(nodes: Coordinates[]) {
    if (!this.backVisitedLayer) return;
    this.backVisitedLayer.clearLayers();
    nodes.forEach((coord) => {
      L.circleMarker([coord.lat, coord.lng], {
        radius: 4,
        color: "#f97316",
        weight: 1,
        fillColor: "#fb923c",
        fillOpacity: 0.75
      }).addTo(this.backVisitedLayer!);
    });
  }

  drawFrontier(nodes: Coordinates[]) {
    if (!this.frontierLayer) return;
    this.frontierLayer.clearLayers();
    nodes.forEach((coord) => {
      L.circleMarker([coord.lat, coord.lng], {
        radius: 5,
        color: "#60a5fa",
        weight: 1.2,
        fillColor: "#bfdbfe",
        fillOpacity: 0.8
      }).addTo(this.frontierLayer!);
    });
  }

  drawBackFrontier(nodes: Coordinates[]) {
    if (!this.backFrontierLayer) return;
    this.backFrontierLayer.clearLayers();
    nodes.forEach((coord) => {
      L.circleMarker([coord.lat, coord.lng], {
        radius: 5,
        color: "#fb923c",
        weight: 1.2,
        fillColor: "#fed7aa",
        fillOpacity: 0.8
      }).addTo(this.backFrontierLayer!);
    });
  }

  drawFinalPath(path: Coordinates[]) {
    if (!this.pathLine) return;
    this.pathLine.setLatLngs(path.map((p) => [p.lat, p.lng]));
  }

  setMeetingPoint(point: Coordinates | null) {
    if (!this.map) return;
    if (this.navigationMode) {
      this.meetingMarker?.remove();
      this.meetingMarker = undefined;
      return;
    }
    if (point) {
      if (!this.meetingMarker) {
        this.meetingMarker = L.circleMarker([point.lat, point.lng], {
          radius: 9,
          color: "#10b981",
          weight: 3,
          fillColor: "#34d399",
          fillOpacity: 0.9,
          opacity: 0.9
        }).addTo(this.map);
      } else {
        this.meetingMarker.setLatLng([point.lat, point.lng]);
      }
    } else {
      this.meetingMarker?.remove();
      this.meetingMarker = undefined;
    }
  }

  drawVisitedPaths(paths: Coordinates[][]) {
    if (!this.visitedLineLayer) return;
    if (this.navigationMode) return;
    paths.forEach((coords) => {
      const key = JSON.stringify(coords);
      const exists = this.visitedPathsAcc.some((p) => JSON.stringify(p) === key);
      if (!exists) this.visitedPathsAcc.push(coords);
    });
    this.visitedLineLayer.clearLayers();
    this.visitedPathsAcc.forEach((coords) => {
      L.polyline(coords.map((c) => [c.lat, c.lng]), {
        color: "#0ea5e9",
        weight: 3,
        opacity: 0.55
      }).addTo(this.visitedLineLayer!);
    });
  }

  drawBackVisitedPaths(paths: Coordinates[][]) {
    if (!this.backVisitedLineLayer) return;
    if (this.navigationMode) return;
    paths.forEach((coords) => {
      const key = JSON.stringify(coords);
      const exists = this.backVisitedPathsAcc.some((p) => JSON.stringify(p) === key);
      if (!exists) this.backVisitedPathsAcc.push(coords);
    });
    this.backVisitedLineLayer.clearLayers();
    this.backVisitedPathsAcc.forEach((coords) => {
      L.polyline(coords.map((c) => [c.lat, c.lng]), {
        color: "#f97316",
        weight: 3,
        opacity: 0.55
      }).addTo(this.backVisitedLineLayer!);
    });
  }

  drawFrontierPaths(paths: Coordinates[][]) {
    if (!this.frontierLineLayer) return;
    if (this.navigationMode) return;
    paths.forEach((coords) => {
      const key = JSON.stringify(coords);
      const exists = this.frontierPathsAcc.some((p) => JSON.stringify(p) === key);
      if (!exists) this.frontierPathsAcc.push(coords);
    });
    this.frontierLineLayer.clearLayers();
    this.frontierPathsAcc.forEach((coords) => {
      L.polyline(coords.map((c) => [c.lat, c.lng]), {
        color: "#93c5fd",
        weight: 3,
        opacity: 0.8,
        dashArray: "6 4"
      }).addTo(this.frontierLineLayer!);
    });
  }

  drawBackFrontierPaths(paths: Coordinates[][]) {
    if (!this.backFrontierLineLayer) return;
    if (this.navigationMode) return;
    paths.forEach((coords) => {
      const key = JSON.stringify(coords);
      const exists = this.backFrontierPathsAcc.some((p) => JSON.stringify(p) === key);
      if (!exists) this.backFrontierPathsAcc.push(coords);
    });
    this.backFrontierLineLayer.clearLayers();
    this.backFrontierPathsAcc.forEach((coords) => {
      L.polyline(coords.map((c) => [c.lat, c.lng]), {
        color: "#fb923c",
        weight: 3,
        opacity: 0.8,
        dashArray: "6 4"
      }).addTo(this.backFrontierLineLayer!);
    });
  }

  updateVisualization(snapshot: VisualizationSnapshot) {
    if (this.navigationMode) {
      this.drawFinalPath(snapshot.path);
      return;
    }
    if (
      snapshot.visitedNodes.length === 0 &&
      snapshot.frontierNodes.length === 0 &&
      snapshot.visitedPaths.length === 0 &&
      snapshot.frontierPaths.length === 0 &&
      (snapshot.backVisitedNodes?.length ?? 0) === 0 &&
      (snapshot.backFrontierNodes?.length ?? 0) === 0 &&
      (snapshot.backVisitedPaths?.length ?? 0) === 0 &&
      (snapshot.backFrontierPaths?.length ?? 0) === 0 &&
      snapshot.path.length === 0
    ) {
      this.visitedPathsAcc = [];
      this.frontierPathsAcc = [];
      this.backVisitedPathsAcc = [];
      this.backFrontierPathsAcc = [];
      this.visitedLineLayer?.clearLayers();
      this.frontierLineLayer?.clearLayers();
      this.backVisitedLineLayer?.clearLayers();
      this.backFrontierLineLayer?.clearLayers();
    }
    this.drawVisitedNodes(snapshot.visitedNodes);
    this.drawFrontier(snapshot.frontierNodes);
    this.drawBackVisitedNodes(snapshot.backVisitedNodes ?? []);
    this.drawBackFrontier(snapshot.backFrontierNodes ?? []);
    this.drawVisitedPaths(snapshot.visitedPaths);
    this.drawFrontierPaths(snapshot.frontierPaths);
    this.drawBackVisitedPaths(snapshot.backVisitedPaths ?? []);
    this.drawBackFrontierPaths(snapshot.backFrontierPaths ?? []);
    this.drawFinalPath(snapshot.path);
    this.setMeetingPoint(snapshot.meetingPoint ?? null);
  }

  flyTo(coords: Coordinates) {
    if (!this.map) return;
    this.map.flyTo([coords.lat, coords.lng], Math.max(this.map.getZoom(), 12.5), {
      duration: 0.6
    });
  }

  resetMap() {
    this.visitedPathsAcc = [];
    this.frontierPathsAcc = [];
    this.backVisitedPathsAcc = [];
    this.backFrontierPathsAcc = [];
    this.drawVisitedNodes([]);
    this.drawFrontier([]);
    this.drawBackVisitedNodes([]);
    this.drawBackFrontier([]);
    this.drawVisitedPaths([]);
    this.drawFrontierPaths([]);
    this.drawBackVisitedPaths([]);
    this.drawBackFrontierPaths([]);
    this.drawFinalPath([]);
    this.setStartMarker(null);
    this.setEndMarker(null);
    this.setSnappedStartMarker(null);
    this.setSnappedEndMarker(null);
    this.setMeetingPoint(null);
  }

  setNavigationMode(enabled: boolean) {
    this.navigationMode = enabled;
    if (enabled) {
      this.visitedLayer?.clearLayers();
      this.frontierLayer?.clearLayers();
      this.backVisitedLayer?.clearLayers();
      this.backFrontierLayer?.clearLayers();
      this.visitedLineLayer?.clearLayers();
      this.frontierLineLayer?.clearLayers();
      this.backVisitedLineLayer?.clearLayers();
      this.backFrontierLineLayer?.clearLayers();
      this.visitedPathsAcc = [];
      this.frontierPathsAcc = [];
      this.backVisitedPathsAcc = [];
      this.backFrontierPathsAcc = [];
      this.setMeetingPoint(null);
    }
  }

  destroy() {
    this.map?.remove();
    this.map = undefined;
    this.visitedLayer = undefined;
    this.frontierLayer = undefined;
    this.backVisitedLayer = undefined;
    this.backFrontierLayer = undefined;
    this.visitedLineLayer = undefined;
    this.frontierLineLayer = undefined;
    this.backVisitedLineLayer = undefined;
    this.backFrontierLineLayer = undefined;
    this.pathLine = undefined;
    this.visitedPathsAcc = [];
    this.frontierPathsAcc = [];
    this.backVisitedPathsAcc = [];
    this.backFrontierPathsAcc = [];
    this.snappedStartMarker = undefined;
    this.snappedDestinationMarker = undefined;
    this.meetingMarker = undefined;
  }
}
