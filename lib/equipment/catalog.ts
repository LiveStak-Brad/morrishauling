/**
 * Equipment / attachment / capability / service catalog.
 * Frontend lists only services whose status is public and whose capabilities are enabled.
 * Do not claim a specific machine is owned unless an equipment asset record says so.
 */

import type { DivisionId } from "@/lib/divisions";
import type {
  AttachmentRecord,
  CapabilityRecord,
  CatalogServiceRecord,
  EquipmentTypeRecord,
  ServiceStatus,
} from "@/types/equipment";

export const EQUIPMENT_TYPES: EquipmentTypeRecord[] = [
  {
    id: "ctl",
    name: "Compact Track Loader",
    slug: "compact-track-loader",
    category: "loader",
    enabled: true,
    ownershipStatus: "planned",
    sortOrder: 10,
    notes: "Primary machine class for current land-clearing and site-work services. Not advertised as owned until an asset record is marked owned.",
  },
  {
    id: "mini_excavator",
    name: "Mini Excavator",
    slug: "mini-excavator",
    category: "excavator",
    enabled: false,
    ownershipStatus: "planned",
    sortOrder: 20,
    notes: "Future expansion. Do not advertise as available.",
  },
  {
    id: "excavator",
    name: "Excavator",
    slug: "excavator",
    category: "excavator",
    enabled: false,
    ownershipStatus: "planned",
    sortOrder: 30,
  },
];

export const ATTACHMENTS: AttachmentRecord[] = [
  { id: "forestry_mulcher", name: "Forestry Mulcher", slug: "forestry-mulcher", enabled: true, sortOrder: 10 },
  { id: "grapple", name: "Grapple", slug: "grapple", enabled: true, sortOrder: 20 },
  { id: "bucket", name: "Bucket", slug: "bucket", enabled: true, sortOrder: 30 },
  { id: "pallet_forks", name: "Pallet Forks", slug: "pallet-forks", enabled: true, sortOrder: 40 },
  { id: "brush_cutter", name: "Brush Cutter", slug: "brush-cutter", enabled: false, sortOrder: 50 },
  { id: "power_rake", name: "Power Rake", slug: "power-rake", enabled: false, sortOrder: 60 },
  { id: "stump_grinder", name: "Stump Grinder", slug: "stump-grinder", enabled: false, sortOrder: 70 },
  { id: "auger", name: "Auger", slug: "auger", enabled: false, sortOrder: 80 },
  { id: "trencher", name: "Trencher", slug: "trencher", enabled: false, sortOrder: 90 },
  { id: "breaker", name: "Breaker", slug: "breaker", enabled: false, sortOrder: 100 },
  { id: "snow_equipment", name: "Snow Equipment", slug: "snow-equipment", enabled: false, sortOrder: 110 },
  { id: "excavator_mulcher", name: "Excavator Mulcher", slug: "excavator-mulcher", enabled: false, sortOrder: 120 },
  { id: "excavator_thumb", name: "Excavator Thumb / Grapple", slug: "excavator-thumb", enabled: false, sortOrder: 130 },
  { id: "excavation_bucket", name: "Excavation Bucket", slug: "excavation-bucket", enabled: false, sortOrder: 140 },
  { id: "drainage_trenching", name: "Drainage / Trenching Equipment", slug: "drainage-trenching", enabled: false, sortOrder: 150 },
];

export const CAPABILITIES: CapabilityRecord[] = [
  { id: "cap-ctl-mulcher", equipmentTypeId: "ctl", attachmentId: "forestry_mulcher", name: "CTL forestry mulching", enabled: true },
  { id: "cap-ctl-grapple", equipmentTypeId: "ctl", attachmentId: "grapple", name: "CTL grapple handling", enabled: true },
  { id: "cap-ctl-bucket", equipmentTypeId: "ctl", attachmentId: "bucket", name: "CTL bucket / grading", enabled: true },
  { id: "cap-ctl-forks", equipmentTypeId: "ctl", attachmentId: "pallet_forks", name: "CTL material handling", enabled: true },
  { id: "cap-mini-bucket", equipmentTypeId: "mini_excavator", attachmentId: "excavation_bucket", name: "Mini excavator digging", enabled: false },
  { id: "cap-mini-thumb", equipmentTypeId: "mini_excavator", attachmentId: "excavator_thumb", name: "Mini excavator thumb work", enabled: false },
  { id: "cap-mini-mulcher", equipmentTypeId: "mini_excavator", attachmentId: "excavator_mulcher", name: "Mini excavator mulching", enabled: false },
  { id: "cap-mini-trench", equipmentTypeId: "mini_excavator", attachmentId: "drainage_trenching", name: "Mini excavator trenching", enabled: false },
];

