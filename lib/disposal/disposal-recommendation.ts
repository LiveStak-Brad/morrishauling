import type { MorrisConfig } from "@/lib/morris-config";
import type { LatLng } from "@/types";
import type {
  DisposalCostBreakdown,
  DisposalFacility,
  DisposalRecommendationResult,
  DisposalSiteScore,
  DisposalSortMode,
  FacilityHistoricalStats,
  RecommendationReason,
} from "@/types/disposal-management";
import type { DistanceProvider } from "@/lib/distance";
import { defaultDistanceProvider } from "@/lib/distance";
import {
  facilityAcceptsMaterials,
  materialFilterMatches,
  normalizeAcceptedMaterials,
  type MaterialCategory,
} from "@/lib/disposal/material-categories";
import { isFacilityOpenNow } from "@/lib/disposal/facility-hours";
import { estimateDisposalFee } from "@/lib/disposal/disposal-routing";
import type { DisposalCategory } from "@/lib/disposal/disposal-routing";

const ROAD_FACTOR = 1.22;

export interface DisposalFilterOptions {
  openNow?: boolean;
  accessType?: "public" | "commercial";
  materialFilter?: string;
  preferredOnly?: boolean;
}

export interface RankDisposalSitesInput {
  sites: DisposalFacility[];
  origin: LatLng;
  materials?: MaterialCategory[];
  legacyCategory?: DisposalCategory;
  config: MorrisConfig;
  loadPercent?: number;
  itemCount?: number;
  jobRevenue?: number;
  sortBy?: DisposalSortMode;
  filters?: DisposalFilterOptions;
  distanceProvider?: DistanceProvider;
  /** When true, incompatible facilities are excluded (no mixed-junk fallback). */
  strictMaterials?: boolean;
  facilityStats?: Record<string, FacilityHistoricalStats>;
}

function toLegacyCategory(materials: MaterialCategory[]): DisposalCategory {
  if (materials.some((m) => ["construction_demolition", "mixed_cd", "concrete", "drywall", "roofing"].includes(m))) {
    return "construction_debris";
  }
  if (materials.some((m) => ["yard_waste", "brush", "leaves", "tree_limbs", "logs", "stumps"].includes(m))) {
    return "yard_waste";
  }
  if (materials.includes("mattresses")) return "mattress";
  if (materials.includes("freon_appliances") || materials.includes("freon")) return "freon_appliance";
  if (materials.includes("appliances")) return "appliance";
  if (materials.includes("electronics")) return "electronics";
  if (materials.includes("tires")) return "tire";
  if (materials.includes("scrap_metal") || materials.includes("copper") || materials.includes("steel")) {
    return "scrap_metal";
  }
  return "general_junk";
}

function estimateFullCosts(
  site: DisposalFacility,
  distanceMiles: number,
  config: MorrisConfig,
  ctx: { loadPercent: number; itemCount: number; category: DisposalCategory },
  stats?: FacilityHistoricalStats
): DisposalCostBreakdown {
  const p = config.junkRemovalPricing;
  const enhanced = {
    id: site.id,
    name: site.name,
    address: site.address,
    city: site.city,
    state: site.state,
    location: site.location ?? { lat: 0, lng: 0 },
    acceptedMaterials: site.acceptedMaterials as DisposalCategory[],
    feeType: site.feeType,
    baseFee: site.baseFee,
    perTonFee: site.perTonFee,
    perItemFee: site.perItemFee,
    minimumFee: site.minimumFee,
    status: site.status,
  };

  let tippingFee = estimateDisposalFee(enhanced, ctx);
  if (stats && stats.jobCount >= 3 && stats.avgActualCost > 0) {
    tippingFee = Math.round((tippingFee + stats.avgActualCost) / 2);
  }

  const driveMinutes =
    stats && stats.jobCount >= 3 && stats.avgDriveMinutes > 0
      ? stats.avgDriveMinutes
      : Math.round((distanceMiles / p.averageDriveMph) * 60);

  const roundTripMiles = distanceMiles * 2;
  const fuelCost = Math.round((roundTripMiles / p.internalFuelMpg) * p.internalDieselPricePerGallon);
  const laborCost = Math.round((driveMinutes / 60) * p.laborHourlyRate * p.internalDriveLaborMultiplier);
  const truckOperatingCost = Math.round(roundTripMiles * p.internalTruckOperatingCostPerMile);
  const trailerOperatingCost = Math.round(roundTripMiles * p.internalTrailerOperatingCostPerMile);

  const waitMinutes = stats?.avgWaitMinutes ?? site.avgWaitMinutes ?? 12;
  const unloadMinutes = stats?.avgUnloadMinutes ?? site.avgUnloadMinutes ?? 18;
  const waitCost = Math.round((waitMinutes / 60) * p.laborHourlyRate);
  const unloadLaborCost = Math.round((unloadMinutes / 60) * p.laborHourlyRate * 1.5);

  const totalCompanyCost =
    tippingFee + fuelCost + laborCost + truckOperatingCost + trailerOperatingCost + waitCost + unloadLaborCost;

  return {
    tippingFee,
    fuelCost,
    laborCost,
    truckOperatingCost,
    trailerOperatingCost,
    waitCost,
    unloadLaborCost,
    totalCompanyCost,
  };
}

