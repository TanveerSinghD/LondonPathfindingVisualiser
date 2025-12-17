import { assertValidCoordinate } from "../utils/geo";

export interface OSMNode {
  id: string;
  lat: number;
  lon: number;
}

export interface OSMWay {
  id: string;
  nodes: string[];
  tags: Record<string, string>;
  geometry?: { lat: number; lon: number }[];
}

export interface OSMNetwork {
  nodes: Map<string, OSMNode>;
  ways: OSMWay[];
}

function isAllowedHighway(tags: Record<string, string> = {}): boolean {
  if (!tags.highway) return false;
  if (tags.highway === "construction" || tags.highway === "proposed") return false;
  return Boolean(
    tags.highway.match(
      /(motorway|trunk|primary|secondary|tertiary|unclassified|residential|living_street|service|pedestrian|track|path|cycleway|footway|bridleway|steps)/
    )
  );
}

export function parseOverpassRoads(payload: any): OSMNetwork {
  if (!payload || !Array.isArray(payload.elements)) {
    throw new Error("Invalid Overpass payload");
  }

  const nodes = new Map<string, OSMNode>();
  const ways: OSMWay[] = [];

  payload.elements.forEach((el: any) => {
    if (el.type === "node") {
      if (Math.abs(el.lat) > 90 || Math.abs(el.lon) > 180) return;
      assertValidCoordinate({ lat: el.lat, lng: el.lon });
      nodes.set(String(el.id), { id: String(el.id), lat: el.lat, lon: el.lon });
    }
  });

  payload.elements.forEach((el: any) => {
    if (el.type !== "way") return;
    if (!isAllowedHighway(el.tags)) return;
    const nodeRefs = (el.nodes ?? []).map((n: number) => String(n));
    if (nodeRefs.length < 2) return;
    ways.push({
      id: String(el.id),
      nodes: nodeRefs,
      tags: el.tags ?? {},
      geometry: el.geometry
    });
  });

  console.info(`[osm] parsed ${nodes.size} nodes, ${ways.length} ways`);

  return { nodes, ways };
}
