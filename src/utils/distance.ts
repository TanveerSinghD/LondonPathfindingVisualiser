export const METERS_PER_MILE = 1609.344;

export function metersToMiles(meters: number): number {
  return meters / METERS_PER_MILE;
}

export function formatDistanceMiles(meters: number): string {
  if (!Number.isFinite(meters) || meters <= 0) {
    console.warn("[distance] Invalid meters value for formatting", meters);
    return "< 0.1 mi";
  }
  const miles = metersToMiles(meters);
  if (!Number.isFinite(miles)) {
    console.warn("[distance] Computed miles invalid", miles);
    return "< 0.1 mi";
  }
  if (miles < 0.1) return "< 0.1 mi";
  if (miles < 10) return `${miles.toFixed(1)} mi`;
  return `${Math.round(miles)} mi`;
}
