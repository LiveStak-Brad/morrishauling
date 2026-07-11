import { morrisConfig } from "@/lib/morris-config";
import type { BillingLineItem } from "@/types/billing";

export interface StandardChargePreset {
  id: string;
  label: string;
  description: string;
  defaultAmount: number;
  category: BillingLineItem["category"];
  /** Negative amounts are discounts / credits */
  kind: "add" | "discount";
}

/** Typical owner/manager adjustments for junk & hauling estimates. */
export function getStandardChargePresets(): StandardChargePreset[] {
  const p = morrisConfig.junkRemovalPricing;
  return [
    {
      id: "stairs",
      label: "Stairs / elevated access",
      description: "Per flight of stairs",
      defaultAmount: p.stairsFeePerFlight,
      category: "access",
      kind: "add",
    },
    {
      id: "long_carry",
      label: "Long carry",
      description: `Carry beyond ${p.longCarryFeeThresholdFt} ft`,
      defaultAmount: p.longCarryFee,
      category: "access",
      kind: "add",
    },
    {
      id: "heavy",
      label: "Heavy item handling",
      description: "Extra labor for heavy items",
      defaultAmount: p.heavyItemFee,
      category: "labor",
      kind: "add",
    },
    {
      id: "special_disposal",
      label: "Special recycling handling",
      description: "Freon, mattress, or restricted materials",
      defaultAmount: p.specialDisposalFee,
      category: "disposal",
      kind: "add",
    },
    {
      id: "basement",
      label: "Basement access",
      description: "Items located in basement",
      defaultAmount: 40,
      category: "access",
      kind: "add",
    },
    {
      id: "attic",
      label: "Attic access",
      description: "Items located in attic",
      defaultAmount: 60,
      category: "access",
      kind: "add",
    },
    {
      id: "tight_access",
      label: "Tight / difficult access",
      description: "Narrow halls, gates, or limited truck access",
      defaultAmount: 50,
      category: "access",
      kind: "add",
    },
    {
      id: "weight_adjustment",
      label: "Weight adjustment",
      description: "Heavier than described",
      defaultAmount: 75,
      category: "adjustment",
      kind: "add",
    },
    {
      id: "size_adjustment",
      label: "Size / volume adjustment",
      description: "Larger load or sleeper / oversized item",
      defaultAmount: 50,
      category: "adjustment",
      kind: "add",
    },
    {
      id: "extra_labor",
      label: "Extra labor",
      description: "Additional crew time on site",
      defaultAmount: 58,
      category: "labor",
      kind: "add",
    },
    {
      id: "disassembly",
      label: "Disassembly required",
      description: "Take-apart before removal",
      defaultAmount: 45,
      category: "labor",
      kind: "add",
    },
    {
      id: "misc",
      label: "Miscellaneous",
      description: "Custom charge — edit label and amount",
      defaultAmount: 0,
      category: "custom",
      kind: "add",
    },
    {
      id: "discount_onsite",
      label: "On-site discount",
      description: "Reduce total when conditions are simpler than estimated",
      defaultAmount: -50,
      category: "discount",
      kind: "discount",
    },
    {
      id: "discount_courtesy",
      label: "Courtesy / goodwill discount",
      description: "Owner or manager courtesy adjustment",
      defaultAmount: -25,
      category: "discount",
      kind: "discount",
    },
    {
      id: "discount_percent_ready",
      label: "High-estimate discount",
      description: "Manual discount when the quote looks high on site",
      defaultAmount: -100,
      category: "discount",
      kind: "discount",
    },
  ];
}

export function presetToLineItem(preset: StandardChargePreset, overrides?: Partial<BillingLineItem>): BillingLineItem {
  const amount = overrides?.amount ?? preset.defaultAmount;
  const unitPrice = overrides?.unitPrice ?? amount;
  return {
    id: `adj-${preset.id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    label: overrides?.label ?? preset.label,
    description: overrides?.description ?? preset.description,
    quantity: overrides?.quantity ?? 1,
    unitPrice,
    amount,
    category: preset.category,
    sortOrder: overrides?.sortOrder,
  };
}

/** True when stored lines are empty placeholders and should be replaced from job pricing. */
export function lineItemsNeedHydration(lines: BillingLineItem[], estimatedTotal: number): boolean {
  if (!lines.length && estimatedTotal > 0) return true;
  const sum = lines.reduce((s, l) => s + (Number(l.amount) || 0), 0);
  if (estimatedTotal > 0 && Math.abs(sum) < 0.01) return true;
  if (
    lines.length === 1 &&
    /^(custom item|line item)$/i.test(lines[0].label.trim()) &&
    (Number(lines[0].amount) || 0) === 0 &&
    estimatedTotal > 0
  ) {
    return true;
  }
  return false;
}
