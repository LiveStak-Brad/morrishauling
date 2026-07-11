import { morrisConfig } from "@/lib/morris-config";
import { requireApiProfile } from "@/lib/api/require-profile";
import { apiOk, apiError, parseJson } from "@/lib/api/route-utils";
import {
  getCustomers,
  getJobs,
  getInvoices,
  getPayments,
  getActivityLog,
  updateCustomer,
} from "@/lib/db/operations";
import { listEstimates, allocatePaymentAcrossInvoices } from "@/lib/db/billing-operations";
import {
  estimateQueueGroup,
  jobQueueGroup,
  invoiceQueueGroup,
} from "@/lib/billing/workflow";
import type { Payment } from "@/types/payment";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  if (!["admin", "planner"].includes(profile.role)) {
    return apiError("Admin access required", 403);
  }
  const { id } = await ctx.params;
  try {
    const [customers, jobs, invoices, payments, estimates, activity] = await Promise.all([
      getCustomers(morrisConfig.companyId),
      getJobs(morrisConfig.companyId),
      getInvoices(morrisConfig.companyId),
      getPayments(morrisConfig.companyId),
      listEstimates(morrisConfig.companyId),
      getActivityLog(morrisConfig.companyId, 200),
    ]);
    const customer = customers.find((c) => c.id === id);
    if (!customer) return apiError("Customer not found", 404);

    const customerJobs = jobs.filter((j) => j.customerId === id);
    const jobIds = new Set(customerJobs.map((j) => j.id));
    const invoiceByJob = new Map(
      invoices.filter((i) => i.customerId === id).map((i) => [i.jobId, i] as const)
    );
    const customerInvoices = invoices.filter((i) => i.customerId === id);
    const customerPayments = payments.filter(
      (p) => p.customerId === id || (p.jobId && jobIds.has(p.jobId))
    );
    const customerEstimates = estimates.filter((e) => e.customerId === id);

    const estimatesToApprove = customerEstimates.filter(
      (e) =>
        estimateQueueGroup({
          status: e.status,
          jobStatus: e.jobId ? customerJobs.find((j) => j.id === e.jobId)?.status : null,
          hasInvoice: e.jobId ? invoiceByJob.has(e.jobId) : false,
        }) === "to_approve"
    );
    const finalAgreed = customerEstimates.filter(
      (e) =>
        estimateQueueGroup({
          status: e.status,
          jobStatus: e.jobId ? customerJobs.find((j) => j.id === e.jobId)?.status : null,
          hasInvoice: e.jobId ? invoiceByJob.has(e.jobId) : false,
        }) === "final_agreed"
    );
    const completedEstimates = customerEstimates.filter(
      (e) =>
        estimateQueueGroup({
          status: e.status,
          jobStatus: e.jobId ? customerJobs.find((j) => j.id === e.jobId)?.status : null,
          hasInvoice: e.jobId ? invoiceByJob.has(e.jobId) : false,
        }) === "completed"
    );

    const activeJobs = customerJobs.filter((j) =>
      ["needs_scheduling", "scheduled", "in_progress", "awaiting_proof"].includes(
        jobQueueGroup(j, invoiceByJob.has(j.id))
      )
    );
    const completedJobs = customerJobs.filter(
      (j) => jobQueueGroup(j, invoiceByJob.has(j.id)) === "ready_to_invoice" || j.status === "completed"
    );
    const openInvoices = customerInvoices.filter((i) =>
      ["draft", "ready_to_send", "sent_unpaid", "partially_paid", "overdue"].includes(
        invoiceQueueGroup(i)
      )
    );
    const paidInvoices = customerInvoices.filter((i) => invoiceQueueGroup(i) === "paid");

    const timeline = (activity as Record<string, unknown>[]).filter((a) => {
      const entityId = a.entity_id as string;
      return (
        entityId === id ||
        jobIds.has(entityId) ||
        customerInvoices.some((i) => i.id === entityId) ||
        customerEstimates.some((e) => e.id === entityId) ||
        customerPayments.some((p) => p.id === entityId)
      );
    });

    const revenue = customerPayments
      .filter((p) => p.status === "completed" && !p.reversedAt)
      .reduce((s, p) => s + p.amount, 0);
    const outstanding = openInvoices.reduce((s, i) => s + i.balanceDue, 0);

    return apiOk({
      customer,
      estimatesToApprove,
      finalAgreedEstimates: finalAgreed,
      completedEstimates,
      activeJobs,
      completedJobs,
      openInvoices,
      paidInvoices,
      payments: customerPayments,
      activity: timeline,
      metrics: {
        totalRevenue: revenue,
        outstandingBalance: outstanding,
        waitingApproval: estimatesToApprove.length,
        activeJobs: activeJobs.length,
        readyToInvoice: completedJobs.filter((j) => !invoiceByJob.has(j.id)).length,
        unpaidInvoices: openInvoices.filter((i) => i.balanceDue > 0).length,
      },
    });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load customer", 500);
  }
}

export async function PATCH(request: Request, ctx: Ctx) {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  if (!["admin", "planner"].includes(profile.role)) {
    return apiError("Admin access required", 403);
  }
  const { id } = await ctx.params;
  try {
    const body = await parseJson<{
      name?: string;
      email?: string;
      phone?: string;
      notes?: string;
      action?: "pay_all";
      method?: Payment["method"];
      invoiceIds?: string[];
      amount?: number;
      allocations?: Array<{ invoiceId: string; amount: number }>;
      paymentNotes?: string;
    }>(request);

    if (body.action === "pay_all") {
      if (!body.method) return apiError("method required", 400);
      const invoices = await getInvoices(morrisConfig.companyId);
      const open = invoices.filter(
        (i) =>
          i.customerId === id &&
          i.balanceDue > 0 &&
          i.status !== "void" &&
          (!body.invoiceIds?.length || body.invoiceIds.includes(i.id))
      );
      if (!open.length) return apiError("No open invoices to pay", 400);

      const allocations =
        body.allocations?.length
          ? body.allocations
          : open.map((i) => ({ invoiceId: i.id, amount: i.balanceDue }));
      const amount =
        body.amount ??
        Math.round(allocations.reduce((s, a) => s + a.amount, 0) * 100) / 100;

      const result = await allocatePaymentAcrossInvoices(
        morrisConfig.companyId,
        {
          customerId: id,
          amount,
          method: body.method,
          allocations,
          notes: body.paymentNotes,
        },
        { actorProfileId: profile.id, actorRole: profile.role }
      );
      return apiOk(result);
    }

    const customer = await updateCustomer(morrisConfig.companyId, id, body, {
      actorProfileId: profile.id,
    });
    if (!customer) return apiError("Customer not found", 404);
    return apiOk({ customer });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to update customer", 500);
  }
}
