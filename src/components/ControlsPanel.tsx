import { FormEvent, useState } from "react";
import { algorithmList } from "../algorithms";
import { AlgorithmKey } from "../algorithms/types";
import { runPathfinding, stopPathfinding } from "../core/pathfindingEngine";
import { geocodeAddress } from "../services/geocodingService";
import { Coordinates, getBrowserLocation } from "../services/locationService";
import { useAppStore } from "../state/useAppStore";
import { SpeedSetting } from "../visualization/types";

export function ControlsPanel() {
  const {
    algorithm,
    setAlgorithm,
    speed,
    setSpeed,
    status,
    setStatus,
    setVisualization,
    setStart,
    setDestination,
    start,
    destination,
    setSummary,
    reset,
    setError
  } = useAppStore();

  const [destinationQuery, setDestinationQuery] = useState("");
  const [manualStart, setManualStart] = useState<Coordinates>({ lat: 51.509865, lng: -0.118092 });
  const [isSearching, setIsSearching] = useState(false);

  const handleLocate = async () => {
    setStatus("locating");
    try {
      const coords = await getBrowserLocation();
      setStart(coords, "My location");
      setStatus("idle");
    } catch (err) {
      setError("Unable to read your location. Try setting it manually.");
    }
  };

  const handleDestinationSearch = async (e: FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    try {
      const results = await geocodeAddress(destinationQuery);
      if (!results.length) {
        setError("Destination not found in London.");
        return;
      }
      const best = results[0];
      setDestination({ lat: best.lat, lng: best.lng }, best.label);
    } catch (err) {
      setError("Failed to geocode destination.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleManualStart = () => {
    setStart(manualStart, "Manual start");
  };

  const run = () => {
    const state = useAppStore.getState();
    if (!state.start || !state.destination) {
      setError("Select a start point and destination in London.");
      return;
    }
    setStatus("calculating");
    setSummary(undefined);
    setVisualization({
      visitedNodes: [],
      frontierNodes: [],
      visitedPaths: [],
      frontierPaths: [],
      path: []
    });
    runPathfinding(
      {
        start: state.start,
        destination: state.destination,
        algorithm: state.algorithm,
        speed: state.speed
      },
      {
        onStep: (snapshot) => setVisualization(snapshot),
        onComplete: ({ path, distanceMeters, durationMinutes }) => {
          const pathCoords = path;
          const latest = useAppStore.getState().visualization;
          setVisualization({ ...latest, path: pathCoords });
          setSummary({
            path: pathCoords,
            distanceMeters,
            durationMinutes
          });
          setStatus("completed");
        },
        onError: (message) => {
          setError(message);
        }
      }
    );
  };

  const handleReset = () => {
    stopPathfinding();
    reset();
  };

  return (
    <div className="panel">
      <div className="panel__section">
        <div className="panel__row">
          <div>
            <div className="panel__label">Start</div>
            <div className="panel__tiny">
              {start ? `Lat ${start.lat.toFixed(4)}, Lng ${start.lng.toFixed(4)}` : "Not set"}
            </div>
          </div>
          <div className="panel__actions">
            <button onClick={handleLocate} disabled={status === "locating"}>
              {status === "locating" ? "Locating…" : "Use my location"}
            </button>
          </div>
        </div>
        <div className="panel__row panel__manual">
          <label className="panel__label">Manual start override</label>
          <div className="panel__inputs">
            <input
              type="number"
              step="0.0001"
              value={manualStart.lat}
              onChange={(e) => setManualStart({ ...manualStart, lat: Number(e.target.value) })}
              placeholder="Latitude"
            />
            <input
              type="number"
              step="0.0001"
              value={manualStart.lng}
              onChange={(e) => setManualStart({ ...manualStart, lng: Number(e.target.value) })}
              placeholder="Longitude"
            />
            <button type="button" onClick={handleManualStart}>
              Set start
            </button>
          </div>
        </div>
      </div>

      <div className="panel__section">
        <form className="panel__row" onSubmit={handleDestinationSearch}>
          <div>
            <div className="panel__label">Destination (London)</div>
            <input
              type="text"
              value={destinationQuery}
              onChange={(e) => setDestinationQuery(e.target.value)}
              placeholder="e.g. London Bridge, W1A 1AA"
            />
            <div className="panel__tiny">
              {destination
                ? `${destination.lat.toFixed(4)}, ${destination.lng.toFixed(4)}`
                : "Not set"}
            </div>
          </div>
          <div className="panel__actions">
            <button type="submit" disabled={isSearching}>
              {isSearching ? "Searching…" : "Search"}
            </button>
          </div>
        </form>
      </div>

      <div className="panel__section grid">
        <div>
          <label className="panel__label" htmlFor="algorithm">
            Algorithm
          </label>
          <select
            id="algorithm"
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value as AlgorithmKey)}
          >
            {algorithmList.map((algo) => (
              <option value={algo.key} key={algo.key}>
                {algo.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="panel__label" htmlFor="speed">
            Speed
          </label>
          <select
            id="speed"
            value={speed}
            onChange={(e) => setSpeed(e.target.value as SpeedSetting)}
          >
            <option value="slow">Slow</option>
            <option value="normal">Normal</option>
            <option value="fast">Fast</option>
          </select>
        </div>
      </div>

      <div className="panel__section panel__actions">
        <button onClick={run} disabled={status === "calculating"}>
          {status === "calculating" ? "Calculating…" : "Start"}
        </button>
        <button onClick={handleReset} className="secondary">
          Reset
        </button>
      </div>
    </div>
  );
}
