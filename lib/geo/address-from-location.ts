import type { VerifiedAddress } from "@/types/address";
import type { HaulingLocation } from "@/types/hauling";
import type { JobAddress } from "@/types/job";

/** Build a VerifiedAddress candidate from a booking location payload (still must be re-verified). */
export function haulingLocationToVerifiedCandidate(
  loc: HaulingLocation
): VerifiedAddress | null {
  if (!loc.placeId || loc.location?.lat == null || loc.location?.lng == null) {
    return null;
  }
  return {
    line1: loc.address,
    line2: loc.line2,
    city: loc.city,
    state: loc.state,
    zip: loc.zip,
    country: loc.country ?? "US",
    formattedAddress:
      loc.formattedAddress ??
      [loc.address, loc.city, loc.state, loc.zip].filter(Boolean).join(", "),
    lat: loc.location.lat,
    lng: loc.location.lng,
    placeId: loc.placeId,
    verificationStatus: loc.verificationStatus ?? "unverified",
    provider: loc.provider ?? "google_places",
    verifiedAt: loc.verifiedAt ?? new Date().toISOString(),
  };
}

export function jobAddressToVerifiedCandidate(addr: JobAddress): VerifiedAddress | null {
  if (!addr.placeId || addr.location?.lat == null || addr.location?.lng == null) {
    return null;
  }
  return {
    line1: addr.street,
    line2: addr.line2,
    city: addr.city,
    state: addr.state,
    zip: addr.zip,
    country: addr.country ?? "US",
    formattedAddress:
      addr.formattedAddress ??
      [addr.street, addr.city, addr.state, addr.zip].filter(Boolean).join(", "),
    lat: addr.location.lat,
    lng: addr.location.lng,
    placeId: addr.placeId,
    verificationStatus: addr.verificationStatus ?? "unverified",
    provider: addr.provider ?? "google_places",
    verifiedAt: addr.verifiedAt ?? new Date().toISOString(),
  };
}

export function verifiedToHaulingLocation(
  addr: VerifiedAddress,
  extras?: Partial<HaulingLocation>
): HaulingLocation {
  return {
    address: addr.line1,
    city: addr.city,
    state: addr.state,
    zip: addr.zip,
    location: { lat: addr.lat, lng: addr.lng },
    line2: addr.line2,
    placeId: addr.placeId,
    formattedAddress: addr.formattedAddress,
    country: addr.country,
    verificationStatus: addr.verificationStatus,
    provider: addr.provider,
    verifiedAt: addr.verifiedAt,
    ...extras,
  };
}

export function verifiedToJobAddress(addr: VerifiedAddress): JobAddress {
  return {
    street: addr.line1,
    line2: addr.line2,
    city: addr.city,
    state: addr.state,
    zip: addr.zip,
    location: { lat: addr.lat, lng: addr.lng },
    placeId: addr.placeId,
    formattedAddress: addr.formattedAddress,
    country: addr.country,
    verificationStatus: addr.verificationStatus,
    provider: addr.provider,
    verifiedAt: addr.verifiedAt,
  };
}
