import type { LatLng } from "@/types";

/** Estimated road distance for a single origin → destination leg. */
export interface DistanceProvider {
  readonly name: string;
  /** Great-circle distance in miles (no road factor). */
  straightLineMiles(a: LatLng, b: LatLng): number;
  /** Estimated driving distance in miles. */
  roadMiles(a: LatLng, b: LatLng): number;
}

const EARTH_RADIUS_MI = 3958.8;
const AVG_ROAD_FACTOR = 1.18;

function haversineStraightLine(a: LatLng, b: LatLng): number {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_MI * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function applyRoadFactor(straightMiles: number): number {
  return Math.round(straightMiles * AVG_ROAD_FACTOR * 10) / 10;
}

/** Placeholder distances using haversine + road factor. Replace with Google Maps later. */
export class HaversineDistanceProvider implements DistanceProvider {
  readonly name = "haversine";

  straightLineMiles(a: LatLng, b: LatLng): number {
    return haversineStraightLine(a, b);
  }

  roadMiles(a: LatLng, b: LatLng): number {
    return applyRoadFactor(this.straightLineMiles(a, b));
  }
}

/**
 * Future Google Maps Distance Matrix provider.
 * Falls back to haversine until API credentials and routing are wired.
 */
export class GoogleMapsDistanceProvider implements DistanceProvider {
  readonly name = "google_maps";
  private readonly fallback = new HaversineDistanceProvider();

  straightLineMiles(a: LatLng, b: LatLng): number {
    return this.fallback.straightLineMiles(a, b);
  }

  roadMiles(a: LatLng, b: LatLng): number {
    // TODO: integrate Google Distance Matrix / Routes API
    return this.fallback.roadMiles(a, b);
  }
}

export const defaultDistanceProvider: DistanceProvider = new HaversineDistanceProvider();
