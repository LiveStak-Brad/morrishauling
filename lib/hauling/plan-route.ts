import { getPrimaryOperatingBase } from "@/lib/geo/service-area";
import { routeDriving } from "@/lib/geo/route-driving";
import { verifyPlaceId, assertVerifiedForBooking, isGooglePlacesConfigured } from "@/lib/geo/verify-place";
import {
  type HaulingRouteMetrics,
  type HaulingRoutePlan,
  type GeocodeResult,
  type RouteLeg,
  RouteCalculationError,
  secondsToHours,
} from "@/lib/geo/types";
import type { VerifiedAddress } from "@/types/address";
import { isSamePoint } from "@/lib/geo/geocode";

export type PlanHaulingRouteInput = {
  pickup: VerifiedAddress;
  delivery: VerifiedAddress;
  /** Intermediate stops between pickup and delivery (each must be verified). */
  stops?: VerifiedAddress[];
  needsLoadingHelp?: boolean;
  needsUnloadingHelp?: boolean;
  /** When true, re-verify place IDs server-side (default true) */
  reverify?: boolean;
};

function loadUnloadMinutes(input: PlanHaulingRouteInput): number {
  const load = input.needsLoadingHelp ? 45 : 20;
  const unload = input.needsUnloadingHelp ? 45 : 20;
  const stopMins = (input.stops?.length ?? 0) * 15;
  return load + unload + stopMins;
}

function toGeocodeResult(addr: VerifiedAddress): GeocodeResult {
  return {
    location: { lat: addr.lat, lng: addr.lng },
    displayName: addr.formattedAddress,
    provider: "google",
    precision: "address",
    placeId: addr.placeId,
  };
}

async function reverifyOne(addr: VerifiedAddress): Promise<VerifiedAddress> {
  const v = await verifyPlaceId(addr.placeId, {
    line2: addr.line2,
    lat: addr.lat,
    lng: addr.lng,
  });
  return { ...v.address, line2: addr.line2 };
}

/**
 * Full hauling trip from primary operating base:
 * Base → Pickup → Additional Stops → Delivery → Base
 * Requires verified Places addresses. Never invents miles.
 */
export async function planHaulingRoute(
  input: PlanHaulingRouteInput
): Promise<HaulingRoutePlan> {
  if (!isGooglePlacesConfigured()) {
    throw new RouteCalculationError(
      "geocode_failed",
      "Address verification is unavailable (Google Maps API key not configured)."
    );
  }

  let pickup = input.pickup;
  let delivery = input.delivery;
  let stops = [...(input.stops ?? [])];

  if (input.reverify !== false) {
    pickup = await reverifyOne(pickup);
    stops = await Promise.all(stops.map((s) => reverifyOne(s)));
    delivery = await reverifyOne(delivery);
  } else {
    assertVerifiedForBooking(pickup, "Pickup address");
    assertVerifiedForBooking(delivery, "Delivery address");
    stops.forEach((s, i) => assertVerifiedForBooking(s, `Stop ${i + 1}`));
  }

  const points = [pickup, ...stops, delivery];
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      if (
        points[i].placeId === points[j].placeId ||
        isSamePoint(
          { lat: points[i].lat, lng: points[i].lng },
          { lat: points[j].lat, lng: points[j].lng }
        )
      ) {
        throw new RouteCalculationError(
          "incomplete_address",
          "Pickup, stops, and delivery must all be different addresses."
        );
      }
    }
  }

  const base = getPrimaryOperatingBase();
  const yard = { location: base.location, name: base.name };

  const pickupLoc = { lat: pickup.lat, lng: pickup.lng };
  const deliveryLoc = { lat: delivery.lat, lng: delivery.lng };

  const outboundDeadhead = await routeDriving(yard.location, pickupLoc);

  const loadedLegs: RouteLeg[] = [];
  let cursor = pickupLoc;
  for (const stop of stops) {
    const stopLoc = { lat: stop.lat, lng: stop.lng };
    loadedLegs.push(await routeDriving(cursor, stopLoc));
    cursor = stopLoc;
  }
  loadedLegs.push(await routeDriving(cursor, deliveryLoc));

  const returnDeadhead = await routeDriving(deliveryLoc, yard.location);

  const loadedMiles =
    Math.round(loadedLegs.reduce((s, l) => s + l.distanceMiles, 0) * 10) / 10;
  const positioningMiles = outboundDeadhead.distanceMiles;
  const returnMiles = returnDeadhead.distanceMiles;
  const deadheadMiles = Math.round((positioningMiles + returnMiles) * 10) / 10;
  const totalTravelMiles = Math.round((loadedMiles + deadheadMiles) * 10) / 10;

  const loadedDriveSeconds = loadedLegs.reduce((s, l) => s + l.durationSeconds, 0);
  const driveDurationSeconds =
    outboundDeadhead.durationSeconds + loadedDriveSeconds + returnDeadhead.durationSeconds;
  const loadMins = loadUnloadMinutes({ ...input, stops });
  const totalDurationSeconds = driveDurationSeconds + loadMins * 60;
  const estimatedDriverHours = Math.max(0.5, secondsToHours(totalDurationSeconds));

  const providers = new Set([
    "google_places",
    outboundDeadhead.provider,
    returnDeadhead.provider,
    ...loadedLegs.map((l) => l.provider),
  ]);

  // Collapse multi-stop loaded path into a single aggregate "loaded" leg for legacy consumers
  const loaded: RouteLeg = {
    from: pickupLoc,
    to: deliveryLoc,
    distanceMiles: loadedMiles,
    durationSeconds: loadedDriveSeconds,
    provider: loadedLegs[0]?.provider ?? outboundDeadhead.provider,
  };

  return {
    pickup: toGeocodeResult(pickup),
    delivery: toGeocodeResult(delivery),
    stops: stops.map(toGeocodeResult),
    yard: yard.location,
    yardName: yard.name,
    outboundDeadhead,
    loaded,
    loadedLegs,
    returnDeadhead,
    loadedMiles,
    positioningMiles,
    returnMiles,
    deadheadMiles,
    totalTravelMiles,
    driveDurationSeconds,
    totalDurationSeconds,
    estimatedDriverHours,
    loadUnloadMinutes: loadMins,
    provider: [...providers].join("+"),
  };
}

export function toRouteMetrics(plan: HaulingRoutePlan): HaulingRouteMetrics {
  return {
    loadedMiles: plan.loadedMiles,
    deadheadMiles: plan.deadheadMiles,
    positioningMiles: plan.positioningMiles,
    returnMiles: plan.returnMiles,
    totalTravelMiles: plan.totalTravelMiles,
    driveDurationSeconds: plan.driveDurationSeconds,
    estimatedDriverHours: plan.estimatedDriverHours,
    loadUnloadMinutes: plan.loadUnloadMinutes,
    pickupLocation: plan.pickup.location,
    deliveryLocation: plan.delivery.location,
    stopCount: plan.stops?.length ?? 0,
    provider: plan.provider,
    routeOk: true,
  };
}
