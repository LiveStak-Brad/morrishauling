// @supabase-table: jobs

import type { LatLng } from "./company";

export type JobStatus =
  | "draft"
  | "submitted"
  | "estimated"
  | "scheduled"
  | "in_progress"
  | "needs_dump"
  | "completed"
  | "cancelled";

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
}

export interface JobAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  location?: LatLng;
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
  status: JobStatus;
  junkType: string;
  items: JunkItem[];
  loadSizeTier: LoadSizeTier;
  accessDetails: AccessDetails;
  address: JobAddress;
  photos: JobPhoto[];
  estimate?: Estimate;
  warnings: EstimateWarning[];
  scheduledDate?: string;
  routeOrder?: number;
  assignedTruckId?: string;
  assignedTrailerId?: string;
  assignedEmployeeIds?: string[];
  customerNotes?: string;
  finalLoadSizeTier?: LoadSizeTier;
  extraFees?: number;
  priceAdjustmentNotes?: string;
  paymentCollected?: boolean;
  fieldPaymentMethod?: "cash" | "check" | "card_pending" | "financing_requested" | null;
  finalPriceAdjustment?: number;
  finalPriceAdjustmentReason?: string;
  customerApprovalCaptured?: boolean;
  createdAt: string;
  updatedAt: string;
}
