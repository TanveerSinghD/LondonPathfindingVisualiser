export function Legend() {
  return (
    <div className="legend floating-card">
      <LegendItem className="dot visited" label="Forward visited" />
      <LegendItem className="dot visited-back" label="Backward visited" />
      <LegendItem className="dot frontier" label="Forward frontier" />
      <LegendItem className="dot frontier-back" label="Backward frontier" />
      <LegendItem className="dot meeting" label="Meeting point" />
      <LegendItem className="dot path" label="Final path" />
    </div>
  );
}

function LegendItem({ className, label }: { className: string; label: string }) {
  return (
    <div className="legend__item">
      <span className={className} />
      <span>{label}</span>
    </div>
  );
}
