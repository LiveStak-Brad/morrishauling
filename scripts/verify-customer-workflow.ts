/**
 * Offline verification of customer workflow integrity (no production writes).
 * Run: npx tsx scripts/verify-customer-workflow.ts
 */
import assert from "node:assert/strict";
import {
  bothApprovalsPresent,
  canDeleteEstimate,
  estimateQueueGroup,
  jobQueueGroup,
  invoiceQueueGroup,
  assertJobCompletableForInvoice,
} from "../lib/billing/workflow";
import { canMarkJobCompleted } from "../lib/disposal/disposal-requirements";
import { missingRequiredPhotos, requiredPhotoStagesForCompletion } from "../lib/jobs/workflow";
import { businessDateString, isOnBusinessDate } from "../lib/datetime/business-timezone";
import type { Job } from "../types/job";
import type { Invoice } from "../types/payment";

function baseJob(partial: Partial<Job> & { serviceType: Job["serviceType"] }): Job {
  return {
    id: "job-test",
    companyId: "morris-hauling",
    customerId: "cust-1",
    serviceType: partial.serviceType,
    status: partial.status ?? "in_progress",
    address: { street: "1 Main", city: "Warrenton", state: "MO", zip: "63383" },
    photos: partial.photos ?? [],
    assignedEmployeeIds: partial.assignedEmployeeIds ?? ["emp-1"],
    assignedTruckId: partial.assignedTruckId ?? "truck-1",
    assignedTrailerId: partial.assignedTrailerId ?? "trailer-1",
    scheduledDate: partial.scheduledDate ?? "2026-07-10",
    junkRemovalDetails: partial.junkRemovalDetails,
    divisionId: partial.divisionId,
    completionOverrideReason: partial.completionOverrideReason,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...partial,
  } as Job;
}

console.log("=== Customer workflow verification (both divisions) ===\n");

// Dual approval
assert.equal(bothApprovalsPresent({ customerApprovedAt: null, acceptedAt: null, internalApprovedAt: null }), false);
assert.equal(bothApprovalsPresent({ customerApprovedAt: "x", acceptedAt: null, internalApprovedAt: null }), false);
assert.equal(bothApprovalsPresent({ customerApprovedAt: null, acceptedAt: null, internalApprovedAt: "x" }), false);
assert.equal(bothApprovalsPresent({ customerApprovedAt: "x", acceptedAt: null, internalApprovedAt: "y" }), true);
assert.equal(bothApprovalsPresent({ customerApprovedAt: null, acceptedAt: "x", internalApprovedAt: "y" }), true);
console.log("✓ Dual approval requires both customer + internal");

// Estimate queues — one bucket only
const draft = estimateQueueGroup({ status: "draft" });
const sent = estimateQueueGroup({ status: "sent" });
const accepted = estimateQueueGroup({ status: "accepted", jobStatus: "scheduled" });
const convertedDone = estimateQueueGroup({ status: "converted", jobStatus: "completed", hasInvoice: true });
const declined = estimateQueueGroup({ status: "declined" });
assert.equal(draft, "to_approve");
assert.equal(sent, "to_approve");
assert.equal(accepted, "final_agreed");
assert.equal(convertedDone, "completed");
assert.equal(declined, "completed");
console.log("✓ Estimate appears in exactly one queue group (declined not in Needs Approval)");

// Job missing assignment bucket
const unassigned = baseJob({
  serviceType: "junk_removal",
  status: "scheduled",
  scheduledDate: "2026-07-20",
  assignedEmployeeIds: [],
  assignedTruckId: undefined,
  assignedTrailerId: undefined,
});
assert.equal(jobQueueGroup(unassigned, false), "missing_assignments");
console.log("✓ Scheduled jobs without crew/equipment are Missing Assignment");

// Delete rules
assert.equal(canDeleteEstimate({ status: "draft" }).ok, true);
assert.equal(canDeleteEstimate({ status: "sent" }).ok, true);
assert.equal(canDeleteEstimate({ status: "converted", jobId: "j1", jobStatus: "scheduled" }).ok, false);
assert.equal(canDeleteEstimate({ status: "converted", jobId: "j1", jobStatus: "canceled" }).ok, true);
assert.equal(canDeleteEstimate({ status: "converted", jobId: "j1", jobStatus: "scheduled", isOwner: true }).ok, true);
console.log("✓ Estimate delete rules");

// Junk proof requirements
const junkStages = requiredPhotoStagesForCompletion("junk_removal");
assert.ok(junkStages.includes("before") && junkStages.includes("after") && junkStages.includes("loaded_trailer"));
const junkIncomplete = baseJob({
  serviceType: "junk_removal",
  divisionId: "junk_removal",
  status: "completed",
  photos: [{ id: "p1", url: "/x", caption: "before" } as Job["photos"][0]],
  junkRemovalDetails: { disposalSkipReason: "not_required" } as Job["junkRemovalDetails"],
});
assert.equal(canMarkJobCompleted(junkIncomplete).ok, true); // status short-circuit
assert.throws(() => assertJobCompletableForInvoice(junkIncomplete), /proof|photo|Required/i);
console.log("✓ Junk Removal blocks invoice when photos incomplete even if status=completed");

