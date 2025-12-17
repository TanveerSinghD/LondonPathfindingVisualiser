export function Legend() {
  return (
    <div className="legend">
      <div className="legend__item">
        <span className="legend__swatch visited" />
        Visited nodes
      </div>
      <div className="legend__item">
        <span className="legend__swatch frontier" />
        Frontier
      </div>
      <div className="legend__item">
        <span className="legend__swatch path" />
        Final path
      </div>
    </div>
  );
}
