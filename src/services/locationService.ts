import { LONDON_CENTER } from "../constants/bounds";

export interface Coordinates {
  lat: number;
  lng: number;
}

export async function getBrowserLocation(): Promise<Coordinates> {
  if (!("geolocation" in navigator)) {
    return { lat: LONDON_CENTER[0], lng: LONDON_CENTER[1] };
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (error) => reject(error),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  });
}

export function formatCoordinates(coords: Coordinates): string {
  return `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`;
}
