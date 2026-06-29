import type { MorrisConfig } from "@/lib/morris-config";
import { getCommonJunkItem } from "@/lib/common-junk-items";
import { buildJunkRemovalLineLabel } from "@/lib/estimate/junk-customer-labels";
import { calculateJunkRouteCost } from "@/lib/disposal/junk-route-costing";
import type { DistanceProvider } from "@/lib/distance";
import { defaultDistanceProvider } from "@/lib/distance";
import {
  approximateCustomerLocation,
  detectHazardousKeywords,
  estimateDisposalFee,
  resolveDisposalCategory,
  selectDisposalSite,
  type DisposalCategory,
  type EnhancedDumpSite,
} from "@/lib/disposal/disposal-routing";
import { selectOptimalOperatingBase } from "@/lib/disposal/operating-base-selection";
import {
  buildPriceFactors,
  buildTransportationBreakdownSteps,
  type PriceFactor,
} from "@/lib/estimate/junk-estimate-explainers";
import type {
  JunkEstimateMode,
  JunkInternalProfit,
  JunkPriorityLevel,
  JunkRouteSummary,
  SelectedCommonItem,
  EstimateReviewStatus,
} from "@/types/junk-removal";
import type {
  AccessDetails,
  EstimateModifier,
  EstimateWarning,
  JunkItem,
  LoadSizeTier,
  PricingBreakdownLine,
} from "@/types/job";
import { LOAD_SIZE_TRAILER_PERCENT } from "@/types/job";
import type { LatLng } from "@/types";

export interface JunkRemovalEstimateInput {
  mode: JunkEstimateMode;
  selectedItems?: SelectedCommonItem[];
  loadSizeTier?: LoadSizeTier;
  junkCategory?: string;
  accessDetails: AccessDetails;
  items?: JunkItem[];
  addressLocation?: LatLng;
  zip?: string;
  priorityLevel?: JunkPriorityLevel;
  hasPhotos?: boolean;
  customerNotes?: string;
  /** Admin override — force dispatch from a specific operating base */
  originBaseId?: string;
  /** Selected schedule slot — flexible discount applied in engine */
  scheduleSlot?: {
    id: string;
    windowLabel: string;
    discountAmount: number;
    discountReason?: string;
  };
}

export interface JunkRemovalEstimateResult {
  customerLines: PricingBreakdownLine[];
  internalLines: PricingBreakdownLine[];
  total: number;
  subtotal: number;
  modifiers: EstimateModifier[];
  lines: PricingBreakdownLine[];
  trailerPercent: number;
  estimatedLaborMinutes: number;
  estimatedCrewSize: number;
  mileageEstimate: number;
  dumpFeeEstimate: number;
  fuelAdjustment: number;
  reviewRequired: boolean;
  reviewReasons: string[];
  reviewStatus: EstimateReviewStatus;
  confidence: "high" | "medium" | "low";
  internalProfit: JunkInternalProfit;
  route: JunkRouteSummary;
  warnings: EstimateWarning[];
  priceFactors: PriceFactor[];
  transportationBreakdown: string[];
}

const UNCERTAINTY_KEYWORDS = [
  "not sure",
  "maybe",
  "approximately",
  "roughly",
  "unknown",
  "idk",
  "don't know",
  "unsure",
  "estimate",
  "lot of",
  "tons of",
  "full of",
];

function computeInternalProfit(
  revenue: number,
  config: MorrisConfig,
  ctx: {
    route: ReturnType<typeof calculateJunkRouteCost>;
    onsitePayrollCost: number;
    dumpFeeEstimate: number;
  }
): JunkInternalProfit {
  const p = config.junkRemovalPricing;
  const fuelCost = ctx.route.internalFuelCost;
  const payrollCost = ctx.route.internalDriveLaborCost + ctx.onsitePayrollCost;
  const dumpCost = Math.round(ctx.dumpFeeEstimate * p.internalDumpCostRate);
  const truckOperatingCost = ctx.route.internalTruckOperatingCost;
  const trailerOperatingCost = ctx.route.internalTrailerOperatingCost;
  const overheadCost = p.internalOverheadFlat;
  const creditCardProcessingCost = Math.round(revenue * p.internalCreditCardProcessingRate);
  const totalOperatingCost =
    fuelCost +
    payrollCost +
    dumpCost +
    truckOperatingCost +
    trailerOperatingCost +
    overheadCost +
    creditCardProcessingCost;
  const grossProfit = revenue - totalOperatingCost;
  const profitMargin = revenue > 0 ? Math.round((grossProfit / revenue) * 1000) / 10 : 0;

  return {
    revenue,
    fuelCost,
    payrollCost,
    dumpCost,
    truckOperatingCost,
    trailerOperatingCost,
    overheadCost,
    creditCardProcessingCost,
    totalOperatingCost,
    grossProfit,
    profitMargin,
  };
}

