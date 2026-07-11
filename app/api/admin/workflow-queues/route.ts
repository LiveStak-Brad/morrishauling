import { morrisConfig } from "@/lib/morris-config";
import { requireApiProfile } from "@/lib/api/require-profile";
import { apiOk, apiError } from "@/lib/api/route-utils";
import { listEstimates } from "@/lib/db/billing-operations";
import { getJobs, getInvoices } from "@/lib/db/operations";
import {
  estimateQueueGroup,
  jobQueueGroup,
  invoiceQueueGroup,
} from "@/lib/billing/workflow";

/** Real counts for Owner Console work queues. */
export async function GET() {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  if (!["admin", "planner"].includes(profile.role)) {
    return apiError("Admin access required", 403);
  }
  try {
    const companyId = morrisConfig.companyId;
    const [estimates, jobs, invoices] = await Promise.all([
      listEstimates(companyId),
      getJobs(companyId),
      getInvoices(companyId),
    ]);
    const invoiceByJob = new Map(invoices.map((i) => [i.jobId, i] as const));
    const jobById = new Map(jobs.map((j) => [j.id, j] as const));

    const estimateQueues = {
      needsInternalApproval: 0,
      waitingOnCustomer: 0,
      finalAgreed: 0,
      convertedToJob: 0,
      completed: 0,
      toApprove: 0,
    };
    for (const e of estimates) {
      const job = e.jobId ? jobById.get(e.jobId) : undefined;
      const group = estimateQueueGroup({
        status: e.status,
        jobStatus: job?.status,
        hasInvoice: e.jobId ? invoiceByJob.has(e.jobId) : false,
      });
      if (group === "to_approve") {
        estimateQueues.toApprove += 1;
        if (["sent", "viewed"].includes(e.status)) {
          estimateQueues.waitingOnCustomer += 1;
        } else if (["declined", "revised"].includes(e.status)) {
          // Still needs staff action, but not "internal approval" specifically
          estimateQueues.needsInternalApproval += 1;
        } else if (!e.internalApprovedAt) {
          estimateQueues.needsInternalApproval += 1;
        } else {
          estimateQueues.waitingOnCustomer += 1;
        }
      } else if (group === "final_agreed") {
        estimateQueues.finalAgreed += 1;
        if (e.status === "converted" || e.jobId) estimateQueues.convertedToJob += 1;
      } else {
        estimateQueues.completed += 1;
      }
    }

    const jobQueues = {
      needsScheduling: 0,
      missingAssignments: 0,
      scheduled: 0,
      inProgress: 0,
      awaitingProof: 0,
      readyToInvoice: 0,
      invoiced: 0,
    };
    for (const j of jobs) {
      if (["cancelled", "canceled"].includes(j.status)) continue;
      const g = jobQueueGroup(j, invoiceByJob.has(j.id));
      if (g === "needs_scheduling") jobQueues.needsScheduling += 1;
      if (g === "missing_assignments") jobQueues.missingAssignments += 1;
      if (g === "scheduled") jobQueues.scheduled += 1;
      if (g === "in_progress") jobQueues.inProgress += 1;
      if (g === "awaiting_proof") jobQueues.awaitingProof += 1;
      if (g === "ready_to_invoice") jobQueues.readyToInvoice += 1;
      if (g === "invoiced") jobQueues.invoiced += 1;
    }

    const invoiceQueues = {
      draft: 0,
      readyToSend: 0,
      sentUnpaid: 0,
      partiallyPaid: 0,
      paid: 0,
      overdue: 0,
      void: 0,
    };
    for (const i of invoices) {
      const g = invoiceQueueGroup(i);
      if (g === "draft") invoiceQueues.draft += 1;
      if (g === "ready_to_send") invoiceQueues.readyToSend += 1;
      if (g === "sent_unpaid") invoiceQueues.sentUnpaid += 1;
      if (g === "partially_paid") invoiceQueues.partiallyPaid += 1;
      if (g === "paid") invoiceQueues.paid += 1;
      if (g === "overdue") invoiceQueues.overdue += 1;
      if (g === "void") invoiceQueues.void += 1;
    }

    return apiOk({ estimates: estimateQueues, jobs: jobQueues, invoices: invoiceQueues });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load queues", 500);
  }
}
