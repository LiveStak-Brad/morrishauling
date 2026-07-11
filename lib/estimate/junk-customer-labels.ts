import { getCommonJunkItem } from "@/lib/common-junk-items";
import { getBookingCategory } from "@/lib/booking-categories";
import type { JunkEstimateMode, SelectedCommonItem } from "@/types/junk-removal";
import type { LoadSizeTier } from "@/types/job";
import { JUNK_VOLUME_TIER_LABELS } from "@/types/junk-removal";

const CLEANOUT_CATEGORY_SUFFIX: Record<string, string> = {
  garage: "Garage Cleanout",
  estate: "Estate Cleanout",
  appliance: "Appliance Removal",
  furniture: "Furniture Cleanout",
  construction: "Construction Debris Removal",
  mattress: "Mattress Removal",
  yard: "Yard Waste Removal",
  storage: "Storage Cleanout",
  hottub: "Hot Tub Removal",
  rental: "Rental Property Cleanout",
  commercial: "Commercial Cleanout",
  office: "Office Cleanout",
};

function itemRemovalLabel(name: string): string {
  const trimmed = name.trim();
  if (/removal$/i.test(trimmed)) return trimmed;
  return `${trimmed} Removal`;
}

/** Customer-facing line label for the main junk removal charge. */
export function buildJunkRemovalLineLabel(input: {
  mode: JunkEstimateMode;
  selectedItems?: SelectedCommonItem[];
  junkCategory?: string;
  loadSizeTier?: LoadSizeTier;
}): string {
  if (input.mode === "single_item" && input.selectedItems?.length) {
    if (input.selectedItems.length === 1) {
      const sel = input.selectedItems[0];
      const cfg = getCommonJunkItem(sel.itemId);
      const name = cfg?.name ?? sel.customName ?? "Item";
      return itemRemovalLabel(name);
    }
    const names = input.selectedItems.map((s) => getCommonJunkItem(s.itemId)?.name ?? s.customName);
    const allAppliance = names.every((n) =>
      /refrigerator|washer|dryer|stove|appliance|freezer|dishwasher/i.test(n ?? "")
    );
    if (allAppliance) return "Appliance Removal";
    return "Item Removal";
  }

  if (input.junkCategory) {
    const preset = CLEANOUT_CATEGORY_SUFFIX[input.junkCategory];
    if (preset) return preset;
    const cat = getBookingCategory(input.junkCategory);
    if (cat) {
      if (/cleanout/i.test(cat.name)) return cat.name;
      return `${cat.name} Cleanout`;
    }
  }

  if (input.loadSizeTier) {
    return JUNK_VOLUME_TIER_LABELS[input.loadSizeTier] ?? "Volume Pickup";
  }

  return "Junk Removal";
}

/** Customer-facing disposal label — never expose facility names. */
export const CUSTOMER_DISPOSAL_HEADING = "Responsible Disposal & Recycling";

export const CUSTOMER_DISPOSAL_PROCESS =
  "Whenever possible, items are sorted for donation, recycling, or responsible disposal in accordance with local regulations. Our crews transport materials to the most appropriate licensed recycling or disposal facilities based on the items collected.";

/**
 * @deprecated Do not show facility names to customers. Prefer CUSTOMER_DISPOSAL_HEADING.
 * Kept for any legacy callers; always returns the safe customer label.
 */
export function formatCustomerDisposalSiteName(_name?: string): string {
  return CUSTOMER_DISPOSAL_HEADING;
}

/** Onsite time range from estimated labor minutes. */
export function formatOnsiteTimeRange(laborMinutes: number): string {
  const center = Math.max(30, Math.round(laborMinutes / 15) * 15);
  const low = Math.max(15, center - 15);
  const high = center + 15;
  if (low >= 45 && high <= 90) {
    return `Approximately ${low}–${high} minutes (depending on access, item condition, and loading requirements)`;
  }
  return `Approximately ${low}–${high} minutes`;
}

export function formatCrewLabel(crewSize: number): string {
  if (crewSize <= 1) return "1-person crew";
  return `${crewSize}-person crew`;
}
