// @supabase-table: service_catalog, equipment_types, equipment_attachments,
// equipment_capabilities, equipment_intake_details, job_machine_hours, published_projects

import type { DivisionId } from "@/lib/divisions";

/** Customer-facing / catalog availability. Independent of division launch status. */
export type ServiceStatus =
  | "active"
  | "accepting_estimates"
  | "coming_soon"
  | "temporarily_unavailable";

export const SERVICE_STATUS_VALUES: ServiceStatus[] = [
  "active",
  "accepting_estimates",
  "coming_soon",
  "temporarily_unavailable",
];

export const SERVICE_STATUS_LABELS: Record<ServiceStatus, string> = {
  active: "Available",
  accepting_estimates: "Now Accepting Estimates",
  coming_soon: "Coming soon",
  temporarily_unavailable: "Temporarily unavailable",
};

export type EquipmentOwnershipStatus = "planned" | "on_order" | "owned" | "leased" | "retired";

export type EquipmentTypeRecord = {
  id: string;
  name: string;
  slug: string;
  category: string;
  enabled: boolean;
  ownershipStatus: EquipmentOwnershipStatus;
  sortOrder: number;
  notes?: string | null;
};

export type AttachmentRecord = {
  id: string;
  name: string;
  slug: string;
  enabled: boolean;
  sortOrder: number;
  notes?: string | null;
};

export type CapabilityRecord = {
  id: string;
  equipmentTypeId: string;
  attachmentId: string;
  name: string;
  enabled: boolean;
  notes?: string | null;
};

export type CatalogServiceRecord = {
  id: string;
  divisionId: DivisionId;
  slug: string;
  name: string;
  status: ServiceStatus;
  publiclyListed: boolean;
  sortOrder: number;
  capabilityIds: string[];
};

export type VegetationType =
  | "weeds_light_brush"
  | "honeysuckle_invasive"
  | "dense_brush"
  | "saplings"
  | "small_trees"
  | "larger_trees"
  | "storm_debris"
  | "brush_piles"
  | "mixed";

export type TreeDiameterRange =
  | "under_2"
  | "2_to_4"
  | "4_to_6"
  | "6_to_8"
  | "over_8"
  | "unsure";

export type VegetationDensity = "light" | "moderate" | "heavy" | "extremely_dense" | "unsure";

export type DesiredResult =
  | "mulch_in_place"
  | "reclaim_property"
  | "clear_for_mowing"
  | "clear_building_site"
  | "fence_line"
  | "trail_access"
  | "improve_visibility"
  | "storm_cleanup"
  | "other";

export type TerrainType =
  | "flat"
  | "rolling"
  | "steep"
  | "rocky"
  | "wet_soft"
  | "wooded"
  | "mixed"
  | "unsure";

export type SchedulingPreference = "flexible" | "date_range" | "estimate_only" | "onsite_assessment";

export type AccessConcerns = {
  gateWidthFt?: string;
  drivewayNotes?: string;
  fences?: boolean;
  structures?: boolean;
  septic?: boolean;
  utilityLines?: boolean;
  overheadWires?: boolean;
  undergroundUtilities?: boolean;
  lowBranches?: boolean;
  otherObstacles?: string;
};

export type LandClearingIntake = {
  address?: string;
  city?: string;
  county?: string;
  zip?: string;
  acreage?: string;
  vegetation: VegetationType[];
  diameterRange?: TreeDiameterRange;
  density?: VegetationDensity;
  desiredResult?: DesiredResult;
  desiredResultNotes?: string;
  terrain?: TerrainType;
  access: AccessConcerns;
  scheduling?: SchedulingPreference;
  preferredDate?: string;
  preferredDateEnd?: string;
};

export type SiteWorkIntake = {
  workTypes: string[];
  address?: string;
  city?: string;
  county?: string;
  zip?: string;
  squareFootage?: string;
  acreage?: string;
  materialType?: string;
  materialQuantity?: string;
  gradingObjective?: string;
  drivewayLengthFt?: string;
  drivewayWidthFt?: string;
  slopeNotes?: string;
  drainageConcerns?: string;
  access: AccessConcerns;
  desiredFinishedCondition?: string;
  scheduling?: SchedulingPreference;
  preferredDate?: string;
  preferredDateEnd?: string;
};

export type EquipmentServicesIntake = {
  goal?: string;
  materials?: string;
  sizeQuantity?: string;
  address?: string;
  city?: string;
  county?: string;
  zip?: string;
  access: AccessConcerns;
  inferredAttachmentId?: string;
  inferredCapabilityId?: string;
  scheduling?: SchedulingPreference;
  preferredDate?: string;
  preferredDateEnd?: string;
};

export type EquipmentIntakeKind = "land_clearing" | "site_work" | "equipment_services";

export type EquipmentIntakeDetails = {
  id: string;
  companyId: string;
  estimateId: string | null;
  jobId: string | null;
  divisionId: DivisionId;
  serviceSlug: string | null;
  kind: EquipmentIntakeKind;
  intake: LandClearingIntake | SiteWorkIntake | EquipmentServicesIntake;
  equipmentTypeId?: string | null;
  attachmentTypeId?: string | null;
  estimatedAcres?: number | null;
  actualAcres?: number | null;
  vegetationDensity?: VegetationDensity | null;
  treeDiameterRange?: TreeDiameterRange | null;
  terrainType?: TerrainType | null;
  accessDifficulty?: string | null;
  estimatedMachineHours?: number | null;
  actualMachineHours?: number | null;
  estimatedOperatorHours?: number | null;
  actualOperatorHours?: number | null;
  estimatedFuelGallons?: number | null;
  actualFuelGallons?: number | null;
  mobilizationMiles?: number | null;
  mobilizationCost?: number | null;
  estimatedMaintenanceReserve?: number | null;
  actualRepairCost?: number | null;
  quotedPrice?: number | null;
  deposit?: number | null;
  finalRevenue?: number | null;
  estimatedProfit?: number | null;
  actualProfit?: number | null;
  createdAt: string;
  updatedAt: string;
};

export type JobMachineHours = {
  id: string;
  companyId: string;
  jobId: string;
  assetId: string | null;
  equipmentTypeId: string | null;
  attachmentId: string | null;
  machineStartHours?: number | null;
  machineEndHours?: number | null;
  machineHoursUsed?: number | null;
  notes?: string | null;
  createdAt: string;
};

export type PublishedProject = {
  id: string;
  companyId: string;
  slug: string;
  title: string;
  divisionId: DivisionId;
  serviceSlug: string | null;
  city: string | null;
  county: string | null;
  acreage: number | null;
  vegetationType: string | null;
  equipmentUsed: string | null;
  attachmentUsed: string | null;
  approximateMachineHours: number | null;
  customerGoal: string | null;
  workCompleted: string | null;
  beforeImageUrls: string[];
  duringImageUrls: string[];
  afterImageUrls: string[];
  videoUrls: string[];
  testimonial: string | null;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EquipmentOpsSettings = {
  companyId: string;
  maintenanceReservePerHour: number;
  updatedAt: string;
};
