import { VisualizationSnapshot } from "../visualization/types";
import { updateVisualization } from "./mapService";

/**
 * Thin helper to keep map drawing isolated from UI/algorithm code.
 */
export function drawRoute(snapshot: VisualizationSnapshot) {
  updateVisualization(snapshot);
}
