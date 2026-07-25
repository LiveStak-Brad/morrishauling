import type { ScrapItemType, ScrapWizardItem, WeightBand } from "@/lib/scrap-fridays/types";
import { WEIGHT_BAND_MIDPOINTS } from "@/lib/scrap-fridays/types";

export type ScrapEstimateSummary = {
  estimatedWeightLb: number;
  estimatedVolumeCuft: number;
  estimatedStopMinutes: number;
  routeUnits: number;
  difficultyScore: number;
  suggestedCrewCount: number;
  suggestedEquipment: string[];
  manualReviewFlags: string[];
  batteryCount: number;
};

function weightForItem(item: ScrapWizardItem, catalog: ScrapItemType): number {
  if (typeof item.customerWeightLb === "number" && item.customerWeightLb > 0) {
    return item.customerWeightLb * item.quantity;
  }
  const band = item.weightBand as WeightBand;
  const mid = WEIGHT_BAND_MIDPOINTS[band];
  if (mid != null) return mid * item.quantity;
  return catalog.default_weight_lb * item.quantity;
}

export function estimateScrapRequest(
  items: ScrapWizardItem[],
  catalogById: Map<string, ScrapItemType>
): ScrapEstimateSummary {
  let estimatedWeightLb = 0;
  let estimatedVolumeCuft = 0;
  let estimatedStopMinutes = 12; // base arrive/depart
  let routeUnits = 0;
  let difficultyScore = 0;
  let suggestedCrewCount = 2;
  const equipment = new Set<string>();
  const flags: string[] = [];
  let batteryCount = 0;

  for (const item of items) {
    const cat = catalogById.get(item.itemTypeId);
    if (!cat) {
      flags.push(`Unknown item type: ${item.itemTypeId}`);
      continue;
    }
    const w = weightForItem(item, cat);
    estimatedWeightLb += w;
    estimatedVolumeCuft += cat.default_volume_cuft * item.quantity;
    estimatedStopMinutes += cat.default_stop_minutes * Math.max(1, Math.ceil(item.quantity / 2));
    routeUnits += cat.default_route_units * Math.max(1, Math.ceil(item.quantity / 2));
    suggestedCrewCount = Math.max(suggestedCrewCount, cat.default_crew_count);
    for (const e of cat.default_equipment ?? []) equipment.add(e);

    const rules = cat.eligibility_rules ?? {};
    if (rules.battery) {
      batteryCount += item.quantity;
      if (item.answers.intact !== true) {
        flags.push(`${cat.name}: battery must be intact and undamaged`);
        difficultyScore += 3;
      }
    }
    if (rules.requiresEmpty && item.answers.empty !== true) {
      flags.push(`${cat.name}: must be empty before pickup`);
      difficultyScore += 2;
    }
    if (rules.safe) {
      if (item.answers.bolted === true) {
        flags.push(`${cat.name}: bolted/attached — not eligible for free pickup`);
        difficultyScore += 5;
      }
      if (item.answers.unlocked !== true) {
        flags.push(`${cat.name}: locked or unknown contents — manual review`);
        difficultyScore += 3;
      }
      if (rules.manualReview) flags.push(`${cat.name}: flagged for manual review`);
    }
    if (rules.manualReview) {
      flags.push(`${cat.name}: manual review recommended`);
      difficultyScore += 2;
    }
    if (item.unusuallyHeavy) {
      flags.push(`${cat.name}: customer marked unusually heavy`);
      difficultyScore += 2;
      equipment.add("additional_crew");
      suggestedCrewCount = Math.max(suggestedCrewCount, 3);
      routeUnits += 1;
    }
    if (item.sizeClass === "larger_than_pickup" || item.sizeClass === "large" || item.sizeClass === "large_commercial") {
      difficultyScore += 2;
      routeUnits += 1;
      flags.push(`${cat.name}: large size class`);
    }
    if (w / Math.max(item.quantity, 1) >= 400) {
      difficultyScore += 1;
      equipment.add("appliance_dolly");
    }
  }

  if (items.length >= 6) {
    routeUnits += 1;
    difficultyScore += 1;
  }
  if (estimatedWeightLb >= 700) {
    routeUnits = Math.max(routeUnits, 5);
    difficultyScore += 2;
    equipment.add("trailer");
  } else if (estimatedWeightLb >= 300) {
    routeUnits = Math.max(routeUnits, 3);
  }

  return {
    estimatedWeightLb: Math.round(estimatedWeightLb),
    estimatedVolumeCuft: Math.round(estimatedVolumeCuft * 10) / 10,
    estimatedStopMinutes: Math.min(180, Math.round(estimatedStopMinutes)),
    routeUnits: Math.round(routeUnits * 10) / 10,
    difficultyScore,
    suggestedCrewCount,
    suggestedEquipment: Array.from(equipment),
    manualReviewFlags: Array.from(new Set(flags)),
    batteryCount,
  };
}

