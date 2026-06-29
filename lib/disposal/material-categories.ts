/** Canonical material categories for disposal facility acceptance. */
export type MaterialCategory =
  | "household_trash"
  | "mixed_junk"
  | "general_junk"
  | "furniture"
  | "appliances"
  | "freon_appliances"
  | "freon"
  | "construction_demolition"
  | "mixed_cd"
  | "concrete"
  | "brick"
  | "drywall"
  | "asphalt"
  | "roofing"
  | "wood"
  | "clean_fill"
  | "dirt"
  | "rock"
  | "scrap_metal"
  | "copper"
  | "steel"
  | "aluminum"
  | "yard_waste"
  | "brush"
  | "leaves"
  | "tree_limbs"
  | "logs"
  | "stumps"
  | "mattresses"
  | "electronics"
  | "tires"
  | "cardboard"
  | "recycling"
  | "hazardous_waste"
  | "paint"
  | "oil"
  | "batteries"
  | "propane"
  | "commercial_waste";

export const MATERIAL_CATEGORY_LABELS: Record<MaterialCategory, string> = {
  household_trash: "Household Trash",
  mixed_junk: "Mixed Junk",
  general_junk: "General Junk",
  furniture: "Furniture",
  appliances: "Appliances",
  freon_appliances: "Freon Appliances",
  freon: "Freon",
  construction_demolition: "Construction Debris",
  mixed_cd: "Mixed C&D",
  concrete: "Concrete",
  brick: "Brick",
  drywall: "Drywall",
  asphalt: "Asphalt",
  roofing: "Roofing",
  wood: "Wood",
  clean_fill: "Clean Fill",
  dirt: "Dirt",
  rock: "Rock",
  scrap_metal: "Metal",
  copper: "Copper",
  steel: "Steel",
  aluminum: "Aluminum",
  yard_waste: "Yard Waste",
  brush: "Brush",
  leaves: "Leaves",
  tree_limbs: "Tree Limbs",
  logs: "Logs",
  stumps: "Stumps",
  mattresses: "Mattresses",
  electronics: "Electronics",
  tires: "Tires",
  cardboard: "Cardboard",
  recycling: "Recycling",
  hazardous_waste: "Hazardous Waste",
  paint: "Paint",
  oil: "Oil",
  batteries: "Batteries",
  propane: "Propane",
  commercial_waste: "Commercial Waste",
};

export const MATERIAL_CATEGORY_GROUPS: Array<{
  id: string;
  label: string;
  categories: MaterialCategory[];
}> = [
  {
    id: "general",
    label: "General",
    categories: ["household_trash", "mixed_junk", "general_junk", "furniture", "commercial_waste"],
  },
  {
    id: "construction",
    label: "Construction",
    categories: ["construction_demolition", "mixed_cd", "concrete", "brick", "drywall", "asphalt", "roofing", "wood", "clean_fill", "dirt", "rock"],
  },
  {
    id: "metal",
    label: "Metal",
    categories: ["scrap_metal", "copper", "steel", "aluminum"],
  },
  {
    id: "specialty",
    label: "Specialty",
    categories: ["appliances", "freon_appliances", "freon", "electronics", "tires", "mattresses", "propane"],
  },
  {
    id: "yard",
    label: "Yard",
    categories: ["yard_waste", "brush", "leaves", "tree_limbs", "logs", "stumps"],
  },
  {
    id: "recycling",
    label: "Recycling",
    categories: ["cardboard", "recycling"],
  },
  {
    id: "hazardous",
    label: "Hazardous",
    categories: ["hazardous_waste", "paint", "oil", "batteries"],
  },
];

export const ALL_MATERIAL_CATEGORIES = Object.keys(MATERIAL_CATEGORY_LABELS) as MaterialCategory[];

/** Legacy slug → expanded material categories. */
export const LEGACY_MATERIAL_MAP: Record<string, MaterialCategory[]> = {
  general_junk: ["mixed_junk", "general_junk", "household_trash", "furniture"],
  construction_debris: ["construction_demolition", "mixed_cd", "mixed_junk", "concrete", "wood"],
  yard_waste: ["yard_waste", "brush", "leaves", "tree_limbs"],
  bulky_special: ["mixed_junk", "furniture", "construction_demolition"],
  heavy_special: ["construction_demolition", "concrete", "rock", "mixed_junk"],
  mattress: ["mattresses"],
  appliance: ["appliances"],
  freon_appliance: ["freon_appliances", "freon", "appliances"],
  scrap_metal: ["scrap_metal", "steel", "aluminum", "copper"],
  electronics: ["electronics"],
  tire: ["tires"],
};

const ALL_MATERIALS = new Set<string>(Object.keys(MATERIAL_CATEGORY_LABELS));

export function normalizeAcceptedMaterials(raw: string[] | undefined | null): MaterialCategory[] {
  if (!raw?.length) return [];
  const out = new Set<MaterialCategory>();
  for (const slug of raw) {
    if (ALL_MATERIALS.has(slug)) {
      out.add(slug as MaterialCategory);
      continue;
    }
    const mapped = LEGACY_MATERIAL_MAP[slug];
    if (mapped) mapped.forEach((m) => out.add(m));
  }
  return [...out];
}

export function facilityAcceptsMaterials(
  accepted: string[] | undefined,
  required: MaterialCategory[]
): boolean {
  if (!required.length) return true;
  const normalized = normalizeAcceptedMaterials(accepted);
  return required.every((m) => normalized.includes(m));
}

export function materialFilterMatches(accepted: string[] | undefined, filterId: string): boolean {
  const normalized = normalizeAcceptedMaterials(accepted);
  const filterMap: Record<string, MaterialCategory[]> = {
    appliances: ["appliances", "freon_appliances", "freon"],
    construction: ["construction_demolition", "mixed_cd", "concrete", "brick", "drywall", "wood", "roofing"],
    yard_waste: ["yard_waste", "brush", "leaves", "tree_limbs", "logs", "stumps"],
    electronics: ["electronics"],
    hazardous: ["hazardous_waste", "paint", "oil", "batteries", "propane"],
    tires: ["tires"],
    mattresses: ["mattresses"],
    concrete: ["concrete", "construction_demolition"],
    metal: ["scrap_metal", "copper", "steel", "aluminum"],
  };
  const needed = filterMap[filterId];
  if (!needed) return true;
  return needed.some((m) => normalized.includes(m));
}
