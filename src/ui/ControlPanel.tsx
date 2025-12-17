import { FormEvent, useEffect, useState } from "react";
import { algorithmList } from "../algorithms";
import { AlgorithmKey } from "../algorithms/types";
import { runPathfinding, stopPathfinding } from "../core/pathfindingEngine";
import { geocodeAddress, reverseGeocode } from "../services/geocodingService";
import { getBrowserLocation } from "../services/locationService";
import { useAppStore } from "../state/useAppStore";
import { SpeedSetting } from "../visualization/types";
import { LONDON_BOUNDS } from "../constants/bounds";
import { AutocompleteInput } from "./AutocompleteInput";
import { AutocompleteSuggestion } from "../services/autocompleteService";
import { fetchTypicalRoute } from "../services/typicalRoutingService";

export function ControlPanel() {
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
    setError,
    startAddress,
    destinationAddress,
    setStartAddress,
    setDestinationAddress,
    setWarning,
    setSnapDebug,
    navigationMode,
    setNavigationMode,
    setRouteModalOpen,
    setStepCounts
  } = useAppStore();

  const [fromInput, setFromInput] = useState(startAddress ?? "");
  const [toInput, setToInput] = useState(destinationAddress ?? "");
  const [isSearchingFrom, setIsSearchingFrom] = useState(false);
  const [isSearchingTo, setIsSearchingTo] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const isWithinLondon = (coords: { lat: number; lng: number }) =>
    coords.lat >= LONDON_BOUNDS.minLat &&
    coords.lat <= LONDON_BOUNDS.maxLat &&
    coords.lng >= LONDON_BOUNDS.minLng &&
    coords.lng <= LONDON_BOUNDS.maxLng;

  useEffect(() => {
    setFromInput(startAddress ?? "");
  }, [startAddress]);

  useEffect(() => {
    setToInput(destinationAddress ?? "");
  }, [destinationAddress]);

  const handleLocate = async () => {
    setIsLocating(true);
    setStatus("locating");
    try {
      const coords = await getBrowserLocation();
      if (!isWithinLondon(coords)) {
        setError("Your location is outside Greater London. Pick a London start point.");
        return;
      }
      const label = await reverseGeocode(coords);
      setSnapDebug(undefined);
      setWarning(undefined);
      setSummary(undefined);
      setFromInput(label);
      setStartAddress(label);
      setStart(coords, "My location", label);
      setStatus("idle");
    } catch {
      setError("Unable to read your location. Try searching manually.");
    } finally {
      setIsLocating(false);
    }
  };

  const resolveFrom = async (e: FormEvent) => {
    e.preventDefault();
    setIsSearchingFrom(true);
    try {
      const results = await geocodeAddress(fromInput);
      if (!results.length) {
        setError("Start address not found in London.");
        return;
      }
      const best = results[0];
      if (!isWithinLondon(best)) {
        setError("Start address must be inside Greater London.");
        return;
      }
      setSnapDebug(undefined);
      setWarning(undefined);
      setSummary(undefined);
      setStart({ lat: best.lat, lng: best.lng }, best.label, best.label);
      setStartAddress(best.label);
      setFromInput(best.label);
    } catch {
      setError("Failed to geocode start address.");
    } finally {
      setIsSearchingFrom(false);
    }
  };

  const resolveTo = async (e: FormEvent) => {
    e.preventDefault();
    setIsSearchingTo(true);
    try {
      const results = await geocodeAddress(toInput);
      if (!results.length) {
        setError("Destination not found in London.");
        return;
      }
      const best = results[0];
      if (!isWithinLondon(best)) {
        setError("Destination must be inside Greater London.");
        return;
      }
      setSnapDebug(undefined);
      setWarning(undefined);
      setSummary(undefined);
      setDestination({ lat: best.lat, lng: best.lng }, best.label, best.label);
      setDestinationAddress(best.label);
      setToInput(best.label);
    } catch {
      setError("Failed to geocode destination.");
    } finally {
      setIsSearchingTo(false);
    }
  };

  const run = async () => {
    setNavigationMode(false);
    const state = useAppStore.getState();
    if (!state.start || !state.destination) {
      setError("Select a start point and destination in London.");
      return;
    }
    stopPathfinding();
    setWarning(undefined);
    setSnapDebug(undefined);
    setStatus("calculating");
    setSummary(undefined);
    setVisualization({
      visitedNodes: [],
      frontierNodes: [],
      visitedPaths: [],
      frontierPaths: [],
      path: []
    });
    setStepCounts(undefined);
    try {
      if (state.algorithm === "typical") {
        const result = await fetchTypicalRoute(state.start, state.destination);
        setVisualization({
          visitedNodes: [],
          frontierNodes: [],
          visitedPaths: [],
          frontierPaths: [],
          path: result.path
        });
        setSummary({
          path: result.path,
          distanceMeters: result.distance,
          durationMinutes: result.duration / 60,
          steps: 0,
          meetingNodeId: undefined,
          algorithm: state.algorithm,
          isOptimal: true
        });
        setStatus("completed");
        setRouteModalOpen(true);
      } else {
        await runPathfinding(
          {
            start: state.start,
            destination: state.destination,
            algorithm: state.algorithm,
            speed: state.speed
          },
          {
            onStep: (snapshot) => {
              setVisualization(snapshot);
              if (snapshot.stepCounts) setStepCounts(snapshot.stepCounts);
            },
            onComplete: ({ path, distanceMeters, durationMinutes, durationSeconds, steps, meetingNodeId }) => {
              const latest = useAppStore.getState().visualization;
              setVisualization({ ...latest, path });
              const selectedAlgorithm = useAppStore.getState().algorithm;
              const isOptimal =
                selectedAlgorithm === "bidi-dijkstra" || selectedAlgorithm === "bidi-astar";
              setSummary({
                path,
                distanceMeters,
                durationMinutes,
                steps,
                meetingNodeId,
                algorithm: selectedAlgorithm,
                isOptimal
              });
              setStatus("completed");
              setRouteModalOpen(true);
            },
            onError: (message) => {
              setError(message);
            },
            onWarning: (message) => setWarning(message),
            onDebug: (info) => setSnapDebug(info)
          }
        );
      }
    } catch (err) {
      setError("Failed to calculate route.");
    }
  };

  const handleReset = () => {
    stopPathfinding();
    setNavigationMode(false);
    setRouteModalOpen(false);
    setStepCounts(undefined);
    reset();
  };

  return (
    <div className="panel card">
      <div className="panel__section-title">Locations</div>
      <Section title="From" helper="Search an address, postcode, or landmark in London.">
        <form className="row inline" onSubmit={resolveFrom}>
          <AutocompleteInput
            value={fromInput}
            placeholder="King's Cross Station"
            onChange={setFromInput}
            onSelect={(s: AutocompleteSuggestion) => {
              setFromInput(s.label);
              setStart({ lat: s.lat, lng: s.lng }, s.primary, s.label);
              setStartAddress(s.label);
            }}
          />
          <button className="button primary" type="submit" disabled={isSearchingFrom}>
            {isSearchingFrom ? "Searching…" : "Set"}
          </button>
        </form>
        <div className="row">
          <button className="button ghost" onClick={handleLocate} disabled={isLocating}>
            {isLocating ? "Locating…" : "Use my current location"}
          </button>
        </div>
        <HelperText>
          {startAddress
            ? `From: ${startAddress}`
            : start
            ? `From: ${start.lat.toFixed(4)}, ${start.lng.toFixed(4)}`
            : "Start not set"}
        </HelperText>
      </Section>

      <Section title="To" helper="Destination in London (address, postcode, landmark).">
        <form className="row inline" onSubmit={resolveTo}>
          <AutocompleteInput
            value={toInput}
            placeholder="London Bridge, W1A 1AA"
            onChange={setToInput}
            onSelect={(s: AutocompleteSuggestion) => {
              setToInput(s.label);
              setDestination({ lat: s.lat, lng: s.lng }, s.primary, s.label);
              setDestinationAddress(s.label);
            }}
          />
          <button className="button primary" type="submit" disabled={isSearchingTo}>
            {isSearchingTo ? "Searching…" : "Set"}
          </button>
        </form>
        <HelperText>
          {destinationAddress
            ? `To: ${destinationAddress}`
            : destination
            ? `To: ${destination.lat.toFixed(4)}, ${destination.lng.toFixed(4)}`
            : "Destination not set"}
        </HelperText>
      </Section>

      <div className="panel__section-title">Settings</div>
      <Section title="Algorithm & speed" helper="Pick a pathfinding approach and animation speed.">
        <div className="row inline">
          <div className="field grow">
            <label htmlFor="algorithm">Algorithm</label>
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
          <div className="field">
            <label htmlFor="speed">Speed</label>
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
      </Section>

      <div className="panel__section-title">Actions</div>
      <Section title="Actions">
        <div className="row inline">
          <button
            className="button solid"
            onClick={run}
            disabled={status === "calculating" || !start || !destination || navigationMode}
          >
            {status === "calculating" ? "Calculating…" : "Start"}
          </button>
          <button className="button ghost" onClick={handleReset}>
            Reset
          </button>
        </div>
      </Section>
    </div>
  );
}

function Section({
  title,
  helper,
  children
}: {
  title: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="section">
      <div className="section__title">{title}</div>
      {helper && <div className="section__helper">{helper}</div>}
      <div className="section__body">{children}</div>
    </div>
  );
}

function HelperText({ children }: { children: React.ReactNode }) {
  return <div className="helper">{children}</div>;
}
