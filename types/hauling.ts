import type { LatLng } from "./company";

export type ServiceType = "junk_removal" | "hauling_transport";
export type EstimateType = ServiceType;

export type HaulingCargoCategory =
  | "vehicle"
  | "equipment"
  | "machinery"
  | "tractor"
  | "atv_utv"
  | "pallets"
  | "lumber"
  | "building_materials"
  | "trailer"
  | "toolbox"
  | "marketplace"
  | "other";

export type HaulingTrailerType =
  | "utility_trailer"
  | "car_hauler"
  | "equipment_trailer"
  | "tilt_trailer"
  | "dump_trailer"
  | "enclosed_trailer"
  | "flatbed"
  | "gooseneck";

/** @deprecated Use HaulingServiceLevel — kept for legacy rows */
export type HaulingUrgency = "flexible" | "standard" | "same_day" | "emergency";

export type HaulingServiceLevel = "economy" | "standard" | "priority" | "emergency";

export type TrailerOwnership = "owned" | "rental";

export interface HaulingLocation {
  address: string;
  city: string;
  state: string;
  zip: string;
  accessNotes?: string;
  loadingDock?: boolean;
  forkliftAvailable?: boolean;
  assistanceAvailable?: boolean;
  location?: LatLng;
  line2?: string;
  placeId?: string;
  formattedAddress?: string;
  country?: string;
  verificationStatus?: "verified" | "manual_override" | "unverified";
  provider?: "google_places" | "manual";
  verifiedAt?: string;
}

export interface PricingBreakdownLine {
  id: string;
  label: string;
  amount: number;
  /** Internal-only lines are stripped from customer views */
  internal?: boolean;
  /** Optional helper text shown below the line (customer-facing) */
  helperText?: string;
}

export interface HaulingInternalProfit {
  revenue: number;
  fuelCost: number;
  payrollCost: number;
  trailerCost: number;
  rentalCost: number;
  overheadCost: number;
  totalOperatingCost: number;
  grossProfit: number;
  profitMargin: number;
}

export interface HaulingDetails {
  id: string;
  companyId: string;
  jobId: string;
  pickup: HaulingLocation;
  delivery: HaulingLocation;
  /** Intermediate verified stops between pickup and delivery */
  stops?: HaulingLocation[];
  cargoCategory: HaulingCargoCategory;
  cargoDescription: string;
  estimatedWeightLbs?: number;
  lengthFt?: number;
  widthFt?: number;
  heightFt?: number;
  isRunning?: boolean | null;
  isRolling?: boolean | null;
  needsWinch: boolean;
  needsLoadingHelp: boolean;
  needsUnloadingHelp: boolean;
  recommendedTrailerType?: HaulingTrailerType;
  rentalRequired: boolean;
  trailerOwnedOrRental?: TrailerOwnership;
  estimatedLoadedMiles?: number;
  estimatedEmptyMiles?: number;
  totalTravelMiles?: number;
  estimatedFuelCost?: number;
  estimatedDriverHours?: number;
  serviceLevel?: HaulingServiceLevel;
  urgency: HaulingUrgency;
  customerPricingBreakdown?: PricingBreakdownLine[];
  internalCostBreakdown?: PricingBreakdownLine[];
  estimatedProfit?: number;
  estimatedMargin?: number;
  trailerAvailabilityDisclaimerAccepted: boolean;
  preferredPickupDate?: string;
  preferredDeliveryDate?: string;
  preferredDeliveryWindow?: string;
  createdAt: string;
  updatedAt: string;
}

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  junk_removal: "Junk Removal",
  hauling_transport: "Hauling & Transport",
};

export const HAULING_CARGO_LABELS: Record<HaulingCargoCategory, string> = {
  vehicle: "Vehicle",
  equipment: "Equipment",
  machinery: "Machinery",
  tractor: "Tractor",
  atv_utv: "ATV / UTV",
  pallets: "Pallets",
  lumber: "Lumber",
  building_materials: "Building materials",
  trailer: "Trailer",
  toolbox: "Toolbox",
  marketplace: "Marketplace pickup",
  other: "Other",
};

export const HAULING_TRAILER_LABELS: Record<HaulingTrailerType, string> = {
  utility_trailer: "Utility trailer",
  car_hauler: "Car hauler",
  equipment_trailer: "Equipment trailer",
  tilt_trailer: "Tilt trailer",
  dump_trailer: "Dump trailer",
  enclosed_trailer: "Enclosed trailer",
  flatbed: "Flatbed",
  gooseneck: "Gooseneck",
};

export const HAULING_SERVICE_LEVEL_LABELS: Record<HaulingServiceLevel, string> = {
  economy: "Economy",
  standard: "Standard",
  priority: "Priority",
  emergency: "Emergency",
};

export const HAULING_URGENCY_LABELS: Record<HaulingUrgency, string> = {
  flexible: "Flexible",
  standard: "Standard",
  same_day: "Same day",
  emergency: "Emergency",
};

export function serviceLevelToUrgency(level: HaulingServiceLevel): HaulingUrgency {
  if (level === "economy") return "flexible";
  if (level === "priority") return "same_day";
  if (level === "emergency") return "emergency";
  return "standard";
}
