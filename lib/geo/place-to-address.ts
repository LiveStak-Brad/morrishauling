import type { VerifiedAddress } from "@/types/address";
import { hasStreetNumber, looksLikePoBox } from "@/types/address";

export type PlaceComponent = {
  long_name: string;
  short_name: string;
  types: string[];
};

export type PlaceLike = {
  place_id?: string;
  formatted_address?: string;
  geometry?: {
    location?:
      | { lat: number; lng: number }
      | { lat: () => number; lng: () => number };
  };
  address_components?: PlaceComponent[];
};

function component(components: PlaceComponent[] | undefined, type: string, short = false): string {
  const hit = components?.find((c) => c.types.includes(type));
  return (short ? hit?.short_name : hit?.long_name) ?? "";
}

function readLatLng(place: PlaceLike): { lat: number; lng: number } | null {
  const loc = place.geometry?.location;
  if (!loc) return null;
  const lat = typeof loc.lat === "function" ? loc.lat() : loc.lat;
  const lng = typeof loc.lng === "function" ? loc.lng() : loc.lng;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

/**
 * Build a VerifiedAddress from Places Autocomplete / Details payload.
 * Used client-side after suggestion select (browser key) and server-side after Details.
 */
export function verifiedAddressFromPlace(
  place: PlaceLike,
  opts?: { line2?: string }
): VerifiedAddress {
  const placeId = place.place_id?.trim();
  if (!placeId) {
    throw new Error("Please select an address from the suggestions.");
  }

  const coords = readLatLng(place);
  if (!coords) {
    throw new Error("Selected place is missing coordinates. Please choose another suggestion.");
  }

  const components = place.address_components ?? [];
  const streetNumber = component(components, "street_number");
  const route = component(components, "route");
  const formatted = place.formatted_address?.trim() || "";
  const line1 =
    [streetNumber, route].filter(Boolean).join(" ").trim() ||
    formatted.split(",")[0]?.trim() ||
    "";

  const city =
    component(components, "locality") ||
    component(components, "sublocality") ||
    component(components, "administrative_area_level_3") ||
    component(components, "postal_town");
  const state = component(components, "administrative_area_level_1", true);
  const zip = component(components, "postal_code");
  const country = component(components, "country", true) || "US";

  if (looksLikePoBox(line1) || looksLikePoBox(formatted)) {
    throw new Error("PO Boxes are not valid service addresses. Please enter a physical street address.");
  }
  if (!hasStreetNumber(line1) && !streetNumber) {
    throw new Error("Please select a full street address that includes a street number.");
  }
  if (country && country.toUpperCase() !== "US" && country.toUpperCase() !== "USA") {
    throw new Error("We currently only service addresses in the United States.");
  }
  if (!city || !state || !zip) {
    throw new Error("Please select a complete street address (city, state, and ZIP required).");
  }

  return {
    line1,
    line2: opts?.line2?.trim() || undefined,
    city,
    state,
    zip,
    country: "US",
    formattedAddress: formatted || `${line1}, ${city}, ${state} ${zip}`,
    lat: coords.lat,
    lng: coords.lng,
    placeId,
    verificationStatus: "verified",
    provider: "google_places",
    verifiedAt: new Date().toISOString(),
  };
}
