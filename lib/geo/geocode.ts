import type { LatLng } from "@/types";
import {
  type AddressInput,
  type GeocodeResult,
  RouteCalculationError,
  formatAddressQuery,
} from "@/lib/geo/types";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "MorrisServicesHauling/1.0 (operations@morris-services.com)";

function googleKey(): string | undefined {
  return process.env.GOOGLE_MAPS_API_KEY?.trim() || undefined;
}

function inferPrecision(result: {
  type?: string;
  class?: string;
  importance?: number;
}): GeocodeResult["precision"] {
  const t = `${result.type ?? ""} ${result.class ?? ""}`.toLowerCase();
  if (t.includes("house") || t.includes("building") || t.includes("address")) return "address";
  if (t.includes("street") || t.includes("road") || t.includes("residential")) return "street";
  if (t.includes("city") || t.includes("town") || t.includes("village")) return "city";
  if (t.includes("postcode") || t.includes("postal")) return "postal";
  return "unknown";
}

async function geocodeNominatim(addr: AddressInput): Promise<GeocodeResult> {
  const q = formatAddressQuery(addr);
  if (!addr.city?.trim() || !addr.state?.trim()) {
    throw new RouteCalculationError(
      "incomplete_address",
      "City and state are required to calculate a route."
    );
  }

  const url = new URL(NOMINATIM_URL);
  url.searchParams.set("q", q);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("countrycodes", "us");

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new RouteCalculationError(
      "geocode_failed",
      `Geocoding service unavailable (${res.status}). Could not locate: ${q}`
    );
  }

  const data = (await res.json()) as Array<{
    lat: string;
    lon: string;
    display_name: string;
    type?: string;
    class?: string;
  }>;

  if (!data?.length) {
    throw new RouteCalculationError(
      "geocode_failed",
      `Could not find a map location for "${q}". Check the street, city, and ZIP.`
    );
  }

  const hit = data[0];
  return {
    location: { lat: Number(hit.lat), lng: Number(hit.lon) },
    displayName: hit.display_name,
    provider: "nominatim",
    precision: inferPrecision(hit),
  };
}

async function geocodeGoogle(addr: AddressInput, key: string): Promise<GeocodeResult> {
  const q = formatAddressQuery(addr);
  const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
  url.searchParams.set("address", q);
  url.searchParams.set("key", key);

  const res = await fetch(url.toString(), { next: { revalidate: 0 } });
  if (!res.ok) {
    throw new RouteCalculationError(
      "geocode_failed",
      `Google Geocoding unavailable (${res.status}) for: ${q}`
    );
  }

  const data = (await res.json()) as {
    status: string;
    results?: Array<{
      place_id?: string;
      formatted_address: string;
      geometry: { location: { lat: number; lng: number } };
      types?: string[];
      address_components?: Array<{
        long_name: string;
        short_name: string;
        types: string[];
      }>;
    }>;
  };

  if (data.status !== "OK" || !data.results?.length) {
    throw new RouteCalculationError(
      "geocode_failed",
      `Could not geocode "${q}" (${data.status}).`
    );
  }

  const hit = data.results[0];
  const types = hit.types ?? [];
  let precision: GeocodeResult["precision"] = "unknown";
  if (types.includes("street_address") || types.includes("premise")) precision = "address";
  else if (types.includes("route")) precision = "street";
  else if (types.includes("locality")) precision = "city";
  else if (types.includes("postal_code")) precision = "postal";

  return {
    location: { lat: hit.geometry.location.lat, lng: hit.geometry.location.lng },
    displayName: hit.formatted_address,
    provider: "google",
    precision,
    placeId: hit.place_id,
  };
}

/** Geocode a full street address. Never invents coordinates. */
export async function geocodeAddress(addr: AddressInput): Promise<GeocodeResult> {
  const key = googleKey();
  if (key) {
    try {
      return await geocodeGoogle(addr, key);
    } catch (e) {
      if (e instanceof RouteCalculationError && e.code === "geocode_failed") {
        // Fall through to Nominatim
      } else {
        throw e;
      }
    }
  }
  return geocodeNominatim(addr);
}

export function isSamePoint(a: LatLng, b: LatLng, epsilon = 0.00015): boolean {
  return Math.abs(a.lat - b.lat) < epsilon && Math.abs(a.lng - b.lng) < epsilon;
}
