const MPH_TO_MPS = 0.44704;
const KMPH_TO_MPS = 0.277778;

const HIGHWAY_SPEED_MPH: Record<string, number> = {
  motorway: 60,
  trunk: 50,
  primary: 40,
  secondary: 30,
  tertiary: 25,
  unclassified: 25,
  residential: 20,
  service: 10,
  living_street: 10,
  pedestrian: 5,
  footway: 3,
  path: 3,
  cycleway: 12
};

export function mphToMps(mph: number): number {
  return mph * MPH_TO_MPS;
}

export function kmphToMps(kmph: number): number {
  return kmph * KMPH_TO_MPS;
}

export function parseMaxspeedToMps(raw?: string): number | undefined {
  if (!raw) return undefined;
  const trimmed = raw.toLowerCase().trim();
  const mphMatch = trimmed.match(/^([0-9]+)\s*mph$/);
  if (mphMatch) {
    const mph = Number(mphMatch[1]);
    if (mph > 0 && mph < 130) return mphToMps(mph);
  }
  const plain = Number(trimmed);
  if (!Number.isNaN(plain)) {
    // assume km/h if no unit
    if (plain > 0 && plain < 200) return kmphToMps(plain);
  }
  return undefined;
}

export function defaultSpeedForHighway(highway?: string): number {
  if (!highway) return mphToMps(20);
  const entry = Object.entries(HIGHWAY_SPEED_MPH).find(([key]) => highway.startsWith(key));
  if (!entry) return mphToMps(20);
  return mphToMps(entry[1]);
}

export function edgeSpeedMps(highway?: string, maxspeedMps?: number): number {
  if (maxspeedMps && maxspeedMps > 0 && maxspeedMps < 80) return maxspeedMps;
  return defaultSpeedForHighway(highway);
}