function scoreSite(
  site: DisposalFacility,
  costs: DisposalCostBreakdown,
  distanceMiles: number,
  isOpen: boolean,
  acceptsAll: boolean,
  maxDistance: number,
  minCost: number,
  maxCost: number,
  jobRevenue?: number
): number {
  const profit = jobRevenue != null ? jobRevenue - costs.totalCompanyCost : null;
  const profitScore =
    profit != null && jobRevenue! > 0
      ? Math.max(0, Math.min(40, (profit / jobRevenue!) * 40))
      : maxCost > minCost
        ? (1 - (costs.totalCompanyCost - minCost) / (maxCost - minCost)) * 35
        : 25;

  const distanceScore = maxDistance > 0 ? (1 - distanceMiles / maxDistance) * 20 : 10;
  const openBonus = isOpen ? 12 : -15;
  const materialBonus = acceptsAll ? 10 : 0;
  const vendorBonus = site.isPreferredVendor ? 10 : 0;
  const avoidPenalty = site.isAvoidVendor ? 30 : 0;
  const ratingBonus = site.vendorRating ? Math.min(8, site.vendorRating * 1.6) : 0;

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(profitScore + distanceScore + openBonus + materialBonus + vendorBonus + ratingBonus - avoidPenalty)
    )
  );
}

/** Prefer non-avoid vendors for top recommendation. */
function pickBestOverall(sorted: DisposalSiteScore[]): {
  best: DisposalSiteScore | null;
  avoidWarning?: string;
} {
  if (!sorted.length) return { best: null };
  const nonAvoid = sorted.filter((s) => !s.site.isAvoidVendor);
  if (nonAvoid.length > 0) return { best: nonAvoid[0] };
  return {
    best: sorted[0],
    avoidWarning:
      "This facility is on your avoid list. It is shown because no other compatible option is available — review before dispatch.",
  };
}

function preferNonAvoid<T extends DisposalSiteScore>(sorted: T[]): T | null {
  if (!sorted.length) return null;
  return sorted.find((s) => !s.site.isAvoidVendor) ?? sorted[0];
}

function starsFromScore(score: number): number {
  if (score >= 85) return 5;
  if (score >= 70) return 4;
  if (score >= 55) return 3;
  if (score >= 40) return 2;
  return 1;
}

function buildReasons(
  row: DisposalSiteScore,
  best: {
    cost: DisposalSiteScore | null;
    distance: DisposalSiteScore | null;
    time: DisposalSiteScore | null;
  }
): RecommendationReason[] {
  const reasons: RecommendationReason[] = [];
  const c = row.costs;

  if (best.cost && row.site.id === best.cost.site.id) {
    reasons.push({ type: "cost", label: "Lowest total company cost" });
  } else if (best.cost && c.totalCompanyCost <= best.cost.costs.totalCompanyCost * 1.05) {
    reasons.push({ type: "cost", label: "Near-lowest total cost" });
  }

  if (best.distance && row.site.id === best.distance.site.id) {
    reasons.push({ type: "distance", label: "Closest facility" });
  } else if (best.distance && best.distance.distanceMiles - row.distanceMiles >= 3) {
    reasons.push({ type: "distance", label: `${Math.round(best.distance.distanceMiles - row.distanceMiles)} mi closer than next option` });
  }

  if (best.time && row.site.id === best.time.site.id) {
    reasons.push({ type: "time", label: "Fastest drive time" });
  } else if (best.time && best.time.driveMinutes - row.driveMinutes >= 5) {
    reasons.push({ type: "time", label: `${best.time.driveMinutes - row.driveMinutes} min shorter drive` });
  }

  if (row.site.isPreferredVendor) reasons.push({ type: "vendor", label: "Preferred vendor" });
  if (row.site.isAvoidVendor) reasons.push({ type: "vendor", label: "On avoid list — use with caution" });
  if (row.acceptsAllMaterials) reasons.push({ type: "materials", label: "Accepts all job materials" });
  if (row.isOpenNow) reasons.push({ type: "open", label: "Currently open" });
  if (row.usesHistoricalData) reasons.push({ type: "learning", label: "Uses your historical job data" });
  if (row.site.vendorRating && row.site.vendorRating >= 4) {
    reasons.push({ type: "vendor", label: `${row.site.vendorRating.toFixed(1)} vendor rating` });
  }

  return reasons.slice(0, 6);
}

