import { buildGraphFromOSM } from "../graph/buildGraphFromOSM";
import { RoadGraph } from "../graph/graphTypes";
import { buildBoundingBoxAroundPoints, fetchRoadData } from "../osm/overpassClient";
import { parseOverpassRoads } from "../osm/osmParser";
import { Coordinates } from "../services/locationService";

export async function fetchRoadGraphForRoute(
  start: Coordinates,
  dest: Coordinates,
  paddingMeters?: number
): Promise<{ graph: RoadGraph }> {
  const bbox = buildBoundingBoxAroundPoints(start, dest, paddingMeters);
  const payload = await fetchRoadData(bbox);
  const osm = parseOverpassRoads(payload);
  const graph = buildGraphFromOSM(osm);

  if (!graph.edges.length) {
    throw new Error("No roads found in the selected area.");
  }

  return { graph };
}
