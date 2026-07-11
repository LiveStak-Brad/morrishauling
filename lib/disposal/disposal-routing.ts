import type { LatLng } from "@/types";
import type { DistanceProvider } from "@/lib/distance";
import { defaultDistanceProvider } from "@/lib/distance";

export type DisposalCategory =
  | "general_junk"
  | "mattress"
  | "appliance"
  | "freon_appliance"
  | "scrap_metal"
  | "electronics"
  | "tire"
  | "construction_debris"
  | "yard_waste"
  | "bulky_special"
  | "heavy_special";

export type DumpFeeType = "flat" | "weight" | "volume" | "mixed" | "per_item";

export interface EnhancedDumpSite {
  id: string;
  name: string;
  address: string;
  city?: string;
  state?: string;
  location: LatLng;
  acceptedMaterials: DisposalCategory[];
  feeType: DumpFeeType;
  baseFee: number;
  perTonFee?: number;
  perItemFee?: number;
  minimumFee: number;
  notes?: string;
  status: "active" | "inactive";
  /** @deprecated use baseFee */
  feePerLoad?: number;
}

export interface OperatingBase {
  id: string;
  name: string;
  address?: string;
  city: string;
  state: string;
  zip?: string;
  location: LatLng;
  isPrimary: boolean;
  placeId?: string;
}

export interface DisposalSelection {
  site: EnhancedDumpSite;
  category: DisposalCategory;
  estimatedFee: number;
  selectionReason: string;
  uncertain: boolean;
  customerToDisposalMiles: number;
}

export const DISPOSAL_CATEGORY_LABELS: Record<DisposalCategory, string> = {
  general_junk: "General Household Items",
  mattress: "Mattress & Bedding",
  appliance: "Appliance",
  freon_appliance: "Refrigerated Appliance",
  scrap_metal: "Metal / Appliance",
  electronics: "Electronics",
  tire: "Tire",
  construction_debris: "Construction Debris",
  yard_waste: "Yard Waste",
  bulky_special: "Bulky Special Item",
  heavy_special: "Heavy Special Item",
};

export const BOOKING_CATEGORY_DISPOSAL: Record<string, DisposalCategory> = {
  furniture: "general_junk",
  garage: "general_junk",
  estate: "general_junk",
  construction: "construction_debris",
  appliance: "appliance",
  mattress: "mattress",
  yard: "yard_waste",
  storage: "general_junk",
  hottub: "bulky_special",
  shed: "construction_debris",
  demolition: "construction_debris",
  moving: "general_junk",
  rental: "general_junk",
  commercial: "general_junk",
  office: "general_junk",
  electronics: "electronics",
  general: "general_junk",
  other: "general_junk",
};

const HAZARDOUS_KEYWORDS = [
  "asbestos",
  "hazardous",
  "chemical",
  "paint thinner",
  "oil",
  "gasoline",
  "propane",
  "medical",
  "biohazard",
  "lead",
  "mercury",
];

export function detectHazardousKeywords(notes: string): boolean {
  const lower = notes.toLowerCase();
  return HAZARDOUS_KEYWORDS.some((k) => lower.includes(k));
}

export function haversineMiles(a: LatLng, b: LatLng): number {
  return defaultDistanceProvider.straightLineMiles(a, b);
}

export function getPrimaryOperatingBase(bases: OperatingBase[]): OperatingBase {
  return bases.find((b) => b.isPrimary) ?? bases[0];
}

export function approximateCustomerLocation(
  zip: string | undefined,
  base: OperatingBase
): LatLng {
  if (!zip) {
    return {
      lat: base.location.lat + 0.06,
      lng: base.location.lng + 0.04,
    };
  }
  const hash = zip.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
  const angle = ((hash % 360) * Math.PI) / 180;
  const distMiles = 10 + (hash % 28);
  const milesToDeg = 1 / 69;
  return {
    lat: base.location.lat + Math.cos(angle) * distMiles * milesToDeg,
    lng: base.location.lng + Math.sin(angle) * distMiles * milesToDeg,
  };
}

