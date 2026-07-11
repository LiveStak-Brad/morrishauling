import type { MorrisConfig } from "@/lib/morris-config";
import type {
  HaulingCargoCategory,
  HaulingInternalProfit,
  HaulingServiceLevel,
  HaulingTrailerType,
  PricingBreakdownLine,
} from "@/types/hauling";
import { serviceLevelToUrgency } from "@/types/hauling";
import type { LatLng } from "@/types";
import type { HaulingRouteMetrics } from "@/lib/geo/types";

export interface HaulingEstimateInput {
  pickup: {
    street?: string;
    city: string;
    state: string;
    zip: string;
    location?: LatLng;
  };
  delivery: {
    street?: string;
    city: string;
    state: string;
    zip: string;
    location?: LatLng;
  };
  cargoCategory: HaulingCargoCategory;
  cargoDescription: string;
  estimatedWeightLbs?: number;
  lengthFt?: number;
  widthFt?: number;
  heightFt?: number;
  isRunning?: boolean;
  isRolling?: boolean;
  needsWinch: boolean;
  needsLoadingHelp: boolean;
  needsUnloadingHelp: boolean;
  serviceLevel: HaulingServiceLevel;
  /**
   * Required for pricing. Must come from planHaulingRoute / /api/hauling/route.
   * The engine never invents mileage.
   */
  route?: HaulingRouteMetrics;
}

export interface HaulingEstimateResult {
  customerLines: PricingBreakdownLine[];
  internalLines: PricingBreakdownLine[];
  total: number;
  recommendedTrailerType: HaulingTrailerType;
  trailerDisplayName: string;
  rentalRequired: boolean;
  trailerOwnedOrRental: "owned" | "rental";
  estimatedLoadedMiles: number;
  estimatedDeadheadMiles: number;
  totalTravelMiles: number;
  estimatedFuelCost: number;
  estimatedDriverHours: number;
  serviceLevel: HaulingServiceLevel;
  internalProfit: HaulingInternalProfit;
  routeProvider?: string;
  /** @deprecated use customerLines */
  lines: PricingBreakdownLine[];
}

export class HaulingRouteRequiredError extends Error {
  constructor(message = "A calculated road route is required before pricing. Enter pickup and delivery addresses and wait for routing.") {
    super(message);
    this.name = "HaulingRouteRequiredError";
  }
}

export function recommendTrailerType(input: HaulingEstimateInput): HaulingTrailerType {
  const weight = input.estimatedWeightLbs ?? 0;
  const maxDim = Math.max(input.lengthFt ?? 0, input.widthFt ?? 0, input.heightFt ?? 0);

  if (input.cargoCategory === "vehicle") return "car_hauler";
  if (input.cargoCategory === "tractor" || input.cargoCategory === "machinery") {
    return weight > 12000 || input.needsWinch ? "gooseneck" : "equipment_trailer";
  }
  if (input.cargoCategory === "equipment") {
    return input.needsWinch ? "equipment_trailer" : "tilt_trailer";
  }
  if (input.cargoCategory === "trailer") return "flatbed";
  if (
    input.cargoCategory === "pallets" ||
    input.cargoCategory === "lumber" ||
    input.cargoCategory === "building_materials"
  ) {
    return "flatbed";
  }
  if (maxDim > 14 || weight > 10000) return "gooseneck";
  return "utility_trailer";
}

export function isRentalTrailerRequired(
  trailerType: HaulingTrailerType,
  config: MorrisConfig
): boolean {
  const match = config.haulingTrailerTypes.find((t) => t.id === trailerType);
  return !match?.owned;
}

export function getTrailerDisplayName(
  trailerType: HaulingTrailerType,
  config: MorrisConfig,
  rentalRequired: boolean
): string {
  const match = config.haulingTrailerTypes.find((t) => t.id === trailerType);
  const name = match?.displayName ?? match?.label ?? "Trailer";
  if (rentalRequired) return `Rental ${name} — subject to availability`;
  return name;
}

function computeInternalProfit(
  revenue: number,
  config: MorrisConfig,
  ctx: {
    totalTravelMiles: number;
    driverLaborCharge: number;
    trailerCustomerFee: number;
    rentalCustomerFee: number;
  }
): HaulingInternalProfit {
  const p = config.haulingPricing;
  const fuelCost = Math.round(ctx.totalTravelMiles * p.internalFuelCostPerMile);
  const payrollCost = Math.round(ctx.driverLaborCharge * p.internalPayrollCostRate);
  const trailerCost = Math.round(ctx.trailerCustomerFee * p.internalTrailerCostRate);
  const rentalCost = Math.round(ctx.rentalCustomerFee * p.internalRentalCostRate);
  const overheadCost = p.overheadAllocationFlat;
  const totalOperatingCost = fuelCost + payrollCost + trailerCost + rentalCost + overheadCost;
  const grossProfit = revenue - totalOperatingCost;
  const profitMargin = revenue > 0 ? Math.round((grossProfit / revenue) * 1000) / 10 : 0;

  return {
    revenue,
    fuelCost,
    payrollCost,
    trailerCost,
    rentalCost,
    overheadCost,
    totalOperatingCost,
    grossProfit,
    profitMargin,
  };
}

