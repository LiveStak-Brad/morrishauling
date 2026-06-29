import type { CompanyConfig, LatLng } from "@/types";
import type {
  AccessDetails,
  Estimate,
  EstimateModifier,
  EstimateWarning,
  JunkItem,
  LoadSizeTier,
} from "@/types/job";
import { LOAD_SIZE_TRAILER_PERCENT } from "@/types/job";

export interface EstimateInput {
  loadSizeTier: LoadSizeTier;
  accessDetails: AccessDetails;
  items: JunkItem[];
  addressLocation?: LatLng;
}

export interface EstimateResult {
  subtotal: number;
  modifiers: EstimateModifier[];
  total: number;
  trailerPercent: number;
  warnings: EstimateWarning[];
}

export interface EstimateEngine {
  calculate(input: EstimateInput, company: CompanyConfig): EstimateResult;
  validateServiceArea(location: LatLng, company: CompanyConfig): boolean;
  buildEstimate(input: EstimateInput, company: CompanyConfig, jobId: string, disclaimerAccepted: boolean): Estimate;
}

function haversineMiles(a: LatLng, b: LatLng): number {
  const R = 3958.8;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function getModifierAmount(
  modifierId: string,
  company: CompanyConfig,
  subtotal: number
): number {
  const mod = company.pricingRules.modifiers.find((m) => m.id === modifierId);
  if (!mod) return 0;
  if (mod.type === "percent") return Math.round(subtotal * (mod.amount / 100));
  return mod.amount;
}

export class DefaultEstimateEngine implements EstimateEngine {
  validateServiceArea(location: LatLng, company: CompanyConfig): boolean {
    const dist = haversineMiles(location, company.serviceArea.center);
    return dist <= company.serviceArea.radiusMiles;
  }

  calculate(input: EstimateInput, company: CompanyConfig): EstimateResult {
    const trailerPercent = LOAD_SIZE_TRAILER_PERCENT[input.loadSizeTier];
    const tier = company.pricingRules.loadTiers.find(
      (t) => t.tier === input.loadSizeTier
    );
    const subtotal = tier?.basePrice ?? company.pricingRules.minCharge;

    const modifiers: EstimateModifier[] = [];
    const warnings: EstimateWarning[] = [];
    const { accessDetails, items, addressLocation } = input;

    if (accessDetails.stairs) {
      modifiers.push({ id: "stairs", label: "Stairs", amount: getModifierAmount("stairs", company, subtotal) });
      warnings.push("stairs_access");
    }
    if (accessDetails.elevator) {
      modifiers.push({ id: "elevator", label: "Elevator access", amount: getModifierAmount("elevator", company, subtotal) });
    }
    if (accessDetails.longCarryFt >= 50) {
      modifiers.push({ id: "long_carry", label: "Long carry (50+ ft)", amount: getModifierAmount("long_carry", company, subtotal) });
      warnings.push("long_carry");
    }
    if (accessDetails.basement) {
      modifiers.push({ id: "basement", label: "Basement", amount: getModifierAmount("basement", company, subtotal) });
    }
    if (accessDetails.attic) {
      modifiers.push({ id: "attic", label: "Attic", amount: getModifierAmount("attic", company, subtotal) });
    }
    if (accessDetails.tightAccess) {
      modifiers.push({ id: "tight_access", label: "Tight access", amount: getModifierAmount("tight_access", company, subtotal) });
    }
    if (accessDetails.heavyItems) {
      modifiers.push({ id: "heavy_items", label: "Heavy items", amount: getModifierAmount("heavy_items", company, subtotal) });
      warnings.push("heavy_load");
    }
    if (accessDetails.specialDisposal) {
      modifiers.push({ id: "special_disposal", label: "Special disposal", amount: getModifierAmount("special_disposal", company, subtotal) });
      warnings.push("special_disposal");
    }

    if (items.length > 3 && company.pricingRules.itemSurcharge) {
      const extra = (items.length - 3) * company.pricingRules.itemSurcharge;
      modifiers.push({ id: "extra_items", label: "Additional items", amount: extra });
    }

    if (
      accessDetails.stairs ||
      accessDetails.heavyItems ||
      accessDetails.specialDisposal ||
      accessDetails.longCarryFt >= 50
    ) {
      warnings.push("price_may_need_adjustment");
    }

    if (addressLocation && !this.validateServiceArea(addressLocation, company)) {
      warnings.push("outside_service_area");
    }

    const modifierTotal = modifiers.reduce((sum, m) => sum + m.amount, 0);
    const total = Math.max(company.pricingRules.minCharge, subtotal + modifierTotal);

    return { subtotal, modifiers, total, trailerPercent, warnings: [...new Set(warnings)] };
  }

  buildEstimate(
    input: EstimateInput,
    company: CompanyConfig,
    jobId: string,
    disclaimerAccepted: boolean
  ): Estimate {
    const result = this.calculate(input, company);
    return {
      id: `est-${jobId}`,
      jobId,
      subtotal: result.subtotal,
      modifiers: result.modifiers,
      total: result.total,
      trailerPercent: result.trailerPercent,
      disclaimerAccepted,
      createdAt: new Date().toISOString(),
    };
  }
}

export const estimateEngine = new DefaultEstimateEngine();
