import type { LatLng } from "@/types/company";

export type AddressVerificationStatus = "verified" | "manual_override" | "unverified";

export type AddressProvider = "google_places" | "manual";

/** Structured, verified service address — never accept free-text alone for booking. */
export interface VerifiedAddress {
  line1: string;
  /** Apartment, suite, unit, lot, building, or gate — optional, separate from verified street */
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  placeId: string;
  verificationStatus: AddressVerificationStatus;
  provider: AddressProvider;
  verifiedAt: string;
}

/**
 * Service-area classification from real distance + configured rules.
 * Legacy aliases `in_area` / `blocked` kept for older callers.
 */
export type ServiceAreaOutcome =
  | "standard"
  | "extended"
  | "manual_review"
  | "unsupported"
  /** @deprecated use standard */
  | "in_area"
  /** @deprecated use unsupported */
  | "blocked";

export interface ServiceAreaAssessment {
  outcome: ServiceAreaOutcome;
  distanceFromBaseMiles: number;
  radiusMiles: number;
  inZipList: boolean;
  message: string;
  requiresReview: boolean;
  distanceMode?: "road" | "straight_line";
}

export function toLatLng(addr: Pick<VerifiedAddress, "lat" | "lng">): LatLng {
  return { lat: addr.lat, lng: addr.lng };
}

export function verifiedToJobStreet(addr: VerifiedAddress): string {
  return addr.line2 ? `${addr.line1}, ${addr.line2}` : addr.line1;
}

export function isAddressVerified(addr: VerifiedAddress | null | undefined): boolean {
  return (
    !!addr &&
    (addr.verificationStatus === "verified" || addr.verificationStatus === "manual_override") &&
    Boolean(addr.placeId) &&
    Number.isFinite(addr.lat) &&
    Number.isFinite(addr.lng)
  );
}

const PO_BOX_RE = /\bP\.?\s*O\.?\s*Box\b/i;
const STREET_NUMBER_RE = /^\s*\d+/;

export function looksLikePoBox(text: string): boolean {
  return PO_BOX_RE.test(text);
}

export function hasStreetNumber(line1: string): boolean {
  const t = line1.trim();
  // ZIP-only is not a street address
  if (/^\d{5}(-\d{4})?$/.test(t)) return false;
  return STREET_NUMBER_RE.test(t);
}

/** Normalize legacy outcomes to the production taxonomy. */
export function normalizeServiceAreaOutcome(outcome: ServiceAreaOutcome): ServiceAreaOutcome {
  if (outcome === "in_area") return "standard";
  if (outcome === "blocked") return "unsupported";
  return outcome;
}
