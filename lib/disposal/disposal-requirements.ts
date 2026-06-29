import type { Job } from "@/types/job";

/** Admin-only reasons to skip disposal entirely for a job. */
export const DISPOSAL_SKIP_REASONS = [
  { id: "customer_kept_items", label: "Customer kept items" },
  { id: "donation_dropoff", label: "Donation drop-off" },
  { id: "scrap_no_charge", label: "Scrap/recycling — no charge" },
  { id: "combined_load", label: "Combined with another load" },
  { id: "not_required", label: "Disposal not required" },
  { id: "other", label: "Other" },
] as const;

export type DisposalSkipReason = (typeof DISPOSAL_SKIP_REASONS)[number]["id"];

/** Reasons when disposal occurred but cost was $0. */
export const NO_DISPOSAL_COST_REASONS = [
  { id: "scrap_recycling_no_charge", label: "Scrap/recycling — no charge" },
  { id: "donation_dropoff", label: "Donation drop-off" },
  { id: "customer_kept_items", label: "Customer kept remaining items" },
  { id: "promotional_waiver", label: "Promotional / waived fee" },
  { id: "other", label: "Other" },
] as const;

export type NoDisposalCostReason = (typeof NO_DISPOSAL_COST_REASONS)[number]["id"];

export type DisposalReviewStatus = "pending" | "approved" | "flagged" | "correction_requested";

/** Default threshold: actual disposal > estimate by this fraction triggers alert. */
export const DISPOSAL_COST_OVERRUN_THRESHOLD = 0.15;

/** Default minimum acceptable margin after disposal (%). */
export const DISPOSAL_MARGIN_FLOOR = 25;

/** Wait time above this (minutes) triggers alert. */
export const DISPOSAL_HIGH_WAIT_MINUTES = 45;

export function jobRequiresDisposal(job: Job): boolean {
  if (job.serviceType !== "junk_removal") return false;
  const jrd = job.junkRemovalDetails;
  if (!jrd) return false;
  if (jrd.disposalSkipReason) return false;
  return true;
}

export function isDisposalRecorded(job: Job): boolean {
  const jrd = job.junkRemovalDetails;
  if (!jrd) return false;
  return Boolean(jrd.disposalCompletedAt);
}

export function isDisposalSatisfied(job: Job): boolean {
  if (!jobRequiresDisposal(job)) return true;
  const jrd = job.junkRemovalDetails!;
  return Boolean(jrd.disposalCompletedAt || jrd.disposalSkipReason);
}

export function canMarkJobCompleted(job: Job): { ok: true } | { ok: false; message: string } {
  if (job.status === "completed" || job.status === "cancelled") {
    return { ok: true };
  }
  if (!jobRequiresDisposal(job)) return { ok: true };
  if (isDisposalSatisfied(job)) return { ok: true };
  return {
    ok: false,
    message:
      "Disposal must be recorded before completing this job. Record actuals at the facility, or ask dispatch to skip disposal with a reason.",
  };
}

export function disposalSkipLabel(id?: string): string {
  return DISPOSAL_SKIP_REASONS.find((r) => r.id === id)?.label ?? id ?? "—";
}

export function noCostLabel(id?: string): string {
  return NO_DISPOSAL_COST_REASONS.find((r) => r.id === id)?.label ?? id ?? "—";
}
