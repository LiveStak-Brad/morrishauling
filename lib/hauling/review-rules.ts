import type { HaulingEstimateInput } from "@/lib/estimate/hauling-transport-engine";
import type { MorrisConfig } from "@/lib/morris-config";

export type HaulingReviewReason =
  | "weight_unknown"
  | "dimensions_incomplete"
  | "may_exceed_trailer_capacity"
  | "route_exceeds_limit"
  | "interstate_transport"
  | "specialized_loading_equipment"
  | "unsafe_access"
  | "permits_may_be_required"
  | "cdl_licensing_insurance_concern"
  | "hazardous_or_prohibited_mentioned"
  | "outside_service_area";

export type HaulingReviewResult = {
  reviewRequired: boolean;
  reasons: HaulingReviewReason[];
  messages: string[];
};

const HAZARDOUS_KEYWORDS = [
  "hazard",
  "hazmat",
  "chemical",
  "fuel",
  "propane",
  "asbestos",
  "paint",
  "solvent",
  "explosive",
  "battery acid",
  "pesticide",
];

const DEFAULT_MAX_ROUTE_MILES = 180;
const DEFAULT_MAX_WEIGHT_LBS = 12000;

/**
 * Safety / capacity review gate for Morris Hauling.
 * Never auto-approves work that may exceed truck, trailer, insurance, or legal limits.
 */
export function evaluateHaulingReview(
  input: HaulingEstimateInput & {
    totalTravelMiles?: number;
    pickupState?: string;
    deliveryState?: string;
    accessNotes?: string;
    outsideServiceArea?: boolean;
  },
  config: MorrisConfig,
  opts?: { maxRouteMiles?: number; maxWeightLbs?: number }
): HaulingReviewResult {
  const reasons: HaulingReviewReason[] = [];
  const messages: string[] = [];
  const maxRoute = opts?.maxRouteMiles ?? DEFAULT_MAX_ROUTE_MILES;
  const maxWeight = opts?.maxWeightLbs ?? DEFAULT_MAX_WEIGHT_LBS;

  if (input.outsideServiceArea) {
    reasons.push("outside_service_area");
    messages.push(
      "Pickup or delivery is outside the normal service area — additional travel charges or approval may apply."
    );
  }

  if (input.estimatedWeightLbs == null || input.estimatedWeightLbs <= 0) {
    reasons.push("weight_unknown");
    messages.push("Estimated weight is unknown — load review required.");
  }

  const dimsMissing =
    input.lengthFt == null ||
    input.widthFt == null ||
    input.heightFt == null ||
    (input.lengthFt ?? 0) <= 0 ||
    (input.widthFt ?? 0) <= 0 ||
    (input.heightFt ?? 0) <= 0;
  if (dimsMissing) {
    reasons.push("dimensions_incomplete");
    messages.push("Load dimensions are incomplete.");
  }

  const weight = input.estimatedWeightLbs ?? 0;
  if (weight > 0 && weight > maxWeight * 0.9) {
    reasons.push("may_exceed_trailer_capacity");
    messages.push("Load may exceed configured trailer capacity.");
  }
  if (weight > maxWeight) {
    reasons.push("cdl_licensing_insurance_concern");
    messages.push("Weight may trigger CDL, licensing, or insurance review.");
  }

  const miles = input.totalTravelMiles ?? 0;
  if (miles > maxRoute) {
    reasons.push("route_exceeds_limit");
    messages.push(`Route length (${miles} mi) exceeds configured limit (${maxRoute} mi).`);
  }

  const pState = (input.pickupState || input.pickup.state || "").toUpperCase();
  const dState = (input.deliveryState || input.delivery.state || "").toUpperCase();
  if (pState && dState && pState !== dState) {
    reasons.push("interstate_transport");
    messages.push("Interstate transport requires manual review.");
  }

  if (input.needsWinch || input.needsLoadingHelp) {
    reasons.push("specialized_loading_equipment");
    messages.push("Specialized loading assistance or winch may be required.");
  }

  const access = `${input.accessNotes ?? ""} ${input.cargoDescription ?? ""}`.toLowerCase();
  if (
    access.includes("uneven") ||
    access.includes("soft ground") ||
    access.includes("steep") ||
    access.includes("no access") ||
    access.includes("unsafe")
  ) {
    reasons.push("unsafe_access");
    messages.push("Access notes suggest possible unsafe conditions.");
  }

  if (access.includes("permit") || access.includes("oversize") || access.includes("overweight")) {
    reasons.push("permits_may_be_required");
    messages.push("Load may require permits.");
  }

  if (HAZARDOUS_KEYWORDS.some((k) => access.includes(k))) {
    reasons.push("hazardous_or_prohibited_mentioned");
    messages.push("Description may involve hazardous or prohibited materials.");
  }

  return {
    reviewRequired: reasons.length > 0,
    reasons: [...new Set(reasons)],
    messages,
  };
}
