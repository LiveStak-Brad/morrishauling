/**
 * Land-clearing customer intents.
 * Dedicated routes only when the search/job is meaningfully different.
 * Other intents live as hub sections + estimate goals.
 */

export const LAND_CLEARING_PROJECT_GOALS = [
  { id: "general_land_clearing", label: "General land clearing", serviceSlug: "forestry-mulching" },
  { id: "forestry_mulching", label: "Forestry mulching", serviceSlug: "forestry-mulching" },
  { id: "brush_clearing", label: "Brush clearing", serviceSlug: "brush-clearing" },
  { id: "property_reclamation", label: "Reclaim overgrown property", serviceSlug: "property-reclamation" },
  { id: "selective_clearing", label: "Keep the mature trees / thin the woods", serviceSlug: "selective-clearing" },
  { id: "park_like_clearing", label: "Make the woods more usable", serviceSlug: "selective-clearing" },
  { id: "pasture_field_reclamation", label: "Reclaim a field or pasture", serviceSlug: "pasture-field-reclamation" },
  { id: "hunting_property", label: "Hunting-property access", serviceSlug: "hunting-property-clearing" },
  { id: "food_plot_area", label: "Clear an area for a food plot", serviceSlug: "hunting-property-clearing" },
  { id: "trail_access", label: "Trail or access lane", serviceSlug: "trail-clearing" },
  { id: "fence_line", label: "Fence-line clearing", serviceSlug: "fence-line-clearing" },
  { id: "road_field_encroachment", label: "Widen a road, drive, or field edge", serviceSlug: "trail-clearing" },
  { id: "pond_lake_access", label: "Pond or lake access", serviceSlug: "trail-clearing" },
  { id: "home_site_vegetation", label: "Clear vegetation for a building site", serviceSlug: "lot-clearing" },
  { id: "real_estate_cleanup", label: "Clean up a property before sale", serviceSlug: "property-reclamation" },
  { id: "storm_cleanup", label: "Storm debris / vegetation", serviceSlug: "storm-debris-clearing" },
  { id: "other", label: "Something else", serviceSlug: "forestry-mulching" },
] as const;

export type LandClearingProjectGoal = (typeof LAND_CLEARING_PROJECT_GOALS)[number]["id"];

export const KEEP_VEGETATION_OPTIONS = [
  { id: "keep_most_mature", label: "Keep most mature trees" },
  { id: "keep_marked", label: "Keep selected marked trees" },
  { id: "clear_most", label: "Clear most vegetation" },
  { id: "unsure", label: "Unsure — recommend an approach" },
] as const;

export type KeepVegetationIntent = (typeof KEEP_VEGETATION_OPTIONS)[number]["id"];

export const PROPERTY_END_USE_OPTIONS = [
  { id: "lawn_mowing", label: "Lawn / mowing" },
  { id: "recreation", label: "Recreation" },
  { id: "hunting", label: "Hunting" },
  { id: "trails_atv", label: "Trails / ATV access" },
  { id: "pasture_field", label: "Pasture / field" },
  { id: "building_site", label: "Building site" },
  { id: "visibility", label: "Better visibility" },
  { id: "property_sale", label: "Property sale" },
  { id: "general_cleanup", label: "General cleanup" },
  { id: "other", label: "Other" },
  { id: "unsure", label: "Unsure" },
] as const;

export type PropertyEndUse = (typeof PROPERTY_END_USE_OPTIONS)[number]["id"];

export type PropertyNeedCard = {
  id: string;
  title: string;
  goal: LandClearingProjectGoal;
  href: string;
  estimateHref: string;
  recommendation: string;
};

