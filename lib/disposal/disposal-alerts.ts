import type { Job } from "@/types/job";
import {
  DISPOSAL_COST_OVERRUN_THRESHOLD,
  DISPOSAL_HIGH_WAIT_MINUTES,
  DISPOSAL_MARGIN_FLOOR,
  jobRequiresDisposal,
} from "@/lib/disposal/disposal-requirements";

export function buildDisposalFlags(job: Job): string[] {
  const jrd = job.junkRemovalDetails;
  if (!jrd) return [];
  const flags: string[] = [];

  if (jobRequiresDisposal(job) && job.status === "completed" && !jrd.disposalCompletedAt && !jrd.disposalSkipReason) {
    flags.push("completed_without_disposal");
  }
  if (jrd.disposalCompletedAt && !jrd.disposalReceiptUrl) {
    flags.push("missing_receipt");
  }
  if (jrd.disposalCompletedAt && !jrd.disposalWeightTicketUrl && (jrd.actualDisposalWeightTons ?? 0) > 0) {
    flags.push("missing_weight_ticket");
  }
  if (jrd.disposalOverrideReason) {
    flags.push("facility_override");
  }
  if (jrd.noDisposalCostReason || jrd.actualDisposalCost === 0) {
    flags.push("no_cost_disposal");
  }
  if (jrd.disposalSkipReason) {
    flags.push("disposal_skipped");
  }

  const est = jrd.estimatedDisposalCost ?? jrd.dumpFeeEstimate;
  const act = jrd.actualDisposalCost;
  if (est != null && act != null && est > 0 && act > est * (1 + DISPOSAL_COST_OVERRUN_THRESHOLD)) {
    flags.push("cost_over_estimate");
  }

  if ((jrd.actualDisposalWaitMinutes ?? 0) >= DISPOSAL_HIGH_WAIT_MINUTES) {
    flags.push("high_wait_time");
  }

  const margin = jrd.actualProfitMargin ?? jrd.estimatedMargin;
  if (margin != null && margin < DISPOSAL_MARGIN_FLOOR && jrd.disposalCompletedAt) {
    flags.push("low_margin");
  }

  return flags;
}

/** Mission Control alert messages from job disposal flags. */
export function disposalAlertsFromJobs(jobs: Job[]): Array<{
  severity: "urgent" | "warning" | "info";
  title: string;
  message: string;
  href: string;
}> {
  const alerts: Array<{ severity: "urgent" | "warning" | "info"; title: string; message: string; href: string }> = [];
  const href = "/admin/disposal-review";

  let missingReceipt = 0;
  let overEstimate = 0;
  let overrides = 0;
  let noCost = 0;
  let highWait = 0;
  let lowMargin = 0;
  let completedNoDisposal = 0;
  let needsDisposal = 0;

  for (const job of jobs) {
    if (job.serviceType !== "junk_removal") continue;
    const flags = buildDisposalFlags(job);
    if (flags.includes("missing_receipt")) missingReceipt++;
    if (flags.includes("cost_over_estimate")) overEstimate++;
    if (flags.includes("facility_override")) overrides++;
    if (flags.includes("no_cost_disposal")) noCost++;
    if (flags.includes("high_wait_time")) highWait++;
    if (flags.includes("low_margin")) lowMargin++;
    if (flags.includes("completed_without_disposal")) completedNoDisposal++;
  }

  needsDisposal = jobs.filter(
    (j) => j.serviceType === "junk_removal" && j.status === "needs_dump" && jobRequiresDisposal(j) && !j.junkRemovalDetails?.disposalCompletedAt
  ).length;

  if (completedNoDisposal) {
    alerts.push({ severity: "urgent", title: "Completed without disposal", message: `${completedNoDisposal} job(s) marked complete with no disposal record`, href });
  }
  if (needsDisposal) {
    alerts.push({ severity: "warning", title: "Awaiting disposal", message: `${needsDisposal} job(s) need disposal recorded`, href });
  }
  if (missingReceipt) {
    alerts.push({ severity: "warning", title: "Missing disposal receipts", message: `${missingReceipt} job(s) have no receipt uploaded`, href });
  }
  if (overEstimate) {
    alerts.push({ severity: "warning", title: "Disposal over estimate", message: `${overEstimate} job(s) exceeded disposal estimate by >${DISPOSAL_COST_OVERRUN_THRESHOLD * 100}%`, href });
  }
  if (lowMargin) {
    alerts.push({ severity: "warning", title: "Low margin after disposal", message: `${lowMargin} job(s) below ${DISPOSAL_MARGIN_FLOOR}% margin`, href });
  }
  if (overrides) {
    alerts.push({ severity: "info", title: "Disposal overrides", message: `${overrides} job(s) used a non-recommended facility`, href });
  }
  if (noCost) {
    alerts.push({ severity: "info", title: "No-cost disposal", message: `${noCost} job(s) recorded $0 disposal`, href });
  }
  if (highWait) {
    alerts.push({ severity: "info", title: "Long dump wait times", message: `${highWait} job(s) waited ${DISPOSAL_HIGH_WAIT_MINUTES}+ minutes`, href });
  }

  return alerts;
}
