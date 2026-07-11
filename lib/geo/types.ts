import type { LatLng } from "@/types";

export type AddressInput = {
  street?: string;
  city: string;
  state: string;
  zip: string;
};

export type GeocodeResult = {
  location: LatLng;
  displayName: string;
  provider: "nominatim" | "google";
  precision: "address" | "street" | "city" | "postal" | "unknown";
  placeId?: string;
};

export type RouteLeg = {
  from: LatLng;
  to: LatLng;
  distanceMiles: number;
  durationSeconds: number;
  provider: "osrm" | "google";
};

export type HaulingRoutePlan = {
  pickup: GeocodeResult;
  delivery: GeocodeResult;
  stops?: GeocodeResult[];
  yard: LatLng;
  yardName: string;
  /** Yard → pickup (empty / positioning) */
  outboundDeadhead: RouteLeg;
  /** Aggregate pickup → …stops… → delivery (loaded) */
  loaded: RouteLeg;
  /** Individual loaded legs when stops exist */
  loadedLegs?: RouteLeg[];
  /** Delivery → yard (empty / return) */
  returnDeadhead: RouteLeg;
  loadedMiles: number;
  /** Alias of outbound deadhead miles */
  positioningMiles?: number;
  /** Alias of return deadhead miles */
  returnMiles?: number;
  deadheadMiles: number;
  totalTravelMiles: number;
  /** Driving time only (all legs) */
  driveDurationSeconds: number;
  /** Drive + estimated load/unload */
  totalDurationSeconds: number;
  estimatedDriverHours: number;
  loadUnloadMinutes: number;
  provider: string;
};

export type HaulingRouteMetrics = {
  loadedMiles: number;
  deadheadMiles: number;
  positioningMiles?: number;
  returnMiles?: number;
  totalTravelMiles: number;
  driveDurationSeconds: number;
  estimatedDriverHours: number;
  loadUnloadMinutes: number;
  pickupLocation: LatLng;
  deliveryLocation: LatLng;
  stopCount?: number;
  provider: string;
  routeOk: true;
};

export class RouteCalculationError extends Error {
  readonly code: "geocode_failed" | "route_failed" | "incomplete_address";

  constructor(code: RouteCalculationError["code"], message: string) {
    super(message);
    this.name = "RouteCalculationError";
    this.code = code;
  }
}

export function formatAddressQuery(addr: AddressInput): string {
  const parts = [addr.street, addr.city, addr.state, addr.zip]
    .map((p) => (p ?? "").trim())
    .filter(Boolean);
  return parts.join(", ");
}

export function metersToMiles(meters: number): number {
  return Math.round((meters / 1609.344) * 10) / 10;
}

export function secondsToHours(seconds: number): number {
  return Math.round((seconds / 3600) * 10) / 10;
}