function toScoreRow(
  site: DisposalFacility,
  costs: DisposalCostBreakdown,
  distanceMiles: number,
  driveMinutes: number,
  isOpen: boolean,
  acceptsAll: boolean,
  usesHistorical: boolean,
  jobRevenue?: number
): Omit<DisposalSiteScore, "recommendationScore" | "stars" | "badges" | "recommendationReasons"> {
  if (jobRevenue != null) {
    costs.estimatedProfitAfterDisposal = Math.round(jobRevenue - costs.totalCompanyCost);
  }
  return {
    site,
    distanceMiles,
    driveMinutes,
    costs,
    tippingFee: costs.tippingFee,
    fuelCost: costs.fuelCost,
    laborCost: costs.laborCost + costs.waitCost + costs.unloadLaborCost,
    totalDisposalCost: costs.totalCompanyCost,
    isOpenNow: isOpen,
    acceptsAllMaterials: acceptsAll,
    selectionReason: acceptsAll ? "Accepts all required materials" : "Partial material match",
    usesHistoricalData: usesHistorical,
  };
}

export function rankDisposalSites(input: RankDisposalSitesInput): DisposalRecommendationResult {
  const {
    sites,
    origin,
    materials = ["mixed_junk"],
    legacyCategory,
    config,
    loadPercent = 25,
    itemCount = 1,
    jobRevenue,
    sortBy = "recommended",
    filters = {},
    distanceProvider = defaultDistanceProvider,
    strictMaterials = false,
    facilityStats = {},
  } = input;

  const category = legacyCategory ?? toLegacyCategory(materials);
  const active = sites.filter((s) => s.status === "active" && s.location && !s.isClosed);

  let candidates = active.filter((s) => {
    if (filters.openNow && !isFacilityOpenNow(s.hoursJson, s.isClosed, s.holidayClosures)) return false;
    if (filters.accessType === "public" && s.accessType === "commercial") return false;
    if (filters.accessType === "commercial" && s.accessType === "public") return false;
    if (filters.preferredOnly && !s.isPreferredVendor) return false;
    if (filters.materialFilter && !materialFilterMatches(s.acceptedMaterials, filters.materialFilter)) return false;
    return facilityAcceptsMaterials(s.acceptedMaterials, materials);
  });

  if (candidates.length === 0 && !strictMaterials) {
    candidates = active.filter((s) => {
      if (filters.openNow && !isFacilityOpenNow(s.hoursJson, s.isClosed, s.holidayClosures)) return false;
      if (filters.materialFilter && !materialFilterMatches(s.acceptedMaterials, filters.materialFilter)) return false;
      return normalizeAcceptedMaterials(s.acceptedMaterials).includes("mixed_junk");
    });
  }

  const scored: DisposalSiteScore[] = candidates.map((site) => {
    const straightMiles = distanceProvider.straightLineMiles(origin, site.location!);
    const distanceMiles = Math.round(straightMiles * ROAD_FACTOR * 10) / 10;
    const stats = facilityStats[site.id];
    const usesHistorical = Boolean(stats && stats.jobCount >= 3);
    const costs = estimateFullCosts(site, distanceMiles, config, { loadPercent, itemCount, category }, stats);
    const driveMinutes =
      stats && stats.jobCount >= 3 && stats.avgDriveMinutes > 0
        ? stats.avgDriveMinutes
        : Math.round((distanceMiles / config.junkRemovalPricing.averageDriveMph) * 60);
    const isOpen = isFacilityOpenNow(site.hoursJson, site.isClosed, site.holidayClosures);
    const acceptsAll = facilityAcceptsMaterials(site.acceptedMaterials, materials);
    return {
      ...toScoreRow(site, costs, distanceMiles, driveMinutes, isOpen, acceptsAll, usesHistorical, jobRevenue),
      recommendationScore: 0,
      stars: 3,
      badges: [],
      recommendationReasons: [],
    };
  });

  if (scored.length === 0) {
    return {
      origin,
      materials,
      ranked: [],
      bestOverall: null,
      mostProfitable: null,
      cheapest: null,
      closest: null,
      fastest: null,
      preferredVendor: null,
    };
  }

  const maxDistance = Math.max(...scored.map((s) => s.distanceMiles));
  const costs = scored.map((s) => s.costs.totalCompanyCost);
  const minCost = Math.min(...costs);
  const maxCost = Math.max(...costs);

  for (const row of scored) {
    row.recommendationScore = scoreSite(
      row.site,
      row.costs,
      row.distanceMiles,
      row.isOpenNow,
      row.acceptsAllMaterials,
      maxDistance,
      minCost,
      maxCost,
      jobRevenue
    );
    row.stars = starsFromScore(row.recommendationScore);
  }

  const byScore = [...scored].sort((a, b) => b.recommendationScore - a.recommendationScore);
  const byCost = [...scored].sort((a, b) => a.costs.totalCompanyCost - b.costs.totalCompanyCost);
  const byDistance = [...scored].sort((a, b) => a.distanceMiles - b.distanceMiles);
  const byTime = [...scored].sort((a, b) => a.driveMinutes - b.driveMinutes);
  const byProfit = [...scored].sort(
    (a, b) => (b.costs.estimatedProfitAfterDisposal ?? 0) - (a.costs.estimatedProfitAfterDisposal ?? 0)
  );
  const preferred = scored
    .filter((s) => s.site.isPreferredVendor && !s.site.isAvoidVendor)
    .sort((a, b) => b.recommendationScore - a.recommendationScore);

  const bestRefs = { cost: preferNonAvoid(byCost) ?? byCost[0] ?? null, distance: preferNonAvoid(byDistance) ?? byDistance[0] ?? null, time: preferNonAvoid(byTime) ?? byTime[0] ?? null };
  for (const row of scored) {
    row.recommendationReasons = buildReasons(row, bestRefs);
    if (row.site.isAvoidVendor && !row.badges.includes("avoid")) {
      row.badges.push("avoid");
    }
  }

  const { best: bestOverall, avoidWarning } = pickBestOverall(byScore);
  if (bestOverall && !bestOverall.badges.includes("recommended")) {
    bestOverall.badges.push("recommended");
  }
  if (byCost[0]) byCost[0].badges.push("cheapest");
  if (byDistance[0] && !byDistance[0].badges.includes("closest")) byDistance[0].badges.push("closest");
  if (byTime[0] && !byTime[0].badges.includes("fastest")) byTime[0].badges.push("fastest");
  if (byProfit[0] && jobRevenue) byProfit[0].badges.push("most_profitable");
  if (preferred[0] && !preferred[0].badges.includes("preferred")) preferred[0].badges.push("preferred");

  const sortFns: Record<DisposalSortMode, (a: DisposalSiteScore, b: DisposalSiteScore) => number> = {
    recommended: (a, b) => b.recommendationScore - a.recommendationScore,
    most_profitable: (a, b) =>
      (b.costs.estimatedProfitAfterDisposal ?? -Infinity) - (a.costs.estimatedProfitAfterDisposal ?? -Infinity),
    cheapest: (a, b) => a.costs.totalCompanyCost - b.costs.totalCompanyCost,
    lowest_total_cost: (a, b) => a.costs.totalCompanyCost - b.costs.totalCompanyCost,
    lowest_tipping: (a, b) => a.costs.tippingFee - b.costs.tippingFee,
    closest: (a, b) => a.distanceMiles - b.distanceMiles,
    fastest: (a, b) => a.driveMinutes - b.driveMinutes,
    shortest_drive: (a, b) => a.distanceMiles - b.distanceMiles,
    lowest_fuel: (a, b) => a.costs.fuelCost - b.costs.fuelCost,
    lowest_labor: (a, b) =>
      a.costs.laborCost + a.costs.waitCost + a.costs.unloadLaborCost -
      (b.costs.laborCost + b.costs.waitCost + b.costs.unloadLaborCost),
    highest_rating: (a, b) => (b.site.vendorRating ?? 0) - (a.site.vendorRating ?? 0),
    preferred_vendor: (a, b) => Number(b.site.isPreferredVendor) - Number(a.site.isPreferredVendor) || b.recommendationScore - a.recommendationScore,
    open_now: (a, b) => Number(b.isOpenNow) - Number(a.isOpenNow) || b.recommendationScore - a.recommendationScore,
    lowest_wait_time: (a, b) =>
      (a.site.avgWaitMinutes ?? 999) - (b.site.avgWaitMinutes ?? 999) ||
      b.recommendationScore - a.recommendationScore,
    county: (a, b) => (a.site.county ?? "").localeCompare(b.site.county ?? "") || a.site.name.localeCompare(b.site.name),
    alphabetical: (a, b) => a.site.name.localeCompare(b.site.name),
  };

  const ranked = [...scored].sort(sortFns[sortBy] ?? sortFns.recommended);

  return {
    origin,
    materials,
    ranked,
    bestOverall,
    mostProfitable: preferNonAvoid(byProfit) ?? byProfit[0] ?? null,
    cheapest: preferNonAvoid(byCost) ?? byCost[0] ?? null,
    closest: preferNonAvoid(byDistance) ?? byDistance[0] ?? null,
    fastest: preferNonAvoid(byTime) ?? byTime[0] ?? null,
    preferredVendor: preferred[0] ?? null,
    avoidWarning,
  };
}

