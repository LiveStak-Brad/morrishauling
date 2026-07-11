import { morrisConfig } from "@/lib/morris-config";
import type { VerifiedAddress, ServiceAreaAssessment, ServiceAreaOutcome } from "@/types/address";
import { defaultDistanceProvider } from "@/lib/distance";
import { routeDriving } from "@/lib/geo/route-driving";
import type { OperatingBase } from "@/types/company";

export function getPrimaryOperatingBase(): OperatingBase {
  return (
    morrisConfig.operatingBases.find((b) => b.isPrimary) ?? morrisConfig.operatingBases[0]
  );
}

/** Map legacy outcome aliases used in older UI checks. */
export function isExtendedServiceArea(outcome: ServiceAreaOutcome): boolean {
  return outcome === "extended" || outcome === "manual_review";
}

export function isUnsupportedServiceArea(outcome: ServiceAreaOutcome): boolean {
  return outcome === "unsupported" || outcome === "blocked";
}

function buildAssessment(params: {
  outcome: ServiceAreaOutcome;
  distanceFromBaseMiles: number;
  radiusMiles: number;
  inZipList: boolean;
  message: string;
  requiresReview: boolean;
  distanceMode: "road" | "straight_line";
}): ServiceAreaAssessment {
  return params;
}

/**
 * Classify a verified address relative to the primary operating base.
 * Prefer real road miles when available; fall back to straight-line only if routing fails
 * (still never invents placeholder miles for pricing — this gate is classification only).
 */
export async function assessServiceAreaAsync(
  addr: Pick<VerifiedAddress, "lat" | "lng" | "zip" | "country">,
  opts?: { radiusMiles?: number; zipCodes?: string[]; preferRoad?: boolean }
): Promise<ServiceAreaAssessment> {
  const base = getPrimaryOperatingBase();
  const radiusMiles = opts?.radiusMiles ?? morrisConfig.serviceArea.radiusMiles;
  const zipCodes = opts?.zipCodes ?? morrisConfig.serviceArea.zipCodes ?? [];
  const extendedCap = radiusMiles * 2.5;

  if (addr.country && addr.country.toUpperCase() !== "US" && addr.country.toUpperCase() !== "USA") {
    return buildAssessment({
      outcome: "unsupported",
      distanceFromBaseMiles: 0,
      radiusMiles,
      inZipList: false,
      message: "We currently only service addresses in the United States.",
      requiresReview: true,
      distanceMode: "straight_line",
    });
  }

  let distanceFromBaseMiles: number;
  let distanceMode: "road" | "straight_line" = "straight_line";

  if (opts?.preferRoad !== false) {
    try {
      const leg = await routeDriving(base.location, { lat: addr.lat, lng: addr.lng });
      distanceFromBaseMiles = Math.round(leg.distanceMiles * 10) / 10;
      distanceMode = "road";
    } catch {
      distanceFromBaseMiles =
        Math.round(
          defaultDistanceProvider.straightLineMiles(base.location, {
            lat: addr.lat,
            lng: addr.lng,
          }) * 10
        ) / 10;
      distanceMode = "straight_line";
    }
  } else {
    distanceFromBaseMiles =
      Math.round(
        defaultDistanceProvider.straightLineMiles(base.location, {
          lat: addr.lat,
          lng: addr.lng,
        }) * 10
      ) / 10;
  }

  const inZipList = zipCodes.length === 0 || zipCodes.includes(addr.zip.trim());
  const inRadius = distanceFromBaseMiles <= radiusMiles;

  if (inRadius || (inZipList && distanceFromBaseMiles <= extendedCap)) {
    if (inRadius) {
      return {
        outcome: "standard",
        distanceFromBaseMiles,
        radiusMiles,
        inZipList,
        message: "Address is within our standard service area.",
        requiresReview: false,
        distanceMode,
      };
    }
    // In ZIP list but beyond radius → extended with review
    return {
      outcome: "extended",
      distanceFromBaseMiles,
      radiusMiles,
      inZipList,
      message:
        "This address is in an extended service ZIP. You can still request service — additional travel charges or manager approval may apply.",
      requiresReview: true,
      distanceMode,
    };
  }

  if (distanceFromBaseMiles <= extendedCap) {
    return {
      outcome: "extended",
      distanceFromBaseMiles,
      radiusMiles,
      inZipList,
      message:
        "This address is outside our normal service area. You can still request service — additional travel charges or manager approval may apply.",
      requiresReview: true,
      distanceMode,
    };
  }

  if (distanceFromBaseMiles <= radiusMiles * 4) {
    return {
      outcome: "manual_review",
      distanceFromBaseMiles,
      radiusMiles,
      inZipList,
      message:
        "This address is far outside our usual coverage. Submit the request and a manager will review travel feasibility and pricing before confirming.",
      requiresReview: true,
      distanceMode,
    };
  }

  return {
    outcome: "unsupported",
    distanceFromBaseMiles,
    radiusMiles,
    inZipList,
    message:
      "This address is beyond the distance we can currently support. Please call Morris Services to discuss options.",
    requiresReview: true,
    distanceMode,
  };
}

