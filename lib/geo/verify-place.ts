import type { VerifiedAddress, ServiceAreaAssessment } from "@/types/address";
import {
  hasStreetNumber,
  looksLikePoBox,
  normalizeServiceAreaOutcome,
} from "@/types/address";
import { RouteCalculationError } from "@/lib/geo/types";
import { assessServiceAreaAsync, isUnsupportedServiceArea } from "@/lib/geo/service-area";
import { verifiedAddressFromPlace } from "@/lib/geo/place-to-address";

function googleKey(): string | undefined {
  return process.env.GOOGLE_MAPS_API_KEY?.trim() || undefined;
}

/** True when any Maps key is present (browser and/or server). */
export function isGooglePlacesConfigured(): boolean {
  return Boolean(googleKey() || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim());
}

/** Browser Places Autocomplete key (separate from server verification). */
export function isBrowserPlacesConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim());
}

/** True when the server key can call Places Details / Geocoding / Directions. */
export function isGoogleServerMapsConfigured(): boolean {
  return Boolean(googleKey());
}

type PlacesDetailsResult = {
  status: string;
  result?: {
    place_id: string;
    formatted_address: string;
    geometry?: { location: { lat: number; lng: number } };
    address_components?: Array<{
      long_name: string;
      short_name: string;
      types: string[];
    }>;
    types?: string[];
  };
  error_message?: string;
};

type ClientHint = Partial<{
  line1: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
  line2?: string;
  formattedAddress?: string;
  country?: string;
}>;

function isReferrerDenied(status: string, errorMessage?: string): boolean {
  const msg = `${status} ${errorMessage ?? ""}`.toLowerCase();
  return (
    status === "REQUEST_DENIED" &&
    (msg.includes("referer") || msg.includes("referrer"))
  );
}

function addressFromAutocompleteHint(
  placeId: string,
  clientHint?: ClientHint
): VerifiedAddress {
  if (
    !clientHint?.line1 ||
    !clientHint.city ||
    !clientHint.state ||
    !clientHint.zip ||
    clientHint.lat == null ||
    clientHint.lng == null
  ) {
    throw new RouteCalculationError(
      "geocode_failed",
      "Could not verify address with the server Maps key. Create a separate server key (no HTTP referrer restriction) for Places Details, Geocoding, and Directions."
    );
  }

  if (looksLikePoBox(clientHint.line1) || looksLikePoBox(clientHint.formattedAddress ?? "")) {
    throw new RouteCalculationError(
      "geocode_failed",
      "PO Boxes are not valid service addresses. Please enter a physical street address."
    );
  }
  if (!hasStreetNumber(clientHint.line1)) {
    throw new RouteCalculationError(
      "geocode_failed",
      "Please select a full street address that includes a street number."
    );
  }

  return {
    line1: clientHint.line1.trim(),
    line2: clientHint.line2?.trim() || undefined,
    city: clientHint.city.trim(),
    state: clientHint.state.trim(),
    zip: clientHint.zip.trim(),
    country: "US",
    formattedAddress:
      clientHint.formattedAddress?.trim() ||
      `${clientHint.line1}, ${clientHint.city}, ${clientHint.state} ${clientHint.zip}`,
    lat: clientHint.lat,
    lng: clientHint.lng,
    placeId,
    verificationStatus: "verified",
    provider: "google_places",
    verifiedAt: new Date().toISOString(),
  };
}

async function withServiceArea(address: VerifiedAddress) {
  const serviceAreaRaw = await assessServiceAreaAsync(address);
  const serviceArea = {
    ...serviceAreaRaw,
    outcome: normalizeServiceAreaOutcome(serviceAreaRaw.outcome),
  };
  if (isUnsupportedServiceArea(serviceArea.outcome)) {
    throw new RouteCalculationError("geocode_failed", serviceArea.message);
  }
  return { address, serviceArea };
}

/**
 * Server-side Places Details verification.
 * Prefers Places Details with the server key. If that key is referrer-restricted
 * (common misconfig), accepts a complete Autocomplete payload for the same placeId.
 */
export async function verifyPlaceId(
  placeId: string,
  clientHint?: ClientHint
): Promise<{ address: VerifiedAddress; serviceArea: ServiceAreaAssessment }> {
  if (!placeId?.trim()) {
    throw new RouteCalculationError("incomplete_address", "A verified place selection is required.");
  }

  const key = googleKey();

  if (key) {
    const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
    url.searchParams.set("place_id", placeId);
    url.searchParams.set(
      "fields",
      "place_id,formatted_address,geometry,address_component,type"
    );
    url.searchParams.set("key", key);

    const res = await fetch(url.toString(), { next: { revalidate: 0 } });
    if (res.ok) {
      const data = (await res.json()) as PlacesDetailsResult;
      if (data.status === "OK" && data.result) {
        const address = verifiedAddressFromPlace(
          {
            place_id: data.result.place_id,
            formatted_address: data.result.formatted_address,
            geometry: data.result.geometry,
            address_components: data.result.address_components,
          },
          { line2: clientHint?.line2 }
        );

        if (
          clientHint?.lat != null &&
          clientHint?.lng != null &&
          (Math.abs(clientHint.lat - address.lat) > 0.0015 ||
            Math.abs(clientHint.lng - address.lng) > 0.0015)
        ) {
          throw new RouteCalculationError(
            "geocode_failed",
            "Address was modified after selection. Please search and select the address again."
          );
        }

        return withServiceArea(address);
      }

      if (isReferrerDenied(data.status, data.error_message)) {
        // Fall through to Autocomplete-sourced address
      } else {
        throw new RouteCalculationError(
          "geocode_failed",
          `Could not verify address (${data.status}${data.error_message ? `: ${data.error_message}` : ""}).`
        );
      }
    }
  }

  const address = addressFromAutocompleteHint(placeId, clientHint);
  return withServiceArea(address);
}

export function assertVerifiedForBooking(addr: VerifiedAddress | null | undefined, label: string) {
  if (!addr?.placeId || addr.verificationStatus === "unverified") {
    throw new RouteCalculationError(
      "incomplete_address",
      `${label} must be selected from verified address suggestions.`
    );
  }
  if (!Number.isFinite(addr.lat) || !Number.isFinite(addr.lng)) {
    throw new RouteCalculationError("geocode_failed", `${label} is missing valid coordinates.`);
  }
}
