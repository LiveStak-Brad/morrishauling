import type { LoadSizeTier, AccessDetails, JunkItem, PricingBreakdownLine } from "./job";
import type { DisposalCategory } from "./disposal";

export type JunkEstimateMode = "single_item" | "cleanout";

/** Volume / trailer load tiers — maps to LoadSizeTier in pricing config */
export type JunkVolumeTier = LoadSizeTier;

export const JUNK_VOLUME_TIER_LABELS: Record<JunkVolumeTier, string> = {
  min_10: "Small Pickup",
  quarter_25: "Quarter Trailer",
  half_50: "Half Trailer",
  three_quarter_75: "Three Quarter Trailer",
  full_100: "Full Trailer",
  multi_150: "Multiple Loads",
};

export type JunkPriorityLevel = "flexible" | "standard" | "same_day" | "emergency";

export type EstimateReviewStatus =
  | "auto_ready"
  | "needs_review"
  | "approved"
  | "adjusted"
  | "declined";

export type { CommonJunkItemConfig } from "@/lib/common-junk-items";

export interface SelectedCommonItem {
  itemId: string;
  quantity: number;
  customName?: string;
}

export interface JunkInternalProfit {
  revenue: number;
  fuelCost: number;
  payrollCost: number;
  dumpCost: number;
  truckOperatingCost: number;
  trailerOperatingCost: number;
  overheadCost: number;
  creditCardProcessingCost: number;
  totalOperatingCost: number;
  grossProfit: number;
  profitMargin: number;
  /** Present when comparing estimate vs actual disposal */
  quotedDumpCost?: number;
  disposalDifference?: number;
  isActual?: boolean;
}

export interface JunkRouteSummary {
  originBaseId: string;
  originBaseName: string;
  originBaseCity?: string;
  selectedDisposalSiteId: string;
  selectedDisposalSiteName: string;
  disposalCategory: DisposalCategory;
  dispatchMiles: number;
  customerToDisposalMiles: number;
  returnMiles: number;
  totalRouteMiles: number;
  estimatedDriveMinutes: number;
  disposalSelectionReason: string;
  disposalUncertain: boolean;
  minimumsApplied: string[];
  baseSelectionReason?: string;
}

export interface JunkRemovalDetails {
  id: string;
  companyId: string;
  jobId: string;
  estimateMode: JunkEstimateMode;
  selectedItems?: SelectedCommonItem[];
  selectedCategory?: string;
  loadPercentage?: number;
  estimatedLaborMinutes?: number;
  estimatedCrewSize?: number;
  stairsFlights?: number;
  elevatorAvailable?: boolean;
  basement?: boolean;
  attic?: boolean;
  longCarryDistanceFt?: number;
  heavyItems?: boolean;
  specialDisposal?: boolean;
  dumpFeeEstimate?: number;
  mileageEstimate?: number;
  fuelAdjustment?: number;
  priorityLevel?: JunkPriorityLevel;
  reviewRequired: boolean;
  reviewReasons: string[];
  reviewStatus: EstimateReviewStatus;
  customerPricingBreakdown?: PricingBreakdownLine[];
  internalCostBreakdown?: PricingBreakdownLine[];
  estimatedProfit?: number;
  estimatedMargin?: number;
  originBaseId?: string;
  originBaseName?: string;
  selectedDisposalSiteId?: string;
  selectedDisposalSiteName?: string;
  disposalCategory?: DisposalCategory;
  estimatedDispatchMiles?: number;
  estimatedCustomerToDisposalMiles?: number;
  estimatedReturnMiles?: number;
  estimatedTotalRouteMiles?: number;
  estimatedDriveMinutes?: number;
  minimumsApplied?: string[];
  disposalSelectionReason?: string;
  disposalUncertain?: boolean;
  actualDisposalSiteId?: string;
  actualDisposalSiteName?: string;
  estimatedDisposalCost?: number;
  actualDisposalCost?: number;
  actualDisposalWeightTons?: number;
  disposalCompletedAt?: string;
  disposalReceiptUrl?: string;
  disposalOverrideReason?: string;
  disposalNotes?: string;
  recommendedDisposalSiteId?: string;
  disposalWeightTicketUrl?: string;
  actualDisposalWaitMinutes?: number;
  actualDisposalUnloadMinutes?: number;
  actualFuelCost?: number;
  actualGrossProfit?: number;
  actualProfitMargin?: number;
  disposalSkipReason?: string;
  disposalSkipNotes?: string;
  disposalSkippedAt?: string;
  noDisposalCostReason?: string;
  disposalReviewStatus?: import("@/lib/disposal/disposal-requirements").DisposalReviewStatus;
  disposalReviewNotes?: string;
  /** Staff-recorded only — never auto-fabricated */
  materialHandlingOutcomes?: import("@/lib/disposal/material-handling-outcomes").MaterialHandlingOutcomeLine[];
  selectedScheduleSlotId?: string;
  scheduledWindowLabel?: string;
  flexibleDiscountAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export const JUNK_PRIORITY_LABELS: Record<JunkPriorityLevel, string> = {
  flexible: "Flexible",
  standard: "Standard",
  same_day: "Same day",
  emergency: "Emergency",
};

export const ESTIMATE_REVIEW_STATUS_LABELS: Record<EstimateReviewStatus, string> = {
  auto_ready: "Ready",
  needs_review: "Needs review",
  approved: "Approved",
  adjusted: "Adjusted",
  declined: "Declined",
};

export const JUNK_ESTIMATE_MODE_LABELS: Record<JunkEstimateMode, string> = {
  single_item: "Single item pickup",
  cleanout: "Volume / trailer pickup",
};
