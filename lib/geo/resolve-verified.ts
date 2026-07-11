import type { AddressInput, GeocodeResult } from "@/lib/geo/types";
import { geocodeAddress } from "@/lib/geo/geocode";
import { verifyPlaceId } from "@/lib/geo/verify-place";
import type { VerifiedAddress } from "@/types/address";
import { RouteCalculationError } from "@/lib/geo/types";

/**
 * Resolve a street address to a VerifiedAddress via Google Geocoding + Places Details.
 * Used by verification scripts and server tooling — not a customer booking bypass.
 */
export async function resolveVerifiedAddress(
  addr: AddressInput & { line2?: string }
): Promise<VerifiedAddress> {
  const geo: GeocodeResult = await geocodeAddress(addr);
  if (geo.precision === "city" || geo.precision === "postal") {
    throw new RouteCalculationError(
      "incomplete_address",
      `Address is not precise enough (${geo.precision}). Provide a full street address.`
    );
  }
  if (!geo.placeId) {
    throw new RouteCalculationError(
      "geocode_failed",
      "Geocoder did not return a placeId. Google Maps API key with Geocoding is required."
    );
  }
  const { address } = await verifyPlaceId(geo.placeId, {
    line2: addr.line2,
    lat: geo.location.lat,
    lng: geo.location.lng,
  });
  return address;
}
