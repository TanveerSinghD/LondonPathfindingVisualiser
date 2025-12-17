import { useEffect } from "react";
import "leaflet/dist/leaflet.css";
import { useAppStore } from "../state/useAppStore";
import {
  destroyMap,
  flyTo,
  initialiseMap,
  setEndMarker,
  setSnappedEndMarker,
  setSnappedStartMarker,
  setStartMarker,
  setNavigationMode as setMapNavigationMode,
  updateVisualization
} from "./mapService";

export function MapView() {
  const containerId = "map-root";
  const start = useAppStore((s) => s.start);
  const destination = useAppStore((s) => s.destination);
  const visualization = useAppStore((s) => s.visualization);
  const snapDebug = useAppStore((s) => s.snapDebug);
  const navigationMode = useAppStore((s) => s.navigationMode);

  useEffect(() => {
    initialiseMap(containerId);
    return () => destroyMap();
  }, []);

  useEffect(() => {
    setStartMarker(start ?? null);
    if (start) flyTo(start);
  }, [start]);

  useEffect(() => {
    setEndMarker(destination ?? null);
    if (destination) flyTo(destination);
  }, [destination]);

  useEffect(() => {
    updateVisualization(visualization);
  }, [visualization]);

  useEffect(() => {
    setSnappedStartMarker(snapDebug ? snapDebug.snappedStart : null);
    setSnappedEndMarker(snapDebug ? snapDebug.snappedDestination : null);
  }, [snapDebug]);

  useEffect(() => {
    setMapNavigationMode(navigationMode);
  }, [navigationMode]);

  return <div id={containerId} style={{ width: "100%", height: "100%" }} />;
}
