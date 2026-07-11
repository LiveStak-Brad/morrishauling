export type {
  DisposalCategory,
  DumpFeeType,
  EnhancedDumpSite,
  OperatingBase,
  DisposalSelection,
} from "@/lib/disposal/disposal-routing";

export {
  DISPOSAL_CATEGORY_LABELS,
  BOOKING_CATEGORY_DISPOSAL,
  detectHazardousKeywords,
  haversineMiles,
  getPrimaryOperatingBase,
  approximateCustomerLocation,
  estimateDisposalFee,
  selectDisposalSite,
  resolveDisposalCategory,
} from "@/lib/disposal/disposal-routing";

export { selectOptimalOperatingBase, computeRouteFromBase } from "@/lib/disposal/operating-base-selection";

export type { JunkRouteCost } from "@/lib/disposal/junk-route-costing";
export { calculateJunkRouteCost } from "@/lib/disposal/junk-route-costing";

export type { DistanceProvider } from "@/lib/distance";
export {
  HaversineDistanceProvider,
  GoogleMapsDistanceProvider,
  defaultDistanceProvider,
} from "@/lib/distance";

export {
  MATERIAL_CATEGORY_GROUPS,
  MATERIAL_CATEGORY_LABELS,
  normalizeAcceptedMaterials,
  type MaterialCategory,
} from "@/lib/disposal/material-categories";

export { rankDisposalSites, rowToDisposalFacility } from "@/lib/disposal/disposal-recommendation";
export { planDisposalRoute, facilityCoversAll } from "@/lib/disposal/multi-facility-plan";
export { isFacilityOpenNow, formatTodayHours } from "@/lib/disposal/facility-hours";

export type {
  DisposalFacility,
  DisposalSiteScore,
  DisposalRecommendationResult,
  DisposalSortMode,
  JobDisposalActuals,
  MultiFacilityDisposalPlan,
  DisposalPlanStop,
} from "@/types/disposal-management";

export {
  VERIFIED_DISPOSAL_FACILITIES,
  DISPOSAL_COVERAGE_COUNTIES,
  getVerifiedFacilities,
  coverageSummary,
} from "@/lib/data/disposal-network";
export { verifiedToDisposalFacility, allVerifiedAsDisposalFacilities } from "@/lib/data/disposal-network/map-to-facility";
