import type { PricingBreakdownLine } from "@/types/job";

/** Customer-facing line order — transportation early, after pickup service. */
const CUSTOMER_LINE_ORDER: string[] = [
  "service_call",
  "transportation",
  "junk_removal",
  "heavy",
  "special_disposal",
  "stairs",
  "basement",
  "attic",
  "tight",
  "long_carry",
  "disposal",
  "priority",
  "flexible_scheduling",
];

const DISPLAY_LABELS: Record<string, string> = {
  service_call: "Removal Service",
  junk_removal: "Item Removal",
  disposal: "Disposal & Recycling",
  heavy: "Heavy item handling",
  special_disposal: "Special recycling handling",
  stairs: "Stairs / elevated access",
  basement: "Basement access",
  attic: "Attic access",
  tight: "Tight access",
  long_carry: "Long carry distance",
  priority: "Priority scheduling",
  flexible_scheduling: "Flexible scheduling savings",
};

export function getCustomerDisplayLabel(line: PricingBreakdownLine): string {
  if (line.id === "junk_removal") return line.label;
  return DISPLAY_LABELS[line.id] ?? line.label;
}

export function orderCustomerPricingLines(lines: PricingBreakdownLine[]): PricingBreakdownLine[] {
  const visible = lines.filter((l) => !l.internal);
  return [...visible].sort((a, b) => {
    const ai = CUSTOMER_LINE_ORDER.indexOf(a.id);
    const bi = CUSTOMER_LINE_ORDER.indexOf(b.id);
    const aRank = ai === -1 ? 999 : ai;
    const bRank = bi === -1 ? 999 : bi;
    return aRank - bRank;
  });
}

export function splitPricingLinesForDisplay(lines: PricingBreakdownLine[]) {
  const ordered = orderCustomerPricingLines(lines);
  const transport = ordered.find((l) => l.id === "transportation");
  const rest = ordered.filter((l) => l.id !== "transportation");
  return { transport, rest };
}
