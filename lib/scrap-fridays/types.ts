export const SCRAP_CATEGORIES = [
  "appliances",
  "automotive",
  "yard_outdoor",
  "household",
  "construction",
] as const;

export type ScrapCategory = (typeof SCRAP_CATEGORIES)[number];

export const SCRAP_CATEGORY_LABELS: Record<ScrapCategory, string> = {
  appliances: "Appliances",
  automotive: "Automotive & equipment",
  yard_outdoor: "Yard & outdoor",
  household: "Household",
  construction: "Construction & bulk scrap",
};

export const SCRAP_REQUEST_STATUSES = [
  "draft",
  "submitted",
  "under_review",
  "more_info_needed",
  "approved",
  "waitlisted",
  "scheduled",
  "confirmed_by_customer",
  "crew_en_route",
  "arrived",
  "completed",
  "declined",
  "converted_to_paid",
  "cancelled",
  "no_show",
] as const;

export type ScrapRequestStatus = (typeof SCRAP_REQUEST_STATUSES)[number];

export const WEIGHT_BANDS = [
  "under_50",
  "50_100",
  "100_200",
  "200_400",
  "400_700",
  "over_700",
  "unsure",
] as const;

export type WeightBand = (typeof WEIGHT_BANDS)[number];

export const WEIGHT_BAND_LABELS: Record<WeightBand, string> = {
  under_50: "Under 50 lb",
  "50_100": "50–100 lb",
  "100_200": "100–200 lb",
  "200_400": "200–400 lb",
  "400_700": "400–700 lb",
  over_700: "Over 700 lb",
  unsure: "I’m not sure",
};

export const WEIGHT_BAND_MIDPOINTS: Record<WeightBand, number | null> = {
  under_50: 35,
  "50_100": 75,
  "100_200": 150,
  "200_400": 300,
  "400_700": 550,
  over_700: 850,
  unsure: null,
};

export const DETACHMENT_RULE =
  "Items must already be detached and ready for removal. Free Scrap Fridays does not include disconnecting, unbolting, unscrewing, cutting, dismantling, or removing items that are nailed, welded, wired, plumbed, mounted, or otherwise attached to a building, structure, concrete, vehicle, fence, utility, or other object.";

export const DETACHMENT_PAID_NOTE =
  "Attached items may be declined or quoted separately as paid removal.";

export const NOT_ACCEPTED_ITEMS = [
  "Fuel tanks",
  "Propane tanks or cylinders",
  "Pressurized containers",
  "Paint cans",
  "Chemicals",
  "Oil",
  "Gasoline or fuel",
  "Hazardous materials",
  "Asbestos-containing materials",
  "Leaking or damaged batteries",
  "Containers with unknown contents",
  "Mixed household trash disguised as scrap",
  "Items contaminated with hazardous substances",
  "Items still attached to a building, structure, vehicle, plumbing, electrical system, concrete, or other object",
] as const;

export type ScrapItemType = {
  id: string;
  name: string;
  category: ScrapCategory;
  active: boolean;
  icon_key: string | null;
  default_weight_lb: number;
  default_volume_cuft: number;
  default_stop_minutes: number;
  default_route_units: number;
  default_equipment: string[];
  default_crew_count: number;
  customer_questions: Array<{
    key: string;
    label: string;
    type: string;
    required?: boolean;
    options?: string[];
  }>;
  eligibility_rules: Record<string, unknown>;
  sort_order: number;
};

export type ScrapWizardItem = {
  clientKey: string;
  itemTypeId: string;
  quantity: number;
  weightBand: WeightBand;
  customerWeightLb?: number | null;
  sizeClass?: string | null;
  locationOnProperty?: string | null;
  unusuallyHeavy?: boolean;
  answers: Record<string, unknown>;
  notes?: string;
};

export type ScrapAccessAnswers = {
  pickupLocation?: string;
  carryDistance?: string;
  stairs?: string;
  narrowAccess?: boolean;
  gateAccess?: boolean;
  groundConditions?: string;
  mudOrSlope?: boolean;
  vehicleAccess?: string;
  equipmentAccess?: boolean;
  animals?: boolean;
  otherConcerns?: string;
  permissionConfirmed?: boolean;
  authorityConfirmed?: boolean;
  photosMatchConfirmed?: boolean;
  emptyDetachedSafeConfirmed?: boolean;
};

export type ScrapAvailability = {
  preference?: "morning" | "afternoon" | "flexible" | "custom";
  unavailableNotes?: string;
};