export function evaluateReviewRequired(
  input: JunkRemovalEstimateInput,
  config: MorrisConfig,
  ctx: {
    total: number;
    trailerPercent: number;
    heavyItems: boolean;
    specialDisposal: boolean;
    confidence: "high" | "medium" | "low";
    profitMargin: number;
    route: JunkRouteSummary;
    disposalUncertain: boolean;
    distanceUnavailable: boolean;
    unknownCategory: boolean;
  }
): { reviewRequired: boolean; reviewReasons: string[] } {
  const p = config.junkRemovalPricing;
  const reasons: string[] = [];

  if (input.hasPhotos) reasons.push("Photos uploaded — visual review requested");
  if (input.junkCategory === "other") reasons.push("Custom / other category selected");
  if (ctx.unknownCategory) reasons.push("Item category unknown");
  if (ctx.total >= p.reviewRequiredThreshold) reasons.push(`Estimate exceeds $${p.reviewRequiredThreshold}`);
  if (ctx.trailerPercent >= 75) reasons.push("Large load (75%+ trailer)");
  if (input.junkCategory === "hottub") reasons.push("Hot tub removal");
  if (input.junkCategory === "construction") reasons.push("Construction debris");
  if (ctx.heavyItems) reasons.push("Heavy items flagged");
  if (ctx.specialDisposal) reasons.push("Special disposal required");
  if (ctx.disposalUncertain) reasons.push("Disposal site uncertain");
  if (ctx.distanceUnavailable) reasons.push("Distance estimate unavailable");
  if (ctx.route.totalRouteMiles >= p.reviewRouteMilesThreshold) {
    reasons.push(`Long route (${ctx.route.totalRouteMiles} mi total)`);
  }
  if (ctx.profitMargin < p.minimumMarginTarget && ctx.profitMargin > 0) {
    reasons.push(`Estimated margin below ${p.minimumMarginTarget}% target`);
  }

  const notes = (input.customerNotes ?? input.accessDetails.notes ?? "").toLowerCase();
  if (detectHazardousKeywords(notes)) reasons.push("Possible hazardous/restricted material mentioned");
  if (UNCERTAINTY_KEYWORDS.some((k) => notes.includes(k))) {
    reasons.push("Customer notes indicate uncertainty");
  }

  const longCarry = input.accessDetails.longCarryFt ?? 0;
  if (longCarry > p.longCarryFeeThresholdFt) reasons.push(`Long carry (${longCarry} ft)`);

  const flights = input.accessDetails.stairFlights ?? (input.accessDetails.stairs ? 1 : 0);
  if (flights > 1) reasons.push(`${flights} flights of stairs`);

  if (input.mode === "single_item" && input.selectedItems?.length) {
    for (const sel of input.selectedItems) {
      if (sel.itemId === "other") reasons.push("Other / custom item selected");
      if (["hot_tub", "piano", "safe"].includes(sel.itemId)) {
        reasons.push(`${getCommonJunkItem(sel.itemId)?.name ?? sel.itemId} selected`);
      }
    }
  }

  if (ctx.confidence === "low") reasons.push("Low estimate confidence");

  return {
    reviewRequired: reasons.length > 0,
    reviewReasons: [...new Set(reasons)],
  };
}

export class JunkRemovalEstimateEngine {
  validateServiceArea(location: LatLng, config: MorrisConfig): boolean {
    const base = config.operatingBases.find((b) => b.isPrimary)!;
    const R = 3958.8;
    const dLat = ((location.lat - base.location.lat) * Math.PI) / 180;
    const dLng = ((location.lng - base.location.lng) * Math.PI) / 180;
    const lat1 = (base.location.lat * Math.PI) / 180;
    const lat2 = (location.lat * Math.PI) / 180;
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    const dist = R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
    return dist <= config.serviceArea.radiusMiles;
  }