type CatalogSeed = Omit<CatalogServiceRecord, "capabilityIds"> & { capabilityIds: string[] };

export const CATALOG_SERVICES: CatalogSeed[] = [
  // Land clearing — public, accepting upcoming estimates
  { id: "svc-forestry-mulching", divisionId: "land_clearing", slug: "forestry-mulching", name: "Forestry Mulching", status: "accepting_estimates", publiclyListed: true, sortOrder: 10, capabilityIds: ["cap-ctl-mulcher"] },
  { id: "svc-land-clearing", divisionId: "land_clearing", slug: "land-clearing", name: "Land Clearing", status: "accepting_estimates", publiclyListed: false, sortOrder: 15, capabilityIds: ["cap-ctl-mulcher", "cap-ctl-grapple"] },
  { id: "svc-brush-clearing", divisionId: "land_clearing", slug: "brush-clearing", name: "Brush Clearing", status: "accepting_estimates", publiclyListed: true, sortOrder: 20, capabilityIds: ["cap-ctl-mulcher"] },
  { id: "svc-lot-clearing", divisionId: "land_clearing", slug: "lot-clearing", name: "Lot Clearing", status: "accepting_estimates", publiclyListed: true, sortOrder: 30, capabilityIds: ["cap-ctl-mulcher", "cap-ctl-grapple"] },
  { id: "svc-property-reclamation", divisionId: "land_clearing", slug: "property-reclamation", name: "Overgrown Property Reclamation", status: "accepting_estimates", publiclyListed: true, sortOrder: 40, capabilityIds: ["cap-ctl-mulcher", "cap-ctl-grapple"] },
  { id: "svc-honeysuckle", divisionId: "land_clearing", slug: "honeysuckle-clearing", name: "Honeysuckle / Invasive Clearing", status: "accepting_estimates", publiclyListed: true, sortOrder: 50, capabilityIds: ["cap-ctl-mulcher"] },
  { id: "svc-small-tree", divisionId: "land_clearing", slug: "small-tree-clearing", name: "Small Tree & Sapling Clearing", status: "accepting_estimates", publiclyListed: true, sortOrder: 60, capabilityIds: ["cap-ctl-mulcher"] },
  { id: "svc-fence-line", divisionId: "land_clearing", slug: "fence-line-clearing", name: "Fence-Line Clearing", status: "accepting_estimates", publiclyListed: true, sortOrder: 70, capabilityIds: ["cap-ctl-mulcher"] },
  { id: "svc-trail", divisionId: "land_clearing", slug: "trail-clearing", name: "Trail / Path Clearing", status: "accepting_estimates", publiclyListed: true, sortOrder: 80, capabilityIds: ["cap-ctl-mulcher"] },
  { id: "svc-storm-veg", divisionId: "land_clearing", slug: "storm-debris-clearing", name: "Storm Debris / Vegetation Cleanup", status: "accepting_estimates", publiclyListed: true, sortOrder: 90, capabilityIds: ["cap-ctl-grapple", "cap-ctl-mulcher"] },
  { id: "svc-selective", divisionId: "land_clearing", slug: "selective-clearing", name: "Selective Clearing / Tree Thinning", status: "accepting_estimates", publiclyListed: true, sortOrder: 95, capabilityIds: ["cap-ctl-mulcher"] },
  { id: "svc-pasture", divisionId: "land_clearing", slug: "pasture-field-reclamation", name: "Pasture & Field Reclamation", status: "accepting_estimates", publiclyListed: true, sortOrder: 96, capabilityIds: ["cap-ctl-mulcher", "cap-ctl-grapple"] },
  { id: "svc-hunting", divisionId: "land_clearing", slug: "hunting-property-clearing", name: "Hunting Property Clearing", status: "accepting_estimates", publiclyListed: true, sortOrder: 97, capabilityIds: ["cap-ctl-mulcher"] },
  { id: "svc-brush-pile", divisionId: "land_clearing", slug: "brush-pile-cleanup", name: "Brush & Tree Pile Cleanup", status: "accepting_estimates", publiclyListed: false, sortOrder: 100, capabilityIds: ["cap-ctl-grapple"] },
  { id: "svc-park-like", divisionId: "land_clearing", slug: "park-like-clearing", name: "Park-Like Property Clearing", status: "accepting_estimates", publiclyListed: false, sortOrder: 101, capabilityIds: ["cap-ctl-mulcher"] },
  { id: "svc-food-plot", divisionId: "land_clearing", slug: "food-plot-area", name: "Food Plot Area Clearing", status: "accepting_estimates", publiclyListed: false, sortOrder: 102, capabilityIds: ["cap-ctl-mulcher"] },
  { id: "svc-encroachment", divisionId: "land_clearing", slug: "road-field-encroachment", name: "Road / Field Encroachment Clearing", status: "accepting_estimates", publiclyListed: false, sortOrder: 103, capabilityIds: ["cap-ctl-mulcher"] },
  { id: "svc-pond-access", divisionId: "land_clearing", slug: "pond-lake-access", name: "Pond / Lake Access Clearing", status: "accepting_estimates", publiclyListed: false, sortOrder: 104, capabilityIds: ["cap-ctl-mulcher"] },
  { id: "svc-homesite-veg", divisionId: "land_clearing", slug: "home-site-vegetation", name: "Home-Site Vegetation Clearing", status: "accepting_estimates", publiclyListed: false, sortOrder: 105, capabilityIds: ["cap-ctl-mulcher", "cap-ctl-grapple"] },
  { id: "svc-re-cleanup", divisionId: "land_clearing", slug: "real-estate-cleanup", name: "Real-Estate Property Cleanup", status: "accepting_estimates", publiclyListed: false, sortOrder: 106, capabilityIds: ["cap-ctl-mulcher", "cap-ctl-grapple"] },

  // Site work — public now; excavation family stays coming_soon
  { id: "svc-rough-grading", divisionId: "site_work", slug: "rough-grading", name: "Rough Grading", status: "accepting_estimates", publiclyListed: true, sortOrder: 10, capabilityIds: ["cap-ctl-bucket"] },
  { id: "svc-site-prep", divisionId: "site_work", slug: "site-preparation", name: "Site Preparation", status: "accepting_estimates", publiclyListed: true, sortOrder: 20, capabilityIds: ["cap-ctl-bucket"] },
  { id: "svc-dirt-moving", divisionId: "site_work", slug: "dirt-moving", name: "Dirt Moving", status: "accepting_estimates", publiclyListed: true, sortOrder: 30, capabilityIds: ["cap-ctl-bucket"] },
  { id: "svc-gravel", divisionId: "site_work", slug: "gravel-spreading", name: "Gravel Spreading", status: "accepting_estimates", publiclyListed: true, sortOrder: 40, capabilityIds: ["cap-ctl-bucket"] },
  { id: "svc-backfill", divisionId: "site_work", slug: "backfilling", name: "Backfilling", status: "accepting_estimates", publiclyListed: true, sortOrder: 50, capabilityIds: ["cap-ctl-bucket"] },
  { id: "svc-driveway-grade", divisionId: "site_work", slug: "driveway-grading", name: "Driveway Grading", status: "accepting_estimates", publiclyListed: true, sortOrder: 60, capabilityIds: ["cap-ctl-bucket"] },
  { id: "svc-site-cleanup", divisionId: "site_work", slug: "construction-cleanup", name: "Construction / Demolition Site Cleanup", status: "accepting_estimates", publiclyListed: false, sortOrder: 70, capabilityIds: ["cap-ctl-bucket", "cap-ctl-grapple"] },

  { id: "svc-excavation", divisionId: "site_work", slug: "excavation", name: "Excavation", status: "coming_soon", publiclyListed: false, sortOrder: 200, capabilityIds: ["cap-mini-bucket"] },
  { id: "svc-trenching", divisionId: "site_work", slug: "trenching", name: "Trenching", status: "coming_soon", publiclyListed: false, sortOrder: 210, capabilityIds: ["cap-mini-trench"] },
  { id: "svc-drainage", divisionId: "site_work", slug: "drainage", name: "Drainage", status: "coming_soon", publiclyListed: false, sortOrder: 220, capabilityIds: ["cap-mini-trench"] },
  { id: "svc-culverts", divisionId: "site_work", slug: "culverts", name: "Culverts", status: "coming_soon", publiclyListed: false, sortOrder: 230, capabilityIds: ["cap-mini-bucket"] },
  { id: "svc-stump-root", divisionId: "site_work", slug: "stump-root-removal", name: "Stump / Root Removal", status: "coming_soon", publiclyListed: false, sortOrder: 240, capabilityIds: ["cap-mini-thumb"] },
  { id: "svc-small-demo", divisionId: "site_work", slug: "small-demolition", name: "Small Demolition", status: "coming_soon", publiclyListed: false, sortOrder: 250, capabilityIds: ["cap-mini-thumb"] },
  { id: "svc-building-pad", divisionId: "site_work", slug: "building-pad", name: "Foundation / Building Pad Preparation", status: "coming_soon", publiclyListed: false, sortOrder: 260, capabilityIds: ["cap-mini-bucket", "cap-ctl-bucket"] },
  { id: "svc-ditch", divisionId: "site_work", slug: "ditch-work", name: "Ditch Work", status: "coming_soon", publiclyListed: false, sortOrder: 270, capabilityIds: ["cap-mini-bucket"] },
  { id: "svc-excavator-services", divisionId: "site_work", slug: "excavator-services", name: "Excavator Services", status: "coming_soon", publiclyListed: false, sortOrder: 280, capabilityIds: ["cap-mini-bucket"] },

  // Equipment services — equipment-intent searches
  { id: "svc-skid-steer", divisionId: "equipment_services", slug: "skid-steer-services", name: "Skid Steer Services", status: "accepting_estimates", publiclyListed: true, sortOrder: 10, capabilityIds: ["cap-ctl-bucket", "cap-ctl-grapple", "cap-ctl-forks"] },
  { id: "svc-bobcat", divisionId: "equipment_services", slug: "bobcat-services", name: "Skid Steer / Bobcat Services", status: "accepting_estimates", publiclyListed: true, sortOrder: 20, capabilityIds: ["cap-ctl-bucket", "cap-ctl-grapple", "cap-ctl-forks"] },
  { id: "svc-grapple", divisionId: "equipment_services", slug: "grapple-services", name: "Grapple Services", status: "accepting_estimates", publiclyListed: true, sortOrder: 30, capabilityIds: ["cap-ctl-grapple"] },
  { id: "svc-material-handling", divisionId: "equipment_services", slug: "material-handling", name: "Material Handling", status: "accepting_estimates", publiclyListed: true, sortOrder: 40, capabilityIds: ["cap-ctl-forks", "cap-ctl-bucket"] },
];

