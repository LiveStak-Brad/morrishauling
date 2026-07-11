import type { EstimateWorkflowStatus } from "@/types/billing";
import type { Job } from "@/types/job";
import type { Invoice } from "@/types/payment";
import { canMarkJobCompleted, jobRequiresDisposal, isDisposalSatisfied } from "@/lib/disposal/disposal-requirements";
import { canCompleteWithProof, toLegacyJobStatus } from "@/lib/jobs/workflow";
import { serviceTypeToDivision } from "@/lib/divisions";

/** Visible estimate buckets for owner console (not every DB status). */
export type EstimateQueueGroup = "to_approve" | "final_agreed" | "completed";

export type JobQueueGroup =
  | "needs_scheduling"
  | "missing_assignments"
  | "scheduled"
  | "in_progress"
  | "awaiting_proof"
  | "ready_to_invoice"
  | "invoiced";

export type InvoiceQueueGroup =
  | "draft"
  | "ready_to_send"
  | "sent_unpaid"
  | "partially_paid"
  | "paid"
  | "overdue"
  | "void";

/** Staff still needs to act (not declined/closed). */
const TO_APPROVE: EstimateWorkflowStatus[] = [
  "draft",
  "internal_review",
  "ready_to_send",
  "sent",
  "viewed",
  "revised",
];

function jobMissingAssignments(job: Job): boolean {
  return (
    !(job.assignedEmployeeIds?.length) ||
    !job.assignedTruckId ||
    !job.assignedTrailerId
  );
}

export function estimateQueueGroup(input: {
  status: EstimateWorkflowStatus;
  jobStatus?: string | null;
  hasInvoice?: boolean;
  deletedAt?: string | null;
}): EstimateQueueGroup {
  if (input.deletedAt) return "completed";
  if (input.status === "declined" || input.status === "canceled" || input.status === "expired") {
    return "completed";
  }
  if (input.status === "converted" || input.status === "accepted") {
    if (input.hasInvoice || input.jobStatus === "completed") return "completed";
    return "final_agreed";
  }
  if (TO_APPROVE.includes(input.status)) return "to_approve";
  return "to_approve";
}

export function jobQueueGroup(job: Job, hasInvoice: boolean): JobQueueGroup {
  if (hasInvoice) return "invoiced";

  const legacy = toLegacyJobStatus(job.status);

  if (legacy === "completed") return "ready_to_invoice";
  if (legacy === "cancelled") return "invoiced"; // exclude from active queues via caller

  if (legacy === "needs_dump" || legacy === "in_progress") {
    const proof = canMarkJobCompleted(job);
    if (!proof.ok) return "awaiting_proof";
    return "in_progress";
  }

  if (!job.scheduledDate || ["submitted", "estimated", "draft"].includes(legacy)) {
    return "needs_scheduling";
  }

  if (jobMissingAssignments(job)) return "missing_assignments";

  if (legacy === "scheduled") return "scheduled";
  return "scheduled";
}

export function invoiceQueueGroup(invoice: Invoice, today = new Date().toISOString().slice(0, 10)): InvoiceQueueGroup {
  if (invoice.status === "void") return "void";
  if (invoice.status === "paid" || invoice.balanceDue <= 0) return "paid";
  if (invoice.status === "partially_paid" || invoice.status === "partial" || invoice.amountPaid > 0) {
    if (invoice.dueDate && invoice.dueDate < today && invoice.balanceDue > 0) return "overdue";
    return "partially_paid";
  }
  if (invoice.status === "overdue" || (invoice.dueDate && invoice.dueDate < today && invoice.balanceDue > 0)) {
    return "overdue";
  }
  if (invoice.status === "draft") return "draft";
  if (invoice.status === "ready_to_send") return "ready_to_send";
  return "sent_unpaid";
}

export function isEstimateEditable(status: EstimateWorkflowStatus): boolean {
  return !["converted", "canceled"].includes(status);
}

export function canDeleteEstimate(input: {
  status: EstimateWorkflowStatus;
  jobId?: string | null;
  jobStatus?: string | null;
  isOwner?: boolean;
}): { ok: boolean; reason?: string } {
  if (input.status === "converted" && input.jobId) {
    if (input.jobStatus === "cancelled" || input.jobStatus === "canceled") {
      return { ok: true };
    }
    if (input.isOwner) {
      return { ok: true }; // owner correction path — caller must supply reason
    }
    return {
      ok: false,
      reason: "Cannot delete an estimate after it was converted to an active job.",
    };
  }
  return { ok: true };
}

export function bothApprovalsPresent(input: {
  customerApprovedAt?: string | null;
  acceptedAt?: string | null;
  internalApprovedAt?: string | null;
}): boolean {
  const customerOk = Boolean(input.customerApprovedAt || input.acceptedAt);
  const internalOk = Boolean(input.internalApprovedAt);
  return customerOk && internalOk;
}

/** Invoice creation must re-check proof even if status is already completed. */
export function assertJobCompletableForInvoice(job: Job): void {
  if (job.status !== "completed") {
    throw new Error("Invoice requires a completed job. Mark the job complete with required proof first.");
  }
  if (job.completionOverrideReason?.trim()) return;

  const divisionId = job.divisionId ?? serviceTypeToDivision(job.serviceType);
  const photoCheck = canCompleteWithProof(job, divisionId);
  if (!photoCheck.ok) {
    throw new Error(
      photoCheck.message ||
        "Completion proof is incomplete. Add required photos or an authorized override."
    );
  }
  if (jobRequiresDisposal(job) && !isDisposalSatisfied(job)) {
    throw new Error(
      "Disposal must be recorded before invoicing this junk job, or an authorized override is required."
    );
  }
}