  calculate(
    input: JunkRemovalEstimateInput,
    config: MorrisConfig,
    distanceProvider: DistanceProvider = defaultDistanceProvider
  ): JunkRemovalEstimateResult {
    const p = config.junkRemovalPricing;
    const warnings: EstimateWarning[] = [];
    const minimumsApplied: string[] = [];

    let trailerPercent = 0;
    let estimatedLaborMinutes = p.minimumLaborMinutes;
    let estimatedCrewSize = 2;
    let heavyItems = input.accessDetails.heavyItems;
    let specialDisposal = input.accessDetails.specialDisposal;
    let confidence: "high" | "medium" | "low" = "high";
    let junkRemovalAmount = 0;
    let itemCount = 0;
    const itemDisposalCategories: DisposalCategory[] = [];
    let unknownCategory = false;

    if (input.mode === "single_item" && input.selectedItems?.length) {
      for (const sel of input.selectedItems) {
        const cfg = getCommonJunkItem(sel.itemId);
        if (!cfg) {
          unknownCategory = true;
          continue;
        }
        const qty = sel.quantity || 1;
        itemCount += qty;
        junkRemovalAmount += cfg.basePrice * qty;
        estimatedLaborMinutes += cfg.laborMinutes * qty;
        trailerPercent += cfg.loadPercentage * qty;
        estimatedCrewSize = Math.max(estimatedCrewSize, cfg.crewSize);
        itemDisposalCategories.push(cfg.disposalCategory);
        if (cfg.heavy) heavyItems = true;
        if (cfg.specialDisposal) specialDisposal = true;
      }
      trailerPercent = Math.min(150, trailerPercent);
      if (input.selectedItems.some((s) => s.itemId === "other")) {
        confidence = "low";
        unknownCategory = true;
      }
    } else {
      const tier = input.loadSizeTier ?? "quarter_25";
      trailerPercent = LOAD_SIZE_TRAILER_PERCENT[tier];
      const loadTier = config.pricingRules.loadTiers.find((t) => t.tier === tier);
      junkRemovalAmount = loadTier?.basePrice ?? p.baseServiceFee;
      estimatedLaborMinutes = Math.max(p.minimumLaborMinutes, Math.round(30 + trailerPercent * 1.2));
      estimatedCrewSize = trailerPercent >= 75 ? 3 : trailerPercent >= 50 ? 2 : 2;
      const listedItems = input.items?.filter((i) => i.name.trim()) ?? [];
      itemCount = Math.max(1, listedItems.reduce((s, i) => s + i.quantity, 0));
      const itemSurcharge = config.pricingRules.itemSurcharge ?? 0;
      if (itemSurcharge > 0 && listedItems.length > 0) {
        junkRemovalAmount += listedItems.reduce((s, i) => s + itemSurcharge * i.quantity, 0);
      }
      if (trailerPercent >= 75) confidence = "medium";
    }

    estimatedLaborMinutes = Math.max(p.minimumLaborMinutes, estimatedLaborMinutes);

    const disposalCategory = resolveDisposalCategory({
      mode: input.mode,
      selectedItemIds: input.selectedItems?.map((s) => s.itemId),
      junkCategory: input.junkCategory,
      itemDisposalCategories,
    });

    const distanceUnavailable = !input.addressLocation && !input.zip;
    if (distanceUnavailable) confidence = "low";

    const fallbackBase =
      config.operatingBases.find((b) => b.isPrimary) ?? config.operatingBases[0];
    const customerLoc =
      input.addressLocation ?? approximateCustomerLocation(input.zip, fallbackBase);

    const disposalPick = selectDisposalSite(
      config.dumpSites as EnhancedDumpSite[],
      disposalCategory,
      customerLoc,
      distanceProvider
    );

    disposalPick.estimatedFee = estimateDisposalFee(disposalPick.site, {
      loadPercent: trailerPercent,
      itemCount,
      category: disposalCategory,
    });

    const routeCost = calculateJunkRouteCost(
      config,
      {
        customerLocation: input.addressLocation,
        zip: input.zip,
        disposal: disposalPick,
        originBaseId: input.originBaseId,
      },
      distanceProvider
    );

    let dumpFeeEstimate = Math.max(p.minimumDisposalFee, disposalPick.estimatedFee);

    const onsiteHours = estimatedLaborMinutes / 60;
    const leadLabor = Math.round(onsiteHours * p.laborHourlyRate);
    const helperLabor =
      estimatedCrewSize > 1
        ? Math.round((onsiteHours * (estimatedCrewSize - 1) * p.helperHourlyRate) / 2)
        : 0;
    junkRemovalAmount += leadLabor + helperLabor;

    const accessFees: PricingBreakdownLine[] = [];
    const flights = input.accessDetails.stairFlights ?? (input.accessDetails.stairs ? 1 : 0);
    if (flights > 0) {
      accessFees.push({ id: "stairs", label: "Stairs / access", amount: flights * p.stairsFeePerFlight });
      warnings.push("stairs_access");
    }
    if (input.accessDetails.basement) accessFees.push({ id: "basement", label: "Basement access", amount: 40 });
    if (input.accessDetails.attic) accessFees.push({ id: "attic", label: "Attic access", amount: 60 });
    if (input.accessDetails.tightAccess) accessFees.push({ id: "tight", label: "Tight access", amount: 50 });

    const longCarry = input.accessDetails.longCarryFt ?? 0;
    if (longCarry >= p.longCarryFeeThresholdFt) {
      accessFees.push({ id: "long_carry", label: "Long carry distance", amount: p.longCarryFee });
      warnings.push("long_carry");
    }
    if (heavyItems) {
      accessFees.push({ id: "heavy", label: "Heavy item handling", amount: p.heavyItemFee });
      warnings.push("heavy_load");
    }
    if (specialDisposal) {
      accessFees.push({ id: "special_disposal", label: "Special disposal handling", amount: p.specialDisposalFee });
      warnings.push("special_disposal");
    }

    const accessTotal = accessFees.reduce((s, l) => s + l.amount, 0);

    let priorityFee = 0;
    const priority = input.priorityLevel ?? "standard";
    if (priority === "same_day") priorityFee = p.sameDayFee;
    else if (priority === "emergency") priorityFee = p.emergencyFee;

    const serviceCall = p.baseServiceFee;
    const transportation = routeCost.customerTransportationCharge;
    const fuelAdjustment = Math.max(
      p.minimumFuelFee,
      Math.round(routeCost.totalRouteMiles * p.fuelAdjustmentRate)
    );

    let total =
      serviceCall +
      junkRemovalAmount +
      transportation +
      dumpFeeEstimate +
      accessTotal +
      priorityFee;

    const minPrice =
      input.mode === "single_item" ? p.minimumSingleItemPickup : p.minimumJobPrice;
    if (total < minPrice) {
      minimumsApplied.push("Minimum job price applied");
      total = minPrice;
    }

    const requestedDiscount = input.scheduleSlot?.discountAmount ?? 0;
    let flexibleDiscount = 0;
    if (requestedDiscount > 0) {
      const beforeDiscount = total;
      total = Math.max(minPrice, total - requestedDiscount);
      flexibleDiscount = beforeDiscount - total;
    }

    const onsitePayrollCost = Math.round((leadLabor + helperLabor) * p.internalPayrollCostRate);
    const internalProfit = computeInternalProfit(total, config, {
      route: routeCost,
      onsitePayrollCost,
      dumpFeeEstimate,
    });

    const route: JunkRouteSummary = {
      originBaseId: routeCost.originBase.id,
      originBaseName: routeCost.originBase.name,
      originBaseCity: routeCost.originBase.city,
      selectedDisposalSiteId: disposalPick.site.id,
      selectedDisposalSiteName: disposalPick.site.name,
      disposalCategory,
      dispatchMiles: routeCost.dispatchMiles,
      customerToDisposalMiles: routeCost.customerToDisposalMiles,
      returnMiles: routeCost.returnMiles,
      totalRouteMiles: routeCost.totalRouteMiles,
      estimatedDriveMinutes: routeCost.estimatedDriveMinutes,
      disposalSelectionReason: disposalPick.selectionReason,
      disposalUncertain: disposalPick.uncertain,
      minimumsApplied,
      baseSelectionReason: routeCost.baseSelectionReason,
    };

    const { reviewRequired, reviewReasons } = evaluateReviewRequired(input, config, {
      total,
      trailerPercent,
      heavyItems,
      specialDisposal,
      confidence,
      profitMargin: internalProfit.profitMargin,
      route,
      disposalUncertain: disposalPick.uncertain,
      distanceUnavailable,
      unknownCategory,
    });

    const reviewStatus: EstimateReviewStatus = reviewRequired ? "needs_review" : "auto_ready";
    if (reviewRequired) warnings.push("price_may_need_adjustment");

    if (input.addressLocation && !this.validateServiceArea(input.addressLocation, config)) {
      warnings.push("outside_service_area");
    }

    const junkRemovalLabel = buildJunkRemovalLineLabel({
      mode: input.mode,
      selectedItems: input.selectedItems,
      junkCategory: input.junkCategory,
      loadSizeTier: input.loadSizeTier,
    });

    const transportationBreakdown = buildTransportationBreakdownSteps(routeCost.originBase.city);

    const customerLines: PricingBreakdownLine[] = [
      { id: "service_call", label: "Pickup Service", amount: serviceCall },
      {
        id: "transportation",
        label: "Travel & Transportation",
        amount: transportation,
      },
      { id: "junk_removal", label: junkRemovalLabel, amount: junkRemovalAmount },
      { id: "disposal", label: "Disposal estimate", amount: dumpFeeEstimate },
      ...accessFees,
    ];
    if (priorityFee > 0) {
      customerLines.push({
        id: "priority",
        label: priority === "emergency" ? "Emergency scheduling" : "Priority scheduling",
        amount: priorityFee,
      });
    }
    if (flexibleDiscount > 0) {
      customerLines.push({
        id: "flexible_scheduling",
        label: input.scheduleSlot?.discountReason ?? "Flexible scheduling savings",
        amount: -flexibleDiscount,
      });
    }

    const internalLines: PricingBreakdownLine[] = [
      { id: "rev", label: "Revenue", amount: internalProfit.revenue, internal: true },
      { id: "fuel_cost", label: "Estimated fuel cost", amount: internalProfit.fuelCost, internal: true },
      {
        id: "payroll_cost",
        label: "Estimated payroll / labor",
        amount: internalProfit.payrollCost,
        internal: true,
      },
      { id: "dump_cost", label: "Estimated dump fee", amount: internalProfit.dumpCost, internal: true },
      {
        id: "truck_cost",
        label: "Estimated truck operating cost",
        amount: internalProfit.truckOperatingCost,
        internal: true,
      },
      {
        id: "trailer_cost",
        label: "Estimated trailer operating cost",
        amount: internalProfit.trailerOperatingCost,
        internal: true,
      },
      {
        id: "overhead",
        label: "Insurance / overhead allocation",
        amount: internalProfit.overheadCost,
        internal: true,
      },
      {
        id: "cc_processing",
        label: "Credit card processing estimate",
        amount: internalProfit.creditCardProcessingCost,
        internal: true,
      },
      {
        id: "total_cost",
        label: "Estimated total operating cost",
        amount: internalProfit.totalOperatingCost,
        internal: true,
      },
      { id: "profit", label: "Estimated gross profit", amount: internalProfit.grossProfit, internal: true },
    ];

    const modifiers: EstimateModifier[] = customerLines
      .filter((l) => !["service_call", "junk_removal"].includes(l.id))
      .map((l) => ({ id: l.id, label: l.label, amount: l.amount }));

    const draftResult: JunkRemovalEstimateResult = {
      customerLines,
      internalLines,
      lines: customerLines,
      total,
      subtotal: junkRemovalAmount,
      modifiers,
      trailerPercent,
      estimatedLaborMinutes,
      estimatedCrewSize,
      mileageEstimate: route.totalRouteMiles,
      dumpFeeEstimate,
      fuelAdjustment,
      reviewRequired,
      reviewReasons,
      reviewStatus,
      confidence,
      internalProfit,
      route,
      warnings: [...new Set(warnings)],
      priceFactors: [],
      transportationBreakdown,
    };

    draftResult.priceFactors = buildPriceFactors(input, draftResult, config);

    return draftResult;
  }

  buildEstimate(
    input: JunkRemovalEstimateInput,
    config: MorrisConfig,
    jobId: string,
    disclaimerAccepted: boolean
  ) {
    const result = this.calculate(input, config);
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

export const junkRemovalEngine = new JunkRemovalEstimateEngine();
