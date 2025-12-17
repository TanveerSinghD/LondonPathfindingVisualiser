import { useAppStore } from "../state/useAppStore";
import { formatDistanceMiles } from "../utils/distance";

function formatDuration(minutes: number): string {
  if (minutes < 1) return `${(minutes * 60).toFixed(0)} sec`;
  return `${minutes.toFixed(1)} min`;
}

export function Summary() {
  const summary = useAppStore((s) => s.summary);
  const status = useAppStore((s) => s.status);
  const error = useAppStore((s) => s.errorMessage);

  return (
    <div className="summary">
      <div className="summary__status">
        {status === "calculating" && "Calculating path..."}
        {status === "completed" && "Route found"}
        {status === "error" && error}
        {status === "idle" && "Ready"}
      </div>
      {summary && (
        <div className="summary__metrics">
          <div>
            <div className="summary__label">Distance</div>
            <div>{formatDistanceMiles(summary.distanceMeters)}</div>
          </div>
          <div>
            <div className="summary__label">Est. time</div>
            <div>{formatDuration(summary.durationMinutes)}</div>
          </div>
        </div>
      )}
    </div>
  );
}
