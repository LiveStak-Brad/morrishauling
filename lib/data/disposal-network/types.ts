/**
 * Verified disposal-network records.
 * Only fields confirmed from official/operator sources should be populated.
 * Unknown values must remain null/undefined — never invent tip fees or hours.
 */

import type { MaterialCategory } from "@/lib/disposal/material-categories";

export type FacilityType =
  | "sanitary_landfill"
  | "demolition_landfill"
  | "transfer_station"
  | "recycling_center"
  | "material_recovery"
  | "compost"
  | "specialty_recycler"
  | "hhw"
  | "yard_waste";

export type VerificationStatus = "verified" | "partial" | "needs_call" | "needs_geocode";

export type ResidencyRestriction =
  | "none"
  | "county_residents"
  | "city_residents"
  | "account_holders"
  | "unknown";

export type CoverageTier = "core" | "expansion" | "adjacent";

export type CoverageCountyStatus = "active" | "planned" | "no_local_msw_facility";

export interface VerificationSource {
  label: string;
  url?: string;
  retrievedAt: string;
  notes?: string;
}

export interface CoverageCounty {
  id: string;
  state: "MO" | "IL";
  county: string;
  tier: CoverageTier;
  status: CoverageCountyStatus;
  notes?: string;
}

export interface VerifiedDisposalFacility {
  id: string;
  name: string;
  facilityType: FacilityType;
  address: string;
  city: string;
  state: "MO" | "IL";
  zip: string;
  county: string;
  latitude: number | null;
  longitude: number | null;
  geocodeSource?: string;
  phone?: string;
  website?: string;
  /** public | commercial | both */
  accessType: "public" | "commercial" | "both";
  commercialAccepted: boolean;
  appointmentRequired: boolean;
  residencyRestriction: ResidencyRestriction;
  hoursJson: Record<string, string>;
  holidayClosures: string[];
  acceptedMaterials: MaterialCategory[];
  rejectedMaterials: string[];
  specialRequirements?: string;
  operationalNotes?: string;
  internalNotes?: string;
  /** Published public tip / gate pricing — omit when not published */
  feeType?: "flat" | "weight" | "volume" | "mixed" | "per_item";
  baseFee?: number | null;
  perTonFee?: number | null;
  minimumFee?: number | null;
  publicPricingNotes?: string;
  commercialPricingNotes?: string;
  weightLimitTons?: number | null;
  trailerRestrictions?: string;
  truckRestrictions?: string;
  maxLoadSize?: string;
  scaleAvailable?: boolean | null;
  paymentMethods?: string[];
  verificationStatus: VerificationStatus;
  verificationSources: VerificationSource[];
  verifiedAt: string;
  pricingVerifiedAt?: string | null;
  coverageTier: CoverageTier[];
  status: "active" | "inactive";
}