export function estimateDisposalFee(
  site: EnhancedDumpSite,
  ctx: { loadPercent: number; itemCount: number; category: DisposalCategory }
): number {
  let fee = site.baseFee ?? site.feePerLoad ?? site.minimumFee;
  if (site.feeType === "weight" && site.perTonFee) {
    const estTons = Math.max(0.25, (ctx.loadPercent / 100) * 2);
    fee = Math.max(site.minimumFee, site.baseFee + Math.round(estTons * site.perTonFee));
  } else if (site.feeType === "per_item" && site.perItemFee) {
    fee = Math.max(site.minimumFee, site.perItemFee * Math.max(1, ctx.itemCount));
  } else if (site.feeType === "mixed") {
    const estTons = Math.max(0.25, (ctx.loadPercent / 100) * 1.5);
    fee = Math.max(
      site.minimumFee,
      site.baseFee + Math.round(estTons * (site.perTonFee ?? 0))
    );
  }
  return Math.max(site.minimumFee, fee);
}

export function selectDisposalSite(
  sites: EnhancedDumpSite[],
  category: DisposalCategory,
  customerLocation: LatLng,
  distanceProvider: DistanceProvider = defaultDistanceProvider
): DisposalSelection {
  const active = sites.filter((s) => s.status === "active");
  const accepting = active.filter((s) => s.acceptedMaterials.includes(category));

  if (accepting.length === 0) {
    const fallback = active.find((s) => s.acceptedMaterials.includes("general_junk")) ?? active[0];
    if (!fallback) {
      return {
        site: {
          id: "unknown",
          name: "Disposal TBD",
          address: "",
          location: customerLocation,
          acceptedMaterials: ["general_junk"],
          feeType: "flat",
          baseFee: 45,
          minimumFee: 45,
          status: "active",
        },
        category,
        estimatedFee: 45,
        selectionReason: "No matching disposal site — review required",
        uncertain: true,
        customerToDisposalMiles: 12,
      };
    }
    const miles = distanceProvider.straightLineMiles(customerLocation, fallback.location);
    return {
      site: fallback,
      category,
      estimatedFee: estimateDisposalFee(fallback, { loadPercent: 25, itemCount: 1, category }),
      selectionReason: `Fallback — no site accepts ${DISPOSAL_CATEGORY_LABELS[category]}`,
      uncertain: true,
      customerToDisposalMiles: Math.round(miles * 10) / 10,
    };
  }

  const ranked = accepting
    .map((site) => ({
      site,
      miles: distanceProvider.straightLineMiles(customerLocation, site.location),
    }))
    .sort((a, b) => a.miles - b.miles);

  const best = ranked[0];
  return {
    site: best.site,
    category,
    estimatedFee: estimateDisposalFee(best.site, { loadPercent: 25, itemCount: 1, category }),
    selectionReason: `Nearest active site accepting ${DISPOSAL_CATEGORY_LABELS[category]}`,
    uncertain: false,
    customerToDisposalMiles: Math.round(best.miles * 10) / 10,
  };
}

export function resolveDisposalCategory(input: {
  mode: "single_item" | "cleanout";
  selectedItemIds?: string[];
  junkCategory?: string;
  itemDisposalCategories?: DisposalCategory[];
}): DisposalCategory {
  if (input.itemDisposalCategories?.length) {
    const priority: DisposalCategory[] = [
      "heavy_special",
      "bulky_special",
      "freon_appliance",
      "construction_debris",
      "tire",
      "electronics",
      "mattress",
      "appliance",
      "scrap_metal",
      "yard_waste",
    ];
    for (const p of priority) {
      if (input.itemDisposalCategories.includes(p)) return p;
    }
    return input.itemDisposalCategories[0];
  }
  if (input.junkCategory && BOOKING_CATEGORY_DISPOSAL[input.junkCategory]) {
    return BOOKING_CATEGORY_DISPOSAL[input.junkCategory];
  }
  return "general_junk";
}