const PUBLIC_STATUSES: ServiceStatus[] = ["active", "accepting_estimates"];

export function capabilityIsEnabled(capabilityId: string): boolean {
  const cap = CAPABILITIES.find((c) => c.id === capabilityId);
  if (!cap || !cap.enabled) return false;
  const machine = EQUIPMENT_TYPES.find((e) => e.id === cap.equipmentTypeId);
  const attachment = ATTACHMENTS.find((a) => a.id === cap.attachmentId);
  return Boolean(machine?.enabled && attachment?.enabled);
}

export function serviceHasEnabledCapability(service: CatalogSeed): boolean {
  return service.capabilityIds.some(capabilityIsEnabled);
}

/** Services the public site may list. Coming-soon / disabled capabilities stay hidden. */
export function publicCatalogServices(divisionId?: DivisionId): CatalogSeed[] {
  return CATALOG_SERVICES.filter((s) => {
    if (divisionId && s.divisionId !== divisionId) return false;
    if (!s.publiclyListed) return false;
    if (!PUBLIC_STATUSES.includes(s.status)) return false;
    return serviceHasEnabledCapability(s);
  }).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getCatalogService(divisionId: DivisionId, slug: string): CatalogSeed | undefined {
  return publicCatalogServices(divisionId).find((s) => s.slug === slug);
}

export function inferCapabilityFromServiceSlug(slug: string | undefined): {
  capabilityId?: string;
  attachmentId?: string;
  equipmentTypeId?: string;
} {
  if (!slug) return {};
  const service = CATALOG_SERVICES.find((s) => s.slug === slug);
  const capabilityId = service?.capabilityIds.find(capabilityIsEnabled) ?? service?.capabilityIds[0];
  const cap = CAPABILITIES.find((c) => c.id === capabilityId);
  return {
    capabilityId,
    attachmentId: cap?.attachmentId,
    equipmentTypeId: cap?.equipmentTypeId,
  };
}

export const DEFAULT_MAINTENANCE_RESERVE_PER_HOUR = 25;
