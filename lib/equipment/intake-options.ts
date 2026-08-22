export const VEGETATION_OPTIONS = [
  { id: "weeds_light_brush", label: "Weeds / light brush" },
  { id: "honeysuckle_invasive", label: "Honeysuckle / invasive vegetation" },
  { id: "dense_brush", label: "Dense brush" },
  { id: "saplings", label: "Saplings" },
  { id: "small_trees", label: "Small trees" },
  { id: "larger_trees", label: "Larger trees" },
  { id: "storm_debris", label: "Storm debris" },
  { id: "brush_piles", label: "Brush piles" },
  { id: "mixed", label: "Mixed vegetation" },
] as const;

export const DIAMETER_OPTIONS = [
  { id: "under_2", label: "Under 2 inches" },
  { id: "2_to_4", label: "2–4 inches" },
  { id: "4_to_6", label: "4–6 inches" },
  { id: "6_to_8", label: "6–8 inches" },
  { id: "over_8", label: "Over 8 inches" },
  { id: "unsure", label: "Unsure" },
] as const;

export const DENSITY_OPTIONS = [
  { id: "light", label: "Light" },
  { id: "moderate", label: "Moderate" },
  { id: "heavy", label: "Heavy" },
  { id: "extremely_dense", label: "Extremely dense" },
  { id: "unsure", label: "Unsure" },
] as const;

export const DESIRED_RESULT_OPTIONS = [
  { id: "mulch_in_place", label: "Mulch vegetation in place" },
  { id: "reclaim_property", label: "Reclaim the property" },
  { id: "clear_for_mowing", label: "Clear for mowing" },
  { id: "clear_building_site", label: "Clear a building / site area" },
  { id: "fence_line", label: "Fence-line clearing" },
  { id: "trail_access", label: "Trail / access creation" },
  { id: "improve_visibility", label: "Improve visibility" },
  { id: "storm_cleanup", label: "Storm cleanup" },
  { id: "other", label: "Other" },
] as const;

export const TERRAIN_OPTIONS = [
  { id: "flat", label: "Flat" },
  { id: "rolling", label: "Rolling" },
  { id: "steep", label: "Steep" },
  { id: "rocky", label: "Rocky" },
  { id: "wet_soft", label: "Wet / soft" },
  { id: "wooded", label: "Wooded" },
  { id: "mixed", label: "Mixed" },
  { id: "unsure", label: "Unsure" },
] as const;

export const SCHEDULING_OPTIONS = [
  { id: "flexible", label: "Flexible date" },
  { id: "date_range", label: "Preferred date range" },
  { id: "estimate_only", label: "Estimate only" },
  { id: "onsite_assessment", label: "Onsite assessment request" },
] as const;

export const ACCESS_FLAG_OPTIONS = [
  { id: "fences", label: "Fences" },
  { id: "structures", label: "Structures" },
  { id: "septic", label: "Septic system" },
  { id: "utilityLines", label: "Utility lines" },
  { id: "overheadWires", label: "Overhead wires" },
  { id: "undergroundUtilities", label: "Underground utilities" },
  { id: "lowBranches", label: "Low branches" },
] as const;

export const SITE_WORK_TYPES = [
  { id: "rough_grading", label: "Rough grading" },
  { id: "site_preparation", label: "Site preparation" },
  { id: "dirt_moving", label: "Dirt moving" },
  { id: "gravel_spreading", label: "Gravel spreading" },
  { id: "backfilling", label: "Backfilling" },
  { id: "property_leveling", label: "Property leveling" },
  { id: "driveway_grading", label: "Driveway grading / maintenance" },
  { id: "material_spreading", label: "Material spreading" },
  { id: "site_cleanup", label: "Construction / demolition site cleanup" },
] as const;

export const MATERIAL_TYPE_OPTIONS = [
  { id: "native_soil", label: "Native soil / dirt" },
  { id: "gravel", label: "Gravel" },
  { id: "crushed_rock", label: "Crushed rock" },
  { id: "fill_dirt", label: "Fill dirt" },
  { id: "mixed", label: "Mixed materials" },
  { id: "unsure", label: "Unsure" },
] as const;