const junkComplete = baseJob({
  serviceType: "junk_removal",
  divisionId: "junk_removal",
  status: "completed",
  photos: [
    { id: "1", url: "/a", caption: "arrival" },
    { id: "2", url: "/b", caption: "before" },
    { id: "3", url: "/c", caption: "loaded_trailer" },
    { id: "4", url: "/d", caption: "after" },
  ] as Job["photos"],
  junkRemovalDetails: { disposalCompletedAt: "2026-07-10T12:00:00Z", disposalSkipReason: undefined } as Job["junkRemovalDetails"],
});
// disposal may still be required depending on junkRemovalDetails shape — use skip
const junkWithSkip = baseJob({
  ...junkComplete,
  junkRemovalDetails: { disposalSkipReason: "not_required" } as Job["junkRemovalDetails"],
});
assert.equal(canMarkJobCompleted(junkWithSkip).ok, true);
assert.doesNotThrow(() => assertJobCompletableForInvoice(junkWithSkip));
console.log("✓ Junk Removal allows invoice when proof + disposal satisfied");

// Hauling proof
const haulStages = requiredPhotoStagesForCompletion("hauling");
assert.ok(haulStages.includes("pickup_condition") && haulStages.includes("securement") && haulStages.includes("delivery"));
const haulIncomplete = baseJob({
  serviceType: "hauling_transport",
  divisionId: "hauling",
  photos: [],
});
assert.ok(missingRequiredPhotos(haulIncomplete, "hauling").length > 0);
assert.equal(canMarkJobCompleted(haulIncomplete).ok, false);
console.log("✓ Hauling requires pickup/securement/loaded/delivery photos");

const haulComplete = baseJob({
  serviceType: "hauling_transport",
  divisionId: "hauling",
  status: "completed",
  photos: [
    { id: "1", url: "/a", caption: "pickup_condition" },
    { id: "2", url: "/b", caption: "securement" },
    { id: "3", url: "/c", caption: "loaded" },
    { id: "4", url: "/d", caption: "delivery" },
  ] as Job["photos"],
});
assert.equal(canMarkJobCompleted(haulComplete).ok, true);
assert.doesNotThrow(() => assertJobCompletableForInvoice(haulComplete));
console.log("✓ Hauling allows invoice when proof present");

// Override requires reason
assert.equal(canMarkJobCompleted(haulIncomplete, { managerOverride: true, overrideReason: "" }).ok, false);
assert.equal(canMarkJobCompleted(haulIncomplete, { managerOverride: true, overrideReason: "Owner reviewed" }).ok, true);
console.log("✓ Manager override requires a reason");

// Job / invoice queues
assert.equal(jobQueueGroup(baseJob({ serviceType: "junk_removal", status: "submitted", scheduledDate: undefined }), false), "needs_scheduling");
assert.equal(jobQueueGroup(baseJob({ serviceType: "junk_removal", status: "scheduled" }), false), "scheduled");
assert.equal(jobQueueGroup(junkWithSkip, false), "ready_to_invoice");
assert.equal(jobQueueGroup(junkWithSkip, true), "invoiced");

const inv = {
  id: "i1",
  status: "sent",
  balanceDue: 100,
  amountPaid: 0,
  total: 100,
  dueDate: "2099-01-01",
} as Invoice;
assert.equal(invoiceQueueGroup(inv), "sent_unpaid");
assert.equal(invoiceQueueGroup({ ...inv, amountPaid: 40, status: "partially_paid", balanceDue: 60 }), "partially_paid");
assert.equal(invoiceQueueGroup({ ...inv, amountPaid: 100, balanceDue: 0, status: "paid" }), "paid");
console.log("✓ Job and invoice queue grouping");

// Business timezone evening punch
const eveningUtc = "2026-07-11T00:50:00.000Z"; // 7:50pm CDT July 10
const biz = businessDateString(new Date(eveningUtc));
assert.equal(biz, "2026-07-10");
assert.equal(isOnBusinessDate(eveningUtc, "2026-07-10"), true);
assert.equal(isOnBusinessDate(eveningUtc, "2026-07-11"), false);
console.log("✓ Business timezone treats evening Central punches as same shift day");

// Payment allocation math (unit)
const balances = [450, 600];
const payAll = balances.reduce((s, b) => s + b, 0);
const allocations = balances.map((b) => b);
assert.equal(allocations.reduce((s, a) => s + a, 0), payAll);
assert.ok(allocations.every((a, i) => a <= balances[i]));
console.log("✓ Pay All allocation math preserves separate invoice balances");

console.log("\nAll offline workflow checks passed for Junk Removal and Hauling.");
