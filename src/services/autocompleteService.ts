import { LONDON_BOUNDS, LONDON_CENTER } from "../constants/bounds";
import { assertValidCoordinate, haversineDistance } from "../utils/geo";
import { Coordinates } from "./locationService";

export interface AutocompleteSuggestion extends Coordinates {
  label: string;
  primary: string;
  secondary?: string;
  importance?: number;
}

const cache = new Map<string, AutocompleteSuggestion[]>();

function inLondon(lat: number, lng: number) {
  return (
    lat >= LONDON_BOUNDS.minLat &&
    lat <= LONDON_BOUNDS.maxLat &&
    lng >= LONDON_BOUNDS.minLng &&
    lng <= LONDON_BOUNDS.maxLng
  );
}

function parseDisplayName(display: string): { primary: string; secondary?: string } {
  const parts = display
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return { primary: display };
  const primary = parts[0];
  const secondary = parts.slice(1, 3).join(", ");
  return { primary, secondary };
}

function tokenize(query: string) {
  return query
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);
}

function scoreSuggestion(fullQuery: string, s: AutocompleteSuggestion) {
  const tokens = tokenize(fullQuery);
  const primary = s.primary.toLowerCase();
  const label = s.label.toLowerCase();

  let matchedTokens = 0;
  let orderedMatch = true;
  let lastIndex = -1;

  tokens.forEach((t) => {
    const idx = label.indexOf(t);
    if (idx >= 0) {
      matchedTokens += 1;
      if (idx < lastIndex) orderedMatch = false;
      lastIndex = idx;
    }
  });

  const fraction = tokens.length ? matchedTokens / tokens.length : 0;
  if (fraction < 0.5) return -Infinity; // reject weak matches

  const fullPhraseMatch = label.includes(fullQuery.toLowerCase()) ? 2 : 0;
  const prefixPrimary = primary.startsWith(tokens[0] ?? "") ? 1.5 : 0;
  const orderedBonus = orderedMatch ? 0.5 : 0;
  const importance = s.importance ?? 0;
  const distance = haversineDistance([s.lat, s.lng], [LONDON_CENTER[0], LONDON_CENTER[1]]);
  const distanceScore = -distance / 15000;

  return fullPhraseMatch + prefixPrimary + orderedBonus + fraction + importance * 0.3 + distanceScore;
}

export async function fetchAutocomplete(query: string): Promise<AutocompleteSuggestion[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const cached = cache.get(trimmed);
  if (cached) return cached;

  const bounded = `${LONDON_BOUNDS.minLng},${LONDON_BOUNDS.minLat},${LONDON_BOUNDS.maxLng},${LONDON_BOUNDS.maxLat}`;
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
    trimmed
  )}&format=json&limit=8&countrycodes=gb&bounded=1&viewbox=${bounded}&addressdetails=1`;

  const controller = new AbortController();
  const resp = await fetch(url, {
    headers: {
      "Accept-Language": "en",
      "User-Agent": "London-Pathfinding-Visualizer"
    },
    signal: controller.signal
  });

  if (!resp.ok) {
    throw new Error("Autocomplete failed");
  }

  const data = (await resp.json()) as any[];

  const parsed: AutocompleteSuggestion[] = data
    .map((item) => {
      const lat = Number(item.lat);
      const lng = Number(item.lon);
      if (!inLondon(lat, lng)) return null;
      assertValidCoordinate({ lat, lng });
      const { primary, secondary } = parseDisplayName(item.display_name ?? "");
      return {
        lat,
        lng,
        label: item.display_name,
        primary,
        secondary,
        importance: item.importance ? Number(item.importance) : undefined
      };
    })
    .filter(Boolean) as AutocompleteSuggestion[];

  const scored = parsed
    .map((s) => ({ s, score: scoreSuggestion(trimmed, s) }))
    .filter((x) => x.score > -Infinity)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((x) => x.s);

  cache.set(trimmed, scored);
  return scored;
}