export function rowToDisposalFacility(row: Record<string, unknown>): DisposalFacility {
  return {
    id: String(row.id),
    companyId: row.company_id ? String(row.company_id) : undefined,
    name: String(row.name),
    address: String(row.address),
    city: (row.city as string) ?? undefined,
    state: (row.state as string) ?? undefined,
    zip: (row.zip as string) ?? undefined,
    county: (row.county as string) ?? undefined,
    location:
      row.latitude != null && row.longitude != null
        ? { lat: Number(row.latitude), lng: Number(row.longitude) }
        : undefined,
    phone: (row.phone as string) ?? undefined,
    website: (row.website as string) ?? undefined,
    accessType: (row.access_type as DisposalFacility["accessType"]) ?? "both",
    hoursJson: (row.hours_json as DisposalFacility["hoursJson"]) ?? {},
    holidayClosures: (row.holiday_closures as string[]) ?? [],
    acceptedMaterials: normalizeAcceptedMaterials(row.accepted_materials as string[]),
    rejectedMaterials: (row.rejected_materials as string[]) ?? [],
    maxLoadSize: (row.max_load_size as string) ?? undefined,
    trailerRestrictions: (row.trailer_restrictions as string) ?? undefined,
    truckRestrictions: (row.truck_restrictions as string) ?? undefined,
    weightLimitTons: row.weight_limit_tons != null ? Number(row.weight_limit_tons) : undefined,
    feeType: (row.fee_type as DisposalFacility["feeType"]) ?? "flat",
    baseFee: row.base_fee != null ? Number(row.base_fee) : 0,
    perTonFee: row.per_ton_fee != null ? Number(row.per_ton_fee) : undefined,
    perItemFee: row.per_item_fee != null ? Number(row.per_item_fee) : undefined,
    minimumFee: row.minimum_fee != null ? Number(row.minimum_fee) : 0,
    specialFees: (row.special_fees as DisposalFacility["specialFees"]) ?? [],
    notes: (row.notes as string) ?? undefined,
    internalNotes: (row.internal_notes as string) ?? undefined,
    status: (row.status as DisposalFacility["status"]) ?? "active",
    isClosed: Boolean(row.is_closed),
    closureReason: (row.closure_reason as string) ?? undefined,
    isPreferredVendor: Boolean(row.is_preferred_vendor),
    isFavorite: Boolean(row.is_favorite),
    isAvoidVendor: Boolean(row.is_avoid_vendor),
    vendorRating: row.vendor_rating != null ? Number(row.vendor_rating) : undefined,
    avgWaitMinutes: row.avg_wait_minutes != null ? Number(row.avg_wait_minutes) : undefined,
    avgUnloadMinutes: row.avg_unload_minutes != null ? Number(row.avg_unload_minutes) : undefined,
  };
}
