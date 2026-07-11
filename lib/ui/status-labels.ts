/**
 * Canonical owner-facing status language for the customer-centered workflow.
 * Prefer these labels over raw DB status strings in Owner Console UI.
 */
import type { EstimateWorkflowStatus } from "@/types/billing";
import { ESTIMATE_STATUS_LABELS, INVOICE_STATUS_LABELS, DELIVERY_STATUS_LABELS } from "@/types/billing";
import { JOB_STATUS_LABELS } from "@/lib/jobs/workflow";

export { ESTIMATE_STATUS_LABELS, INVOICE_STATUS_LABELS, DELIVERY_STATUS_LABELS, JOB_STATUS_LABELS };

/** Owner queue / workflow labels (mutually exclusive buckets). */
export const ESTIMATE_QUEUE_LABELS = {
  to_approve: "Needs Approval",
  needs_internal: "Needs Approval",
  waiting_on_customer: "Waiting on Customer",
  final_agreed: "Agreed",
  completed: "Completed",
} as const;

export const JOB_QUEUE_LABELS = {
  needs_scheduling: "Needs Scheduling",
  missing_assignments: "Missing Assignment",
  scheduled: "Scheduled",
  in_progress: "In Progress",
  awaiting_proof: "Awaiting Proof",
  ready_to_invoice: "Ready to Invoice",
  invoiced: "Invoiced",
} as const;

export const INVOICE_QUEUE_LABELS = {
  draft: "Draft",
  ready_to_send: "Ready to Send",
  sent_unpaid: "Sent",
  partially_paid: "Partially Paid",
  paid: "Paid",
  overdue: "Overdue",
  void: "Void",
} as const;

export function labelEstimateStatus(status: string | undefined | null): string {
  if (!status) return "Unknown";
  if (status in ESTIMATE_STATUS_LABELS) {
    return ESTIMATE_STATUS_LABELS[status as EstimateWorkflowStatus];
  }
  return status.replace(/_/g, " ");
}

export function labelJobStatus(status: string | undefined | null): string {
  if (!status) return "Unknown";
  return JOB_STATUS_LABELS[status] ?? status.replace(/_/g, " ");
}

export function labelInvoiceStatus(status: string | undefined | null): string {
  if (!status) return "Unknown";
  if (status === "partial") return "Partially Paid";
  if (status in INVOICE_STATUS_LABELS) {
    return INVOICE_STATUS_LABELS[status as keyof typeof INVOICE_STATUS_LABELS];
  }
  return status.replace(/_/g, " ");
}

export function labelPaymentStatus(status: string | undefined | null): string {
  if (!status) return "Unknown";
  const map: Record<string, string> = {
    succeeded: "Paid",
    pending: "Pending",
    failed: "Failed",
    refunded: "Refunded",
    reversed: "Reversed",
  };
  return map[status] ?? status.replace(/_/g, " ");
}
