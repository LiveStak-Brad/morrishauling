// @supabase-table: jobs

import type { LatLng } from "./company";
import type {
  EstimateType,
  HaulingDetails,
  PricingBreakdownLine,
  ServiceType,
} from "./hauling";

export type { ServiceType, EstimateType, HaulingDetails, PricingBreakdownLine };
export * from "./hauling";
import type { JunkRemovalDetails, EstimateReviewStatus } from "./junk-removal";

export type { JunkRemovalDetails, EstimateReviewStatus };
export * from "./junk-removal";

export type JobStatus =
  | "draft"
  | "submitted"
  | "estimated"
  | "scheduled"
  | "in_progress"
  | "needs_dump"
  | "completed"
  | "cancelled";

/** Extended operational statuses stored in jobs.status (text) — map via lib/jobs/workflow. */
export type ExtendedJobStatus = JobStatus | import("@/types/division").OperationalJobStatus;

export type LoadSizeTier =
  | "min_10"
  | "quarter_25"
  | "half_50"
  | "three_quarter_75"
  | "full_100"
  | "multi_150";

export const LOAD_SIZE_TRAILER_PERCENT: Record<LoadSizeTier, number> = {
  min_10: 10,
  quarter_25: 25,
  half_50: 50,
  three_quarter_75: 75,
  full_100: 100,
  multi_150: 150,
};

export interface AccessDetails {
  stairs: boolean;
  stairFlights?: number;
  elevator: boolean;
  longCarryFt: number;
  basement: boolean;
  attic: boolean;
  tightAccess: boolean;
  heavyItems: boolean;
  specialDisposal: boolean;
  notes?: string;
  /** Optional customer answers to help plan donation/recycling/specialty routing */
  materialHandling?: MaterialHandlingAnswers;
}

/** Customer estimate answers — optional, not required to book */
export interface MaterialHandlingAnswers {
  reusableItems?: boolean;
  electronicsIncluded?: boolean;
  appliancesIncluded?: boolean;
  specialtyItemsIncluded?: boolean;
  constructionSeparated?: boolean;
  yardWasteSeparated?: boolean;
}

export interface JunkItem {
  id: string;
  name: string;
  quantity: number;
  notes?: string;
}

export interface JobPhoto {
  id: string;
  url: string;
  caption?: string;
  /** Operational photo stage for completion gates */
  photoStage?: string;
}

export interface JobAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  location?: LatLng;
  /** Apartment / suite / unit / gate */
  line2?: string;
  placeId?: string;
  formattedAddress?: string;
  country?: string;
  verificationStatus?: "verified" | "manual_override" | "unverified";
  provider?: "google_places" | "manual";
  verifiedAt?: string;
}

export interface EstimateModifier {
  id: string;
  label: string;
  amount: number;
}

export interface Estimate {
  id: string;
  jobId: string;
  subtotal: number;
  modifiers: EstimateModifier[];
  total: number;
  trailerPercent: number;
  disclaimerAccepted: boolean;
  createdAt: string;
}

export type EstimateWarning =
  | "outside_service_area"
  | "price_may_need_adjustment"
  | "heavy_load"
  | "stairs_access"
  | "long_carry"
  | "special_disposal";

export interface Job {
  id: string;
  companyId: string;
  customerId: string;
  /** Morris Services division — junk_removal | hauling */
  divisionId?: "junk_removal" | "hauling";
  serviceType: ServiceType;
  status: JobStatus;
  junkType: string;
  items: JunkItem[];
  loadSizeTier: LoadSizeTier;
  accessDetails: AccessDetails;
  address: JobAddress;
  photos: JobPhoto[];
  estimate?: Estimate;
  estimateType?: EstimateType;
  pricingBreakdown?: PricingBreakdownLine[];
  disclaimerAccepted?: boolean;
  haulingDetails?: HaulingDetails;
  junkRemovalDetails?: JunkRemovalDetails;
  reviewStatus?: EstimateReviewStatus;
  warnings: EstimateWarning[];
  scheduledDate?: string;
  selectedScheduleSlotId?: string;
  scheduledWindowLabel?: string;
  flexibleDiscountAmount?: number;
  routeOrder?: number;
  assignedTruckId?: string;
  assignedTrailerId?: string;
  assignedEmployeeIds?: string[];
  /** Primary driver (must also be in assignedEmployeeIds when set). */
  driverEmployeeId?: string;
  /** Estimated on-site + travel duration in minutes. */
  estimatedDurationMinutes?: number;
  customerNotes?: string;
  finalLoadSizeTier?: LoadSizeTier;
  extraFees?: number;
  priceAdjustmentNotes?: string;
  paymentCollected?: boolean;
  fieldPaymentMethod?: "cash" | "check" | "card_pending" | "financing_requested" | null;
  finalPriceAdjustment?: number;
  finalPriceAdjustmentReason?: string;
  customerApprovalCaptured?: boolean;
  completionOverrideReason?: string;
  completionOverrideBy?: string;
  completionOverrideAt?: string;
  createdAt: string;
  updatedAt: string;
}
