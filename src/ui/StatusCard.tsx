import { useAppStore } from "../state/useAppStore";
import { formatDistanceMiles } from "../utils/distance";

function formatDuration(minutes: number): string {
  if (minutes < 1) return `${(minutes * 60).toFixed(0)} sec`;
  return `${minutes.toFixed(1)} min`;
}

export function StatusCard() {
  const summary = useAppStore((s) => s.summary);
  const status = useAppStore((s) => s.status);
  const error = useAppStore((s) => s.errorMessage);
  const warning = useAppStore((s) => s.warningMessage);
  const snapDebug = useAppStore((s) => s.snapDebug);
  const algorithm = useAppStore((s) => s.algorithm);
  const stepCounts = useAppStore((s) => s.stepCounts);
  const isBidirectional = algorithm === "bidi-dijkstra" || algorithm === "bidi-astar";
  const methodLabel =
    summary?.algorithm === "typical"
      ? "Method: Typical routing (typical search)"
      : summary?.algorithm
      ? `Method: ${summary.algorithm}`
      : undefined;

  const statusText =
    status === "calculating"
      ? isBidirectional
        ? "Searching from start and destination…"
        : "Calculating…"
      : status === "completed"
      ? "Route found"
      : status === "error"
      ? "Issue"
      : "Ready";

  return (
    <div className="card status-card">
      <div className="status-card__label">Status</div>
      <div className={`status-card__value status-${status}`}>{error ?? warning ?? statusText}</div>
      {warning && !error && <div className="status-card__warning">{warning}</div>}
      {summary && (
        <div className="status-card__metrics">
          <div>
            <div className="metric__label">Distance</div>
            <div className="metric__value">{formatDistanceMiles(summary.distanceMeters)}</div>
          </div>
          <div>
            <div className="metric__label">Est. time</div>
            <div className="metric__value">{formatDuration(summary.durationMinutes)}</div>
          </div>
          {summary.steps !== undefined && (
            <div>
              <div className="metric__label">Steps</div>
              <div className="metric__value">{summary.steps}</div>
            </div>
          )}
        </div>
      )}
      {methodLabel && <div className="status-card__note">{methodLabel}</div>}
      {!summary && stepCounts && status === "calculating" && (
        <div className="status-card__metrics">
          <div>
            <div className="metric__label">Steps forward</div>
            <div className="metric__value">{stepCounts.forward}</div>
          </div>
          <div>
            <div className="metric__label">Steps backward</div>
            <div className="metric__value">{stepCounts.backward}</div>
          </div>
        </div>
      )}
      {summary?.steps !== undefined && isBidirectional && (
        <div className="status-card__note">{`Searches met after ${summary.steps} steps${summary.meetingNodeId ? ` at node ${summary.meetingNodeId}` : ""}.`}</div>
      )}
      {snapDebug && (
        <div className="status-card__debug">
          <div>
            <div className="metric__label">Start snapped</div>
            <div className="metric__value">{`${snapDebug.startDistance.toFixed(1)} m`}</div>
          </div>
          <div>
            <div className="metric__label">End snapped</div>
            <div className="metric__value">{`${snapDebug.destinationDistance.toFixed(1)} m`}</div>
          </div>
          <div className="status-card__ids">
            <span>Start node: {snapDebug.startNodeId}</span>
            <span>Dest node: {snapDebug.destinationNodeId}</span>
            {summary?.meetingNodeId && <span>Meeting node: {summary.meetingNodeId}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