export const PROPERTY_NEED_CARDS: PropertyNeedCard[] = [
  {
    id: "overgrown",
    title: "My property is completely overgrown",
    goal: "property_reclamation",
    href: "/land-clearing/property-reclamation",
    estimateHref: "/book?division=land_clearing&goal=property_reclamation&service=property-reclamation",
    recommendation: "Property reclamation or brush clearing may be a good starting point.",
  },
  {
    id: "keep-trees",
    title: "I want to keep the big trees",
    goal: "selective_clearing",
    href: "/land-clearing/selective-clearing",
    estimateHref: "/book?division=land_clearing&goal=selective_clearing&service=selective-clearing",
    recommendation: "Selective clearing / tree thinning may be a good starting point.",
  },
  {
    id: "park-like",
    title: "I want my woods to look maintained",
    goal: "park_like_clearing",
    href: "/land-clearing/selective-clearing#park-like",
    estimateHref: "/book?division=land_clearing&goal=park_like_clearing&service=selective-clearing",
    recommendation: "Selective understory clearing can open a wooded property without taking every tree.",
  },
  {
    id: "pasture",
    title: "I need my field or pasture back",
    goal: "pasture_field_reclamation",
    href: "/land-clearing/pasture-field-reclamation",
    estimateHref: "/book?division=land_clearing&goal=pasture_field_reclamation&service=pasture-field-reclamation",
    recommendation: "Pasture and field reclamation may be a good starting point.",
  },
  {
    id: "hunting",
    title: "I'm preparing hunting property",
    goal: "hunting_property",
    href: "/land-clearing/hunting-property-clearing",
    estimateHref: "/book?division=land_clearing&goal=hunting_property&service=hunting-property-clearing",
    recommendation: "Hunting-property vegetation and access clearing may be a good starting point.",
  },
  {
    id: "trail",
    title: "I need a trail or access lane",
    goal: "trail_access",
    href: "/land-clearing/trail-clearing",
    estimateHref: "/book?division=land_clearing&goal=trail_access&service=trail-clearing",
    recommendation: "Trail and access clearing may be a good starting point.",
  },
  {
    id: "fence",
    title: "My fence line has disappeared",
    goal: "fence_line",
    href: "/land-clearing/fence-line-clearing",
    estimateHref: "/book?division=land_clearing&goal=fence_line&service=fence-line-clearing",
    recommendation: "Fence-line clearing may be a good starting point.",
  },
  {
    id: "encroachment",
    title: "Brush is taking over my road or field",
    goal: "road_field_encroachment",
    href: "/land-clearing#road-field-encroachment",
    estimateHref: "/book?division=land_clearing&goal=road_field_encroachment&service=trail-clearing",
    recommendation: "Road and field-edge clearing may restore usable width where conditions allow.",
  },
  {
    id: "homesite",
    title: "I'm preparing a building site",
    goal: "home_site_vegetation",
    href: "/land-clearing#home-site-vegetation",
    estimateHref: "/book?division=land_clearing&goal=home_site_vegetation&service=lot-clearing",
    recommendation: "Home-site vegetation clearing — then Site Work if dirt work is needed next.",
  },
  {
    id: "pond",
    title: "I need access around a pond",
    goal: "pond_lake_access",
    href: "/land-clearing#pond-lake-access",
    estimateHref: "/book?division=land_clearing&goal=pond_lake_access&service=trail-clearing",
    recommendation: "Pond-access vegetation clearing may be a good starting point.",
  },
  {
    id: "sale",
    title: "I'm cleaning up property before selling",
    goal: "real_estate_cleanup",
    href: "/land-clearing#real-estate-cleanup",
    estimateHref: "/book?division=land_clearing&goal=real_estate_cleanup&service=property-reclamation",
    recommendation: "Real-estate property cleanup can combine land clearing with junk removal and hauling.",
  },
  {
    id: "unsure",
    title: "I'm not sure",
    goal: "general_land_clearing",
    href: "/land-clearing",
    estimateHref: "/book?division=land_clearing&goal=general_land_clearing",
    recommendation: "A general land-clearing estimate is the simplest next step. Photos help us recommend a fit.",
  },
];

export function parseProjectGoal(raw: string | null | undefined): LandClearingProjectGoal | null {
  if (!raw) return null;
  return LAND_CLEARING_PROJECT_GOALS.some((g) => g.id === raw) ? (raw as LandClearingProjectGoal) : null;
}

export function serviceSlugForGoal(goal: LandClearingProjectGoal | null | undefined): string {
  const row = LAND_CLEARING_PROJECT_GOALS.find((g) => g.id === goal);
  return row?.serviceSlug ?? "forestry-mulching";
}

export function goalLabel(goal: LandClearingProjectGoal | string | null | undefined): string {
  return LAND_CLEARING_PROJECT_GOALS.find((g) => g.id === goal)?.label ?? "Land clearing";
}

export const SERVICE_SLUG_DEFAULT_GOAL: Record<string, LandClearingProjectGoal> = {
  "forestry-mulching": "forestry_mulching",
  "brush-clearing": "brush_clearing",
  "lot-clearing": "home_site_vegetation",
  "property-reclamation": "property_reclamation",
  "honeysuckle-clearing": "brush_clearing",
  "small-tree-clearing": "selective_clearing",
  "fence-line-clearing": "fence_line",
  "trail-clearing": "trail_access",
  "storm-debris-clearing": "storm_cleanup",
  "selective-clearing": "selective_clearing",
  "pasture-field-reclamation": "pasture_field_reclamation",
  "hunting-property-clearing": "hunting_property",
};

export function defaultGoalForServiceSlug(slug: string | null | undefined): LandClearingProjectGoal | null {
  if (!slug) return null;
  return SERVICE_SLUG_DEFAULT_GOAL[slug] ?? null;
}

export function landClearingBookHref(input: {
  goal?: LandClearingProjectGoal | null;
  serviceSlug?: string | null;
}): string {
  const params = new URLSearchParams({ division: "land_clearing" });
  if (input.goal) params.set("goal", input.goal);
  const slug = input.serviceSlug ?? (input.goal ? serviceSlugForGoal(input.goal) : "");
  if (slug) params.set("service", slug);
  return `/book?${params.toString()}`;
}

