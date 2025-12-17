import { useAppStore } from "../state/useAppStore";
import { formatDistanceMiles } from "../utils/distance";

export function RouteFoundModal() {
  const routeModalOpen = useAppStore((s) => s.routeModalOpen);
  const summary = useAppStore((s) => s.summary);
  const setRouteModalOpen = useAppStore((s) => s.setRouteModalOpen);
  const setNavigationMode = useAppStore((s) => s.setNavigationMode);
  const setStatus = useAppStore((s) => s.setStatus);
  const algorithm = useAppStore((s) => s.algorithm);

  if (!routeModalOpen || !summary) return null;

  const isOptimal =
    summary.isOptimal ?? (algorithm === "bidi-dijkstra" || algorithm === "bidi-astar");
  const title = isOptimal ? "Fastest route found" : "Route found";

  const startRoute = () => {
    setNavigationMode(true);
    setRouteModalOpen(false);
    setStatus("completed");
  };

  return (
    <div className="modal-overlay" onClick={() => setRouteModalOpen(false)}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">{title}</div>
        <div className="modal-subtitle">Time: {`${summary.durationMinutes.toFixed(1)} min`}</div>
        {summary.distanceMeters && (
          <div className="modal-subtitle">Distance: {formatDistanceMiles(summary.distanceMeters)}</div>
        )}
        {!isOptimal && (
          <div className="modal-note">Not guaranteed fastest (demonstration algorithm).</div>
        )}
        <div className="modal-actions">
          <button className="button ghost" onClick={() => setRouteModalOpen(false)}>
            Close
          </button>
          <button className="button primary" onClick={startRoute}>
            Start route
          </button>
        </div>
      </div>
    </div>
  );
}
