/**
 * Staff-recorded material handling outcomes for junk jobs.
 * Never auto-fabricate — only display what crew/admin records.
 */

export const MATERIAL_HANDLING_OUTCOMES = [
  { id: "donated", label: "Donated", customerLabel: "Donated" },
  { id: "recycled", label: "Recycled", customerLabel: "Recycled" },
  { id: "reused", label: "Reused", customerLabel: "Reused" },
  { id: "scrap_recovery", label: "Scrap recovery", customerLabel: "Scrap recovery" },
  { id: "specialty_disposal", label: "Specialty disposal", customerLabel: "Specialty disposal" },
  { id: "landfill_disposal", label: "Landfill / transfer disposal", customerLabel: "Disposed appropriately" },
  { id: "mixed_outcome", label: "Mixed outcome", customerLabel: "Mixed handling" },
] as const;

export type MaterialHandlingOutcomeId = (typeof MATERIAL_HANDLING_OUTCOMES)[number]["id"];

export type MaterialHandlingOutcomeLine = {
  /** Short customer-safe material label, e.g. "Scrap metal" */
  label: string;
  outcome: MaterialHandlingOutcomeId;
};

export function materialHandlingCustomerLabel(outcome: MaterialHandlingOutcomeId): string {
  return (
    MATERIAL_HANDLING_OUTCOMES.find((o) => o.id === outcome)?.customerLabel ??
    "Handled appropriately"
  );
}

export function formatMaterialHandlingSummary(
  lines: MaterialHandlingOutcomeLine[] | undefined | null
): Array<{ label: string; outcomeLabel: string }> {
  if (!lines?.length) return [];
  return lines
    .filter((l) => l.label.trim() && l.outcome)
    .map((l) => ({
      label: l.label.trim(),
      outcomeLabel: materialHandlingCustomerLabel(l.outcome),
    }));
}