export const LAND_CLEARING_HUB_FAQS = [
  {
    q: "Can you clear property while leaving mature trees?",
    a: "Yes — that is the usual goal of selective clearing. Mark what must stay. Tight clusters, vines, and access still decide what is safe. This is not arborist or hazardous-tree work.",
  },
  {
    q: "Can forestry mulching reclaim an overgrown field?",
    a: "Often it can, depending on stem size, density, and ground conditions. Two fields of the same acreage can be very different jobs.",
  },
  {
    q: "Can you clear hunting trails?",
    a: "We can discuss a scoped vegetation corridor for walking or ATV access. We do not provide wildlife-management consulting.",
  },
  {
    q: "Can you clear around a pond?",
    a: "We can discuss vegetation that blocks a path, view, or fishing access on stable, safely reachable ground. We do not advertise dam, shoreline, wetland, or dredging work.",
  },
  {
    q: "Can you clear a future home site?",
    a: "We can discuss vegetation and initial site clearing. Foundation excavation, engineered pads, utility trenching, and final grade are not current promises — Site Work can follow when dirt work is the next step.",
  },
  {
    q: "What happens to the vegetation after forestry mulching?",
    a: "It is typically processed on site into a chip layer, which can reduce hauling or burning. If material must leave the property, that is a separate hauling conversation.",
  },
  {
    q: "Do I need to know how many acres need cleared?",
    a: "A guess helps. Photos, a short video, or an optional map outline can be enough to start. Acreage may be adjusted after review.",
  },
  {
    q: "Can I send photos or video for an estimate?",
    a: "Yes — that is the fastest way to start. A wide view, the thickest vegetation, access, gates, and slopes help.",
  },
  {
    q: "Can you clear fence lines?",
    a: "Yes, when access and utilities allow. Tell us about wire, posts, and what should stay.",
  },
  {
    q: "Can you remove honeysuckle?",
    a: "Mechanical clearing can remove and process existing above-ground growth. That does not permanently eradicate invasive species. Some stands need ongoing landowner management. We do not apply herbicide unless that service is added later.",
  },
  {
    q: "Can Morris also remove junk or debris from the property?",
    a: "Often yes. Land clearing, junk removal, and hauling can be coordinated so one company handles the vegetation and the debris that is not vegetation.",
  },
] as const;

/** Related catalog slugs used to auto-surface published projects. */
export const RELATED_PROJECT_SLUGS: Record<string, string[]> = {
  "forestry-mulching": ["forestry-mulching", "brush-clearing", "selective-clearing"],
  "honeysuckle-clearing": ["honeysuckle-clearing", "brush-clearing", "forestry-mulching"],
  "selective-clearing": ["selective-clearing", "forestry-mulching", "property-reclamation"],
  "pasture-field-reclamation": ["pasture-field-reclamation", "brush-clearing", "property-reclamation"],
  "hunting-property-clearing": ["hunting-property-clearing", "trail-clearing", "pasture-field-reclamation"],
  "property-reclamation": ["property-reclamation", "brush-clearing", "forestry-mulching"],
  "trail-clearing": ["trail-clearing", "hunting-property-clearing", "fence-line-clearing"],
};

export const DEDICATED_LAND_CLEARING_SLUGS = [
  "selective-clearing",
  "pasture-field-reclamation",
  "hunting-property-clearing",
] as const;

export const HUB_ONLY_INTENT_SECTIONS = [
  {
    id: "road-field-encroachment",
    title: "Road and field-edge clearing",
    body: "Vegetation can slowly narrow a private road, farm lane, driveway, or field edge. We can discuss restoring usable width and access where terrain and property conditions allow.",
    goal: "road_field_encroachment" as const,
    links: [
      { href: "/land-clearing/trail-clearing", label: "Trail clearing" },
      { href: "/land-clearing/fence-line-clearing", label: "Fence-line clearing" },
    ],
  },
  {
    id: "pond-lake-access",
    title: "Pond and lake access",
    body: "We can discuss vegetation work that reopens a walking path, fishing access, or a view to a pond. We do not advertise dam repair, shoreline engineering, wetland work, dredging, or work on unstable banks.",
    goal: "pond_lake_access" as const,
    links: [{ href: "/land-clearing/trail-clearing", label: "Trail clearing" }],
  },
  {
    id: "home-site-vegetation",
    title: "Home-site vegetation clearing",
    body: "If you intend to build a home, garage, barn, or shop, we can discuss vegetation and initial site clearing. This is not foundation excavation, engineered pads, utility trenching, or final grade. Site Work can follow when dirt work is the next step.",
    goal: "home_site_vegetation" as const,
    links: [
      { href: "/land-clearing/lot-clearing", label: "Lot clearing" },
      { href: "/site-work", label: "Site Work" },
      { href: "/hauling", label: "Hauling" },
    ],
  },
  {
    id: "real-estate-cleanup",
    title: "Real-estate property cleanup",
    body: "Neglected acreage and houses often need more than one trade. Morris can coordinate junk removal, brush clearing, debris cleanup, hauling, and available site work so a listing, estate, or turnover is not five separate vendors.",
    goal: "real_estate_cleanup" as const,
    links: [
      { href: "/junk-removal", label: "Junk Removal" },
      { href: "/hauling", label: "Hauling" },
      { href: "/land-clearing/property-reclamation", label: "Property reclamation" },
    ],
  },
] as const;
