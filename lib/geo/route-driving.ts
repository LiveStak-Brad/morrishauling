import type { LatLng } from "@/types";
import { type RouteLeg, RouteCalculationError, metersToMiles } from "@/lib/geo/types";
import { isSamePoint } from "@/lib/geo/geocode";

const OSRM_URL = process.env.OSRM_URL?.trim() || "https://router.project-osrm.org";

function googleKey(): string | undefined {
  return process.env.GOOGLE_MAPS_API_KEY?.trim() || undefined;
}

async function routeOsrm(from: LatLng, to: LatLng): Promise<RouteLeg> {
  if (isSamePoint(from, to)) {
    return {
      from,
      to,
      distanceMiles: 0,
      durationSeconds: 0,
      provider: "osrm",
    };
  }

  const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`;
  const url = `${OSRM_URL}/route/v1/driving/${coords}?overview=false&alternatives=false&steps=false`;

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new RouteCalculationError(
      "route_failed",
      `Routing service unavailable (${res.status}). Could not calculate road distance.`
    );
  }

  const data = (await res.json()) as {
    code?: string;
    message?: string;
    routes?: Array<{ distance: number; duration: number }>;
  };

  if (data.code !== "Ok" || !data.routes?.length) {
    throw new RouteCalculationError(
      "route_failed",
      `Could not calculate a driving route (${data.code ?? "unknown"}). ${data.message ?? ""}`.trim()
    );
  }

  const route = data.routes[0];
  return {
    from,
    to,
    distanceMiles: metersToMiles(route.distance),
    durationSeconds: Math.round(route.duration),
    provider: "osrm",
  };
}

async function routeGoogle(from: LatLng, to: LatLng, key: string): Promise<RouteLeg> {
  if (isSamePoint(from, to)) {
    return { from, to, distanceMiles: 0, durationSeconds: 0, provider: "google" };
  }

  const url = new URL("https://maps.googleapis.com/maps/api/directions/json");
  url.searchParams.set("origin", `${from.lat},${from.lng}`);
  url.searchParams.set("destination", `${to.lat},${to.lng}`);
  url.searchParams.set("mode", "driving");
  url.searchParams.set("units", "imperial");
  url.searchParams.set("key", key);

  const res = await fetch(url.toString(), { next: { revalidate: 0 } });
  if (!res.ok) {
    throw new RouteCalculationError(
      "route_failed",
      `Google Directions unavailable (${res.status}).`
    );
  }

  const data = (await res.json()) as {
    status: string;
    routes?: Array<{
      legs: Array<{ distance: { value: number }; duration: { value: number } }>;
    }>;
  };

  if (data.status !== "OK" || !data.routes?.[0]?.legs?.length) {
    throw new RouteCalculationError(
      "route_failed",
      `Could not calculate driving directions (${data.status}).`
    );
  }

  const leg = data.routes[0].legs[0];
  return {
    from,
    to,
    distanceMiles: metersToMiles(leg.distance.value),
    durationSeconds: Math.round(leg.duration.value),
    provider: "google",
  };
}

/** Road distance + duration between two coordinates. No placeholders. */
export async function routeDriving(from: LatLng, to: LatLng): Promise<RouteLeg> {
  const key = googleKey();
  if (key) {
    try {
      return await routeGoogle(from, to, key);
    } catch (e) {
      if (e instanceof RouteCalculationError) {
        // Fall through to OSRM
      } else {
        throw e;
      }
    }
  }
  return routeOsrm(from, to);
}