export class HaulingTransportEstimateEngine {
  calculate(input: HaulingEstimateInput, config: MorrisConfig): HaulingEstimateResult {
    if (!input.route?.routeOk) {
      throw new HaulingRouteRequiredError();
    }

    const pricing = config.haulingPricing;
    const recommendedTrailerType = recommendTrailerType(input);
    const rentalRequired = isRentalTrailerRequired(recommendedTrailerType, config);
    const trailerOwnedOrRental = rentalRequired ? "rental" : "owned";
    const trailerConfig = config.haulingTrailerTypes.find((t) => t.id === recommendedTrailerType);
    const trailerDisplayName = getTrailerDisplayName(recommendedTrailerType, config, rentalRequired);

    const estimatedLoadedMiles = input.route.loadedMiles;
    const estimatedDeadheadMiles = input.route.deadheadMiles;
    const totalTravelMiles = input.route.totalTravelMiles;
    const estimatedDriverHours = input.route.estimatedDriverHours;

    const loadedMileageCharge = Math.round(
      estimatedLoadedMiles * pricing.perLoadedMileRate +
        estimatedDeadheadMiles * pricing.deadheadMileRate
    );

    const customerLines: PricingBreakdownLine[] = [
      { id: "base", label: "Base hauling fee", amount: pricing.baseFee },
      {
        id: "loaded_mileage",
        label: `Loaded mileage (${estimatedLoadedMiles} mi)`,
        amount: loadedMileageCharge,
      },
      {
        id: "fuel",
        label: `Fuel adjustment (${totalTravelMiles} mi)`,
        amount: Math.round(totalTravelMiles * pricing.fuelAdjustmentRate),
      },
      {
        id: "driver_labor",
        label: `Driver & transport labor (${estimatedDriverHours} hrs)`,
        amount: Math.round(estimatedDriverHours * pricing.driverHourlyRate),
      },
    ];

    if (input.needsLoadingHelp) {
      customerLines.push({
        id: "loading",
        label: "Loading assistance",
        amount: pricing.loadingLaborRate,
      });
    }
    if (input.needsUnloadingHelp) {
      customerLines.push({
        id: "unloading",
        label: "Unloading assistance",
        amount: pricing.unloadingLaborRate,
      });
    }

    const trailerFee = trailerConfig?.fee ?? 75;
    customerLines.push({
      id: "trailer",
      label: trailerConfig?.displayName ?? "Trailer / equipment fee",
      amount: trailerFee,
    });

    let rentalCustomerFee = 0;
    if (rentalRequired) {
      rentalCustomerFee = Math.round(
        (pricing.rentalTrailerFee || trailerFee) * pricing.rentalTrailerMarkup
      );
      customerLines.push({
        id: "rental_trailer",
        label: "Rental trailer fee",
        amount: rentalCustomerFee,
      });
    }

    const serviceConfig = config.haulingServiceLevels.find((s) => s.id === input.serviceLevel);
    if (serviceConfig?.flatSurcharge) {
      customerLines.push({
        id: "service_level",
        label:
          input.serviceLevel === "priority"
            ? "Priority service (within 24 hours)"
            : "Emergency service (ASAP)",
        amount: serviceConfig.flatSurcharge,
      });
    }

    let subtotal = customerLines.reduce((s, l) => s + l.amount, 0);

    if (input.serviceLevel === "economy") {
      const discount = Math.round(subtotal * (pricing.economyDiscountPercent / 100));
      customerLines.push({
        id: "economy_discount",
        label: `Economy scheduling discount (${pricing.economyDiscountPercent}%)`,
        amount: -discount,
      });
      subtotal -= discount;
    } else if (serviceConfig?.priceMultiplier && serviceConfig.priceMultiplier !== 1) {
      const adjusted = Math.round(subtotal * serviceConfig.priceMultiplier);
      const delta = adjusted - subtotal;
      if (delta !== 0) {
        customerLines.push({
          id: "service_multiplier",
          label: `${serviceConfig.label} rate adjustment`,
          amount: delta,
        });
        subtotal = adjusted;
      }
    }

    const total = Math.max(pricing.baseFee, subtotal);
    const driverLaborCharge = customerLines.find((l) => l.id === "driver_labor")?.amount ?? 0;

    const internalProfit = computeInternalProfit(total, config, {
      totalTravelMiles,
      driverLaborCharge,
      trailerCustomerFee: trailerFee,
      rentalCustomerFee,
    });

    const internalLines: PricingBreakdownLine[] = [
      { id: "rev", label: "Revenue", amount: internalProfit.revenue, internal: true },
      { id: "fuel_cost", label: "Estimated fuel", amount: internalProfit.fuelCost, internal: true },
      {
        id: "payroll_cost",
        label: "Estimated payroll / labor",
        amount: internalProfit.payrollCost,
        internal: true,
      },
      {
        id: "trailer_cost",
        label: "Estimated trailer cost",
        amount: internalProfit.trailerCost,
        internal: true,
      },
    ];
    if (rentalRequired) {
      internalLines.push({
        id: "rental_cost",
        label: "Estimated rental cost",
        amount: internalProfit.rentalCost,
        internal: true,
      });
    }
    internalLines.push(
      {
        id: "overhead",
        label: "Insurance / overhead allocation",
        amount: internalProfit.overheadCost,
        internal: true,
      },
      {
        id: "total_cost",
        label: "Estimated total operating cost",
        amount: internalProfit.totalOperatingCost,
        internal: true,
      },
      {
        id: "profit",
        label: "Estimated gross profit",
        amount: internalProfit.grossProfit,
        internal: true,
      }
    );

    const estimatedFuelCost = Math.round(totalTravelMiles * pricing.internalFuelCostPerMile);

    return {
      customerLines,
      internalLines,
      lines: customerLines,
      total,
      recommendedTrailerType,
      trailerDisplayName,
      rentalRequired,
      trailerOwnedOrRental,
      estimatedLoadedMiles,
      estimatedDeadheadMiles,
      totalTravelMiles,
      estimatedFuelCost,
      estimatedDriverHours,
      serviceLevel: input.serviceLevel,
      internalProfit,
      routeProvider: input.route.provider,
    };
  }
}

export const haulingTransportEngine = new HaulingTransportEstimateEngine();
export { serviceLevelToUrgency };
