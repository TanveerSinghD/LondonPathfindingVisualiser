# London Pathfinding Visualiser

An Apple/Google Maps–style London-only routing playground. It builds a true OSM road graph at runtime, snaps start/end to the nearest road, animates bidirectional search along real geometries, and offers a “typical routing” mode that mirrors mainstream navigation apps.

## Quick start
```bash
npm install
npm run dev
```
Requires network access for geocoding, routing APIs, Overpass, and map tiles.

## What it does
- OSM-backed road graph (ways/nodes) per request with snap-to-edge for start/end.
- Bidirectional animations: Dijkstra, A*, DFS, Greedy Best-First (educational), plus a “typical routing (typical search)” option with no animation.
- On-road visited/frontier edges, meeting-point marker, debug snapped markers.
- Distance shown in miles; ETA based on road speeds (highway tag + maxspeed) for graph modes, or API-provided duration for typical routing.
- Navigation mode: trims overlays to the final route with ETA/distance.
- Apple/Google-style autocomplete for “From”/“To”: full-phrase, London-bounded suggestions (4 max), ranked by intent/prefix/importance; selecting fills inputs and drops markers.

## APIs and services used
- **Geocoding**: Nominatim (OSM) for forward/reverse lookup, London-bounded.
- **Road data**: Overpass API to fetch highways around the start/end bounding box.
- **Typical routing (typical search)**: OSRM demo server (`/route/v1/driving/{lon,lat};{lon,lat}?geometries=geojson`). Returns a ready-to-draw GeoJSON polyline, distance (m), and duration (s).
- **Map tiles**: Carto light tiles via Leaflet.

## Typical routing vs. animated search
- **Typical routing (OSRM)**: one-shot API call, draws the returned GeoJSON route, and surfaces the API distance/duration—behaves like Apple/Google Maps with no step animation.
- **Animated graph search**: builds a local OSM road graph, runs bidirectional algorithms edge-by-edge, and computes distance/ETA from on-road geometry and speed profiles.

## Running modes
- **Optimal**: Bidirectional Dijkstra, Bidirectional A* (fastest route modal).
- **Educational (not guaranteed fastest)**: Bidirectional DFS, Bidirectional Greedy.
- **Typical**: OSRM “typical routing (typical search)” (no animation).

## Layout
- Two-column, full-height flex: fixed-width left panel (scrollable), map fills the rest.
- Legend and overlays live inside the map container (bottom-left floating card).
- Navigation mode can collapse the panel; map stays full height.

## Key folders
- `src/osm/` – Overpass client + parser.
- `src/graph/` – graph types, OSM graph builder, snapping/working graph.
- `src/algorithms/` – algorithms (uni- and bidirectional) + utilities.
- `src/core/` – orchestration, pathfinding engine.
- `src/map/` – Leaflet map manager, layers, overlays.
- `src/ui/` – control panel, status, modal, navigation overlay, legend.
- `src/services/` – geocoding, location, typical routing (OSRM).

## Notes and limits
- London/Greater London only; coordinates are validated/clamped.
- Uses public endpoints (Nominatim, Overpass, OSRM demo) – respect rate limits.
- Keep internal units in meters; all user-facing distances are miles.
