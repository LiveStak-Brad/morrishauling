import type { LatLng } from "@/types";
import type { DumpSiteHours } from "@/types/operations-depth";
import type { MaterialCategory } from "@/lib/disposal/material-categories";

export type FacilityAccessType = "public" | "commercial" | "both";

export interface SpecialDisposalFee {
  material: string;
  label: string;
  amount: number;
}

export interface DisposalFacility {
  id: string;
  companyId?: string;
  name: string;
  address: string;
  city?: string;
  state?: string;
  zip?: string;
  county?: string;
  location?: LatLng;
  phone?: string;
  website?: string;
  accessType: FacilityAccessType;
  hoursJson?: DumpSiteHours;
  holidayClosures?: string[];
  acceptedMaterials: MaterialCategory[];
  rejectedMaterials?: string[];
  maxLoadSize?: string;
  trailerRestrictions?: string;
  truckRestrictions?: string;
  weightLimitTons?: number;
  feeType: "flat" | "weight" | "volume" | "mixed" | "per_item";
  baseFee: number;
  perTonFee?: number;
  perItemFee?: number;
  minimumFee: number;
  specialFees?: SpecialDisposalFee[];
  notes?: string;
  internalNotes?: string;
  status: "active" | "inactive";
  isClosed: boolean;
  closureReason?: string;
  isPreferredVendor?: boolean;
  isFavorite?: boolean;
  isAvoidVendor?: boolean;
  vendorRating?: number;
  avgWaitMinutes?: number;
  avgUnloadMinutes?: number;
}

export type DisposalSortMode =
  | "recommended"
  | "most_profitable"
  | "cheapest"
  | "lowest_total_cost"
  | "lowest_tipping"
  | "closest"
  | "fastest"
  | "shortest_drive"
  | "lowest_fuel"
  | "lowest_labor"
  | "highest_rating"
  | "preferred_vendor"
  | "open_now"
  | "lowest_wait_time"
  | "county"
  | "alphabetical";

export interface DisposalCostBreakdown {
  tippingFee: number;
  fuelCost: number;
  laborCost: number;
  truckOperatingCost: number;
  trailerOperatingCost: number;
  waitCost: number;
  unloadLaborCost: number;
  totalCompanyCost: number;
  estimatedProfitAfterDisposal?: number;
}

export interface RecommendationReason {
  type: "cost" | "distance" | "time" | "vendor" | "materials" | "open" | "learning";
  label: string;
}

export interface FacilityHistoricalStats {
  jobCount: number;
  avgActualCost: number;
  avgWaitMinutes: number;
  avgUnloadMinutes: number;
  avgDriveMinutes: number;
  totalSpent: number;
  recommendationAcceptRate: number;
}

export interface DisposalSiteScore {
  site: DisposalFacility;
  distanceMiles: number;
  driveMinutes: number;
  costs: DisposalCostBreakdown;
  /** @deprecated use costs.totalCompanyCost */
  tippingFee: number;
  fuelCost: number;
  laborCost: number;
  totalDisposalCost: number;
  recommendationScore: number;
  stars: number;
  badges: Array<"recommended" | "cheapest" | "closest" | "fastest" | "preferred" | "most_profitable" | "avoid">;
  isOpenNow: boolean;
  acceptsAllMaterials: boolean;
  selectionReason: string;
  recommendationReasons: RecommendationReason[];
  usesHistoricalData: boolean;
}

export interface DisposalRecommendationResult {
  origin: LatLng;
  materials: MaterialCategory[];
  ranked: DisposalSiteScore[];
  bestOverall: DisposalSiteScore | null;
  mostProfitable: DisposalSiteScore | null;
  cheapest: DisposalSiteScore | null;
  closest: DisposalSiteScore | null;
  fastest: DisposalSiteScore | null;
  preferredVendor: DisposalSiteScore | null;
  /** Set when bestOverall is an avoid-listed vendor because no alternative exists */
  avoidWarning?: string;
}

export interface DisposalDashboardKpis {
  totalFacilities: number;
  openNow: number;
  preferredVendors: number;
  avgDisposalCost: number;
  avgDriveMiles: number;
  monthlySpend: number;
  savingsFromRecommendations: number;
}

export interface DisposalActivityRow {
  id: string;
  jobId: string;
  dumpSiteName: string;
  actualCost: number;
  completedAt: string;
  wasRecommended: boolean;
}

export interface DisposalFacilityReportRow {
  dumpSiteId: string;
  dumpSiteName: string;
  jobCount: number;
  totalSpent: number;
  avgCost: number;
  avgWaitMinutes: number;
}

export interface JobDisposalActuals {
  recommendedSiteId?: string;
  actualSiteId?: string;
  actualSiteName?: string;
  estimatedDisposalCost?: number;
  actualDisposalCost?: number;
  actualWeightTons?: number;
  disposalCompletedAt?: string;
  receiptUrl?: string;
  notes?: string;
  overrideReason?: string;
}