export type RouteCapacityLimits = {
  maxRouteUnits: number;
  maxWeightLb: number;
  maxVolumeCuft: number;
  maxLaborMinutes: number;
};

export type RouteCapacityUsage = {
  routeUnits: number;
  weightLb: number;
  volumeCuft: number;
  laborMinutes: number;
  difficultStops: number;
};

export function summarizeRouteCapacity(
  stops: Array<{
    routeUnits?: number;
    estimatedWeightLb?: number;
    estimatedVolumeCuft?: number;
    estimatedStopMinutes?: number;
    difficultyScore?: number;
  }>
): RouteCapacityUsage {
  return {
    routeUnits: stops.reduce((a, s) => a + Number(s.routeUnits ?? 0), 0),
    weightLb: stops.reduce((a, s) => a + Number(s.estimatedWeightLb ?? 0), 0),
    volumeCuft: stops.reduce((a, s) => a + Number(s.estimatedVolumeCuft ?? 0), 0),
    laborMinutes: stops.reduce((a, s) => a + Number(s.estimatedStopMinutes ?? 0), 0),
    difficultStops: stops.filter((s) => Number(s.difficultyScore ?? 0) >= 5).length,
  };
}

export function routeCapacityWarnings(
  usage: RouteCapacityUsage,
  limits: RouteCapacityLimits
): string[] {
  const warnings: string[] = [];
  if (usage.routeUnits > limits.maxRouteUnits) {
    warnings.push(`Route units ${usage.routeUnits} exceed max ${limits.maxRouteUnits}`);
  }
  if (usage.weightLb > limits.maxWeightLb) {
    warnings.push(`Estimated weight ${usage.weightLb} lb exceeds max ${limits.maxWeightLb} lb`);
  }
  if (usage.volumeCuft > limits.maxVolumeCuft) {
    warnings.push(`Estimated volume ${usage.volumeCuft} cuft exceeds max ${limits.maxVolumeCuft}`);
  }
  if (usage.laborMinutes > limits.maxLaborMinutes) {
    warnings.push(
      `Labor minutes ${usage.laborMinutes} exceed max ${limits.maxLaborMinutes}`
    );
  }
  return warnings;
}

export function validateWizardItems(
  items: ScrapWizardItem[],
  catalogById: Map<string, ScrapItemType>
): string[] {
  const errors: string[] = [];
  if (items.length === 0) errors.push("Add at least one scrap item.");
  for (const item of items) {
    const cat = catalogById.get(item.itemTypeId);
    if (!cat) {
      errors.push("One or more items are invalid.");
      continue;
    }
    if (item.quantity < 1) errors.push(`${cat.name}: quantity must be at least 1.`);
    const rules = cat.eligibility_rules ?? {};
    if (rules.battery && item.answers.intact !== true) {
      errors.push(`${cat.name}: confirm the battery is intact and undamaged.`);
    }
    if (rules.requiresEmpty && item.answers.empty !== true) {
      errors.push(`${cat.name}: confirm the appliance is empty.`);
    }
    if (rules.safe && item.answers.bolted === true) {
      errors.push(`${cat.name}: bolted safes are not eligible for free pickup.`);
    }
    for (const q of cat.customer_questions ?? []) {
      if (q.required && (item.answers[q.key] === undefined || item.answers[q.key] === "")) {
        errors.push(`${cat.name}: ${q.label} is required.`);
      }
    }
  }
  return errors;
}
