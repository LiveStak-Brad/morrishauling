import { getCommonJunkItem } from "@/lib/common-junk-items";
import type { JunkRemovalEstimateInput, JunkRemovalEstimateResult } from "@/lib/estimate/junk-removal-engine";
import type { MorrisConfig } from "@/lib/morris-config";
import { DISPOSAL_CATEGORY_LABELS } from "@/types/disposal";

const FREON_CATEGORIES = new Set(["freon_appliance", "appliance"]);
const APPLIANCE_ITEM_IDS = new Set([
  "refrigerator",
  "freezer",
  "washer",
  "dryer",
  "stove",
  "dishwasher",
  "water_heater",
]);

/** Customer-facing travel steps — no internal base/routing language. */
export function buildTransportationBreakdownSteps(_originCity?: string): string[] {
  return [
    "Travel to your property",
    "On-site loading and removal",
    "Transportation of collected items",
    "Responsible disposal or recycling",
    "Return travel",
  ];
}

export interface PriceFactor {
  id: string;
  label: string;
  /** Staff-only detail */
  detail?: string;
}

export function buildPriceFactors(
  input: JunkRemovalEstimateInput,
  result: JunkRemovalEstimateResult,
  config: MorrisConfig
): PriceFactor[] {
  const p = config.junkRemovalPricing;
  const factors: PriceFactor[] = [];
  const route = result.route;

  const longTravelThreshold = p.longRoutePriceFactorMiles ?? 55;
  if (route.totalRouteMiles >= longTravelThreshold) {
    factors.push({
      id: "long_travel",
      label: "Extended travel distance to your property",
      detail: `${route.totalRouteMiles} mi total route from ${route.originBaseName}`,
    });
  }

  if (
    FREON_CATEGORIES.has(route.disposalCategory) ||
    input.selectedItems?.some((s) => {
      const cfg = getCommonJunkItem(s.itemId);
      return cfg?.disposalCategory === "freon_appliance" || cfg?.specialDisposal;
    })
  ) {
    factors.push({
      id: "freon_disposal",
      label: "Freon or special appliance recycling required",
      detail: DISPOSAL_CATEGORY_LABELS[route.disposalCategory],
    });
  }

  const applianceCount =
    input.selectedItems?.reduce((n, s) => {
      if (APPLIANCE_ITEM_IDS.has(s.itemId)) return n + s.quantity;
      return n;
    }, 0) ?? 0;

  if (applianceCount >= 2) {
    factors.push({
      id: "multiple_appliances",
      label: `${applianceCount} appliances on this pickup`,
      detail: "Multiple items increase load, labor, and disposal handling",
    });
  } else if (applianceCount === 1) {
    const heavyAppliance = input.selectedItems?.some((s) => getCommonJunkItem(s.itemId)?.heavy);
    if (heavyAppliance) {
      factors.push({
        id: "heavy_appliance",
        label: "Heavy appliance handling included",
      });
    }
  }

  const access = input.accessDetails;
  const flights = access.stairFlights ?? (access.stairs ? 1 : 0);
  if (flights > 0) {
    factors.push({ id: "stairs", label: "Stairs or elevated access" });
  }
  if (access.basement) factors.push({ id: "basement", label: "Basement pickup" });
  if ((access.longCarryFt ?? 0) >= p.longCarryFeeThresholdFt) {
    factors.push({ id: "long_carry", label: "Long carry from truck to items" });
  }
  if (access.tightAccess) factors.push({ id: "tight_access", label: "Tight or difficult access" });

  const priority = input.priorityLevel ?? "standard";
  if (priority === "same_day") factors.push({ id: "same_day", label: "Same-day scheduling" });
  if (priority === "emergency") factors.push({ id: "emergency", label: "Emergency / ASAP scheduling" });

  if (result.trailerPercent >= 50 && input.mode === "cleanout") {
    factors.push({
      id: "large_load",
      label: "Large volume load",
      detail: `~${result.trailerPercent}% trailer`,
    });
  }

  if (result.reviewRequired) {
    factors.push({
      id: "human_review",
      label: "Human review required before final quote",
    });
  }

  if (result.total >= p.reviewRequiredThreshold) {
    factors.push({
      id: "high_total",
      label: "Complex job — estimate above typical quick-pickup range",
      detail: `Total $${result.total}`,
    });
  }

  return factors;
}

export function priceFactorsToCustomerLabels(factors: PriceFactor[]): string[] {
  return factors.map((f) => f.label);
}
