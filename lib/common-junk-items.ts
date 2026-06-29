import type { DisposalCategory } from "@/types/disposal";

export interface CommonJunkItemConfig {
  id: string;
  name: string;
  basePrice: number;
  laborMinutes: number;
  crewSize: number;
  loadPercentage: number;
  heavy: boolean;
  specialDisposal: boolean;
  disposalFee: number;
  disposalCategory: DisposalCategory;
  notes?: string;
}

function item(
  id: string,
  name: string,
  basePrice: number,
  opts: Partial<Omit<CommonJunkItemConfig, "id" | "name" | "basePrice">> & {
    disposalCategory?: DisposalCategory;
  } = {}
): CommonJunkItemConfig {
  return {
    id,
    name,
    basePrice,
    laborMinutes: opts.laborMinutes ?? 20,
    crewSize: opts.crewSize ?? 1,
    loadPercentage: opts.loadPercentage ?? 10,
    heavy: opts.heavy ?? false,
    specialDisposal: opts.specialDisposal ?? false,
    disposalFee: opts.disposalFee ?? 0,
    disposalCategory: opts.disposalCategory ?? "general_junk",
    notes: opts.notes,
  };
}

/** Placeholder pricing — tune in morris-config / admin later */
export const COMMON_JUNK_ITEMS: CommonJunkItemConfig[] = [
  item("couch", "Couch", 95, { laborMinutes: 25, loadPercentage: 12, disposalCategory: "general_junk" }),
  item("loveseat", "Loveseat", 85, { laborMinutes: 20, loadPercentage: 10, disposalCategory: "general_junk" }),
  item("recliner", "Recliner", 90, { laborMinutes: 22, loadPercentage: 10, disposalCategory: "general_junk" }),
  item("mattress", "Mattress", 75, { laborMinutes: 15, loadPercentage: 8, disposalCategory: "mattress" }),
  item("box_spring", "Box spring", 65, { laborMinutes: 15, loadPercentage: 8, disposalCategory: "mattress" }),
  item("washer", "Washer", 95, { laborMinutes: 25, heavy: true, loadPercentage: 12, disposalCategory: "scrap_metal" }),
  item("dryer", "Dryer", 90, { laborMinutes: 22, heavy: true, loadPercentage: 10, disposalCategory: "scrap_metal" }),
  item("refrigerator", "Refrigerator", 125, { laborMinutes: 30, crewSize: 2, heavy: true, specialDisposal: true, disposalFee: 35, loadPercentage: 15, disposalCategory: "freon_appliance" }),
  item("freezer", "Freezer", 110, { laborMinutes: 28, crewSize: 2, heavy: true, specialDisposal: true, disposalFee: 30, loadPercentage: 12, disposalCategory: "freon_appliance" }),
  item("stove", "Stove / oven", 95, { laborMinutes: 25, heavy: true, loadPercentage: 10, disposalCategory: "scrap_metal" }),
  item("dishwasher", "Dishwasher", 85, { laborMinutes: 22, heavy: true, loadPercentage: 8, disposalCategory: "appliance" }),
  item("water_heater", "Water heater", 110, { laborMinutes: 30, crewSize: 2, heavy: true, specialDisposal: true, disposalFee: 25, loadPercentage: 12, disposalCategory: "appliance" }),
  item("tv", "TV", 65, { laborMinutes: 12, loadPercentage: 5, disposalCategory: "electronics" }),
  item("desk", "Desk", 75, { laborMinutes: 18, loadPercentage: 8, disposalCategory: "general_junk" }),
  item("dresser", "Dresser", 85, { laborMinutes: 22, loadPercentage: 10, disposalCategory: "general_junk" }),
  item("dining_table", "Dining table", 90, { laborMinutes: 25, loadPercentage: 12, disposalCategory: "general_junk" }),
  item("chair", "Chair", 35, { laborMinutes: 8, loadPercentage: 3, disposalCategory: "general_junk" }),
  item("exercise_equipment", "Exercise equipment", 110, { laborMinutes: 35, crewSize: 2, heavy: true, loadPercentage: 15, disposalCategory: "scrap_metal" }),
  item("treadmill", "Treadmill", 125, { laborMinutes: 40, crewSize: 2, heavy: true, loadPercentage: 18, disposalCategory: "scrap_metal" }),
  item("grill", "Grill", 70, { laborMinutes: 18, loadPercentage: 8, disposalCategory: "scrap_metal" }),
  item("toilet", "Toilet", 55, { laborMinutes: 15, loadPercentage: 5, disposalCategory: "general_junk" }),
  item("door", "Door", 45, { laborMinutes: 12, loadPercentage: 5, disposalCategory: "general_junk" }),
  item("tire", "Tire", 25, { laborMinutes: 8, loadPercentage: 3, specialDisposal: true, disposalFee: 5, disposalCategory: "tire" }),
  item("bagged_trash", "Bagged trash", 45, { laborMinutes: 10, loadPercentage: 5, disposalCategory: "general_junk" }),
  item("hot_tub", "Hot tub", 450, { laborMinutes: 180, crewSize: 3, heavy: true, specialDisposal: true, disposalFee: 85, loadPercentage: 75, disposalCategory: "bulky_special", notes: "Requires review" }),
  item("piano", "Piano", 350, { laborMinutes: 120, crewSize: 3, heavy: true, loadPercentage: 40, disposalCategory: "heavy_special", notes: "Requires review" }),
  item("safe", "Safe", 275, { laborMinutes: 90, crewSize: 3, heavy: true, loadPercentage: 25, disposalCategory: "heavy_special", notes: "Requires review" }),
  item("other", "Other", 75, { laborMinutes: 25, loadPercentage: 10, disposalCategory: "general_junk", notes: "Custom item — review likely" }),
];

export function getCommonJunkItem(id: string): CommonJunkItemConfig | undefined {
  return COMMON_JUNK_ITEMS.find((i) => i.id === id);
}