/**
 * Sync wrapper used when road routing is not required (e.g. unit tests).
 * Prefer assessServiceAreaAsync in booking/API paths.
 */
export function assessServiceArea(
  addr: Pick<VerifiedAddress, "lat" | "lng" | "zip" | "country">,
  opts?: { radiusMiles?: number; zipCodes?: string[] }
): ServiceAreaAssessment {
  const base = getPrimaryOperatingBase();
  const radiusMiles = opts?.radiusMiles ?? morrisConfig.serviceArea.radiusMiles;
  const zipCodes = opts?.zipCodes ?? morrisConfig.serviceArea.zipCodes ?? [];
  const extendedCap = radiusMiles * 2.5;

  if (addr.country && addr.country.toUpperCase() !== "US" && addr.country.toUpperCase() !== "USA") {
    return {
      outcome: "unsupported",
      distanceFromBaseMiles: 0,
      radiusMiles,
      inZipList: false,
      message: "We currently only service addresses in the United States.",
      requiresReview: true,
      distanceMode: "straight_line",
    };
  }

  const distanceFromBaseMiles =
    Math.round(
      defaultDistanceProvider.straightLineMiles(base.location, {
        lat: addr.lat,
        lng: addr.lng,
      }) * 10
    ) / 10;

  const inZipList = zipCodes.length === 0 || zipCodes.includes(addr.zip.trim());
  const inRadius = distanceFromBaseMiles <= radiusMiles;

  if (inRadius) {
    return {
      outcome: "standard",
      distanceFromBaseMiles,
      radiusMiles,
      inZipList,
      message: "Address is within our standard service area.",
      requiresReview: false,
      distanceMode: "straight_line",
    };
  }

  if (inZipList || distanceFromBaseMiles <= extendedCap) {
    return {
      outcome: "extended",
      distanceFromBaseMiles,
      radiusMiles,
      inZipList,
      message:
        "This address is outside our normal service area. You can still request service — additional travel charges or manager approval may apply.",
      requiresReview: true,
      distanceMode: "straight_line",
    };
  }

  if (distanceFromBaseMiles <= radiusMiles * 4) {
    return {
      outcome: "manual_review",
      distanceFromBaseMiles,
      radiusMiles,
      inZipList,
      message:
        "This address is far outside our usual coverage. Submit the request and a manager will review travel feasibility and pricing before confirming.",
      requiresReview: true,
      distanceMode: "straight_line",
    };
  }

  return {
    outcome: "unsupported",
    distanceFromBaseMiles,
    radiusMiles,
    inZipList,
    message:
      "This address is beyond the distance we can currently support. Please call Morris Services to discuss options.",
    requiresReview: true,
    distanceMode: "straight_line",
  };
}
