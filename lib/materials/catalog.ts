import type { DivisionId } from "@/lib/divisions";
import type { MaterialCategory } from "@/types/division";

/** Seed material catalog used when DB table is unavailable. */
export const DEFAULT_JUNK_MATERIAL_CATEGORIES: MaterialCategory[] = [
  { id: "mat-general", name: "General household junk", divisionId: "junk_removal", policy: "accepted", disposalHint: "Municipal / transfer station" },
  { id: "mat-furniture", name: "Furniture", divisionId: "junk_removal", policy: "accepted", disposalHint: "Transfer station or donation" },
  { id: "mat-appliances", name: "Appliances", divisionId: "junk_removal", policy: "accepted", notes: "Freon units may require certified recovery", disposalHint: "Appliance / scrap yard" },
  { id: "mat-electronics", name: "Electronics", divisionId: "junk_removal", policy: "restricted", notes: "E-waste rules vary by county", disposalHint: "E-waste recycler" },
  { id: "mat-metal", name: "Metal", divisionId: "junk_removal", policy: "accepted", disposalHint: "Scrap yard" },
  { id: "mat-yard", name: "Yard waste", divisionId: "junk_removal", policy: "accepted", disposalHint: "Yard waste facility" },
  { id: "mat-construction", name: "Construction debris", divisionId: "junk_removal", policy: "accepted", disposalHint: "C&D landfill" },
  { id: "mat-mattress", name: "Mattresses", divisionId: "junk_removal", policy: "accepted", notes: "May incur surcharge", disposalHint: "Transfer station" },
  { id: "mat-tires", name: "Tires", divisionId: "junk_removal", policy: "restricted", notes: "Quantity limits and fees apply", disposalHint: "Tire recycler" },
  { id: "mat-paint", name: "Paint or chemicals", divisionId: "junk_removal", policy: "prohibited", notes: "Household hazardous waste — not accepted on standard loads", disposalHint: "County HHW event" },
  { id: "mat-refrigerant", name: "Refrigerators and air conditioners", divisionId: "junk_removal", policy: "restricted", notes: "Requires refrigerant recovery", disposalHint: "Certified appliance recycler" },
  { id: "mat-shingles", name: "Shingles", divisionId: "junk_removal", policy: "restricted", notes: "Weight and disposal fees apply", disposalHint: "C&D landfill" },
];

export function materialsForDivision(divisionId: DivisionId): MaterialCategory[] {
  if (divisionId === "junk_removal") return DEFAULT_JUNK_MATERIAL_CATEGORIES;
  return [];
}

export function recommendDisposalHint(categoryIds: string[]): string | null {
  const cats = DEFAULT_JUNK_MATERIAL_CATEGORIES.filter((c) => categoryIds.includes(c.id));
  if (cats.some((c) => c.policy === "prohibited")) {
    return "One or more items are prohibited on standard loads — schedule a special disposal consult.";
  }
  const restricted = cats.filter((c) => c.policy === "restricted");
  if (restricted.length) {
    return `Restricted materials noted (${restricted.map((c) => c.name).join(", ")}). ${restricted[0].disposalHint ?? ""}`.trim();
  }
  const hint = cats.find((c) => c.disposalHint)?.disposalHint;
  return hint ?? "Transfer station / municipal disposal based on service area.";
}
