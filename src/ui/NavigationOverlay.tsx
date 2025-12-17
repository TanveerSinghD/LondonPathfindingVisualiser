import { useAppStore } from "../state/useAppStore";
import { formatDistanceMiles } from "../utils/distance";

export function NavigationOverlay() {
  const navigationMode = useAppStore((s) => s.navigationMode);
  const summary = useAppStore((s) => s.summary);
  const setNavigationMode = useAppStore((s) => s.setNavigationMode);
  const setRouteModalOpen = useAppStore((s) => s.setRouteModalOpen);
  const setStatus = useAppStore((s) => s.setStatus);

  if (!navigationMode || !summary) return null;

  const exit = () => {
    setNavigationMode(false);
    setRouteModalOpen(false);
    setStatus("completed");
  };

  const eta = summary.durationMinutes;

  return (
    <div className="nav-overlay">
      <div className="nav-overlay__card">
        <div className="nav-overlay__title">Navigation</div>
        <div className="nav-overlay__eta">{`${eta.toFixed(1)} min`}</div>
        {summary.distanceMeters !== undefined && (
          <div className="nav-overlay__distance">{formatDistanceMiles(summary.distanceMeters)}</div>
        )}
        <button className="button ghost" onClick={exit}>
          Exit route
        </button>
      </div>
    </div>
  );
}
