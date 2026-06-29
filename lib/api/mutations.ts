import type { FinancingRequest, Invoice, Job, Payment } from "@/types";
import type { FinancingRequestInput } from "@/types/financing";
import type { CreatePaymentRequest } from "@/types/payment";
import { applySupabaseStore } from "@/lib/mock-data";
import { isDemoDataEnabled } from "@/lib/is-demo-data";
import { toast } from "@/lib/toast";
import { useSupabaseData } from "@/lib/db/config";

async function refreshStore(companyId: string) {
  if (!isDemoDataEnabled()) return;
  const res = await fetch(`/api/data/store?companyId=${encodeURIComponent(companyId)}`);
  const payload = await res.json();
  if (payload.source === "supabase" && payload.tablesReady) {
    applySupabaseStore(companyId, payload);
    window.dispatchEvent(new CustomEvent("morris:data-refreshed"));
  }
}

async function apiPost<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error ?? "Request failed");
  return data as T;
}

async function apiPatch<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok || !data.ok) throw new Error(data.error ?? "Request failed");
  return data as T;
}

export async function mutateCreateJob(
  companyId: string,
  job: Omit<Job, "id" | "createdAt" | "updatedAt">,
  estimate?: Job["estimate"]
) {
  if (!useSupabaseData()) {
    const { createJob, reserveScheduleSlot } = await import("@/lib/mock-data");
    if (job.selectedScheduleSlotId) {
      reserveScheduleSlot(companyId, job.selectedScheduleSlotId);
    }
    const created = createJob(companyId, job);
    if (estimate) created.estimate = estimate;
    toast.success("Booking submitted");
    return created;
  }
  try {
    const { job: created } = await apiPost<{ job: Job }>("/api/jobs/create", {
      companyId,
      job: { ...job, estimate },
    });
    await refreshStore(companyId);
    toast.success("Booking submitted");
    return created;
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "Booking failed");
    throw e;
  }
}

export async function mutateJobStatus(
  companyId: string,
  jobId: string,
  status: Job["status"],
  updates?: Partial<Job>,
  actorProfileId?: string
) {
  if (!useSupabaseData()) {
    const { updateJob } = await import("@/lib/mock-data");
    updateJob(companyId, jobId, { ...(updates ?? {}), ...(status ? { status } : {}) });
    toast.success("Job updated");
    return;
  }
  try {
    await apiPatch("/api/jobs/" + jobId + "/status", {
      companyId,
      status,
      updates,
      actorProfileId,
    });
    await refreshStore(companyId);
    toast.success("Job updated");
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "Update failed");
    throw e;
  }
}

export async function mutateJobFields(
  companyId: string,
  jobId: string,
  updates: Partial<Job>,
  actorProfileId?: string
) {
  if (!useSupabaseData()) {
    const { updateJob } = await import("@/lib/mock-data");
    updateJob(companyId, jobId, updates);
    toast.success("Job updated");
    return;
  }
  try {
    await apiPatch("/api/jobs/" + jobId + "/status", {
      companyId,
      updates,
      actorProfileId,
    });
    await refreshStore(companyId);
    toast.success("Job updated");
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "Update failed");
    throw e;
  }
}

export async function mutateCreatePayment(
  companyId: string,
  req: CreatePaymentRequest & { customerId?: string; collectedByEmployeeId?: string },
  actorProfileId?: string
) {
  if (!useSupabaseData()) {
    const { mockPaymentProvider } = await import("@/lib/payment-provider");
    const { morrisConfig } = await import("@/lib/morris-config");
    const result = await mockPaymentProvider.processPayment(req, morrisConfig);
    toast.success(`Payment received — $${req.amount}`);
    return result;
  }
  try {
    const { payment, receiptNumber } = await apiPost<{
      payment: Payment;
      receiptNumber: string;
    }>("/api/payments/create", { ...req, actorProfileId });
    await refreshStore(companyId);
    toast.success(`Payment received — $${req.amount}`);
    return { paymentId: payment.id, status: payment.status, amount: payment.amount, receiptNumber };
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "Payment failed");
    throw e;
  }
}

export async function mutateFinancingRequest(
  companyId: string,
  input: FinancingRequestInput,
  actorProfileId?: string
) {
  if (!useSupabaseData()) {
    const { inHouseFinancingProvider } = await import("@/lib/financing-provider");
    const result = await inHouseFinancingProvider.requestPlan(input);
    toast.success("Financing request submitted");
    return result;
  }
  try {
    const { request } = await apiPost<{ request: FinancingRequest }>(
      "/api/financing/request",
      { ...input, actorProfileId }
    );
    await refreshStore(companyId);
    toast.success("Financing request submitted");
    return request;
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "Request failed");
    throw e;
  }
}

export async function mutateApproveFinancing(
  companyId: string,
  requestId: string,
  options?: {
    downPayment?: number;
    numberOfPayments?: number;
    internalNotes?: string;
    actorProfileId?: string;
  }
) {
  if (!useSupabaseData()) {
    const { inHouseFinancingProvider } = await import("@/lib/financing-provider");
    const result = await inHouseFinancingProvider.approve(requestId, companyId, options);
    toast.success("Financing approved");
    return result;
  }
  try {
    const { request } = await apiPatch<{ request: FinancingRequest }>(
      `/api/financing/${requestId}/approve`,
      { companyId, ...options }
    );
    await refreshStore(companyId);
    toast.success("Financing approved");
    return request;
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "Approval failed");
    throw e;
  }
}

export async function mutateDenyFinancing(
  companyId: string,
  requestId: string,
  reason?: string,
  options?: { internalNotes?: string; actorProfileId?: string }
) {
  if (!useSupabaseData()) {
    const { inHouseFinancingProvider } = await import("@/lib/financing-provider");
    const result = await inHouseFinancingProvider.deny(
      requestId,
      companyId,
      reason,
      options?.internalNotes
    );
    toast.success("Financing denied");
    return result;
  }
  try {
    const { request } = await apiPatch<{ request: FinancingRequest }>(
      `/api/financing/${requestId}/deny`,
      { companyId, reason, ...options }
    );
    await refreshStore(companyId);
    toast.success("Financing denied");
    return request;
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "Denial failed");
    throw e;
  }
}

export async function mutateUpdateInvoice(
  companyId: string,
  invoiceId: string,
  updates: Partial<Invoice>,
  actorProfileId?: string
) {
  if (!useSupabaseData()) {
    const { updateInvoice } = await import("@/lib/mock-data");
    const result = updateInvoice(companyId, invoiceId, updates);
    toast.success("Invoice updated");
    return result;
  }
  try {
    const { invoice } = await apiPatch<{ invoice: Invoice }>(
      `/api/invoices/${invoiceId}`,
      { companyId, updates, actorProfileId }
    );
    await refreshStore(companyId);
    toast.success("Invoice updated");
    return invoice;
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "Invoice update failed");
    throw e;
  }
}

export async function mutateCreateHaulingJob(
  companyId: string,
  input: {
    pickup: import("@/types/hauling").HaulingDetails["pickup"];
    delivery: import("@/types/hauling").HaulingDetails["delivery"];
    cargoCategory: import("@/types/hauling").HaulingCargoCategory;
    cargoDescription: string;
    estimatedWeightLbs?: number;
    lengthFt?: number;
    widthFt?: number;
    heightFt?: number;
    isRunning?: boolean;
    isRolling?: boolean;
    needsWinch: boolean;
    needsLoadingHelp: boolean;
    needsUnloadingHelp: boolean;
    serviceLevel: import("@/types/hauling").HaulingServiceLevel;
    urgency: import("@/types/hauling").HaulingUrgency;
    preferredPickupDate?: string;
    preferredDeliveryDate?: string;
    preferredDeliveryWindow?: string;
    pricingBreakdown: import("@/types/hauling").PricingBreakdownLine[];
    internalCostBreakdown?: import("@/types/hauling").PricingBreakdownLine[];
    total: number;
    recommendedTrailerType: import("@/types/hauling").HaulingTrailerType;
    trailerDisplayName?: string;
    rentalRequired: boolean;
    trailerOwnedOrRental?: import("@/types/hauling").TrailerOwnership;
    estimatedLoadedMiles: number;
    estimatedEmptyMiles: number;
    totalTravelMiles?: number;
    estimatedFuelCost: number;
    estimatedDriverHours: number;
    estimatedProfit?: number;
    estimatedMargin?: number;
    disclaimerAccepted: boolean;
    trailerAvailabilityDisclaimerAccepted: boolean;
  }
) {
  if (!useSupabaseData()) {
    const { createJob } = await import("@/lib/mock-data");
    const { DEMO_CUSTOMER_ID } = await import("@/lib/mock-data");
    const job = createJob(companyId, {
      companyId,
      customerId: DEMO_CUSTOMER_ID,
      serviceType: "hauling_transport",
      status: "submitted",
      junkType: input.cargoCategory,
      items: [],
      loadSizeTier: "quarter_25",
      accessDetails: { stairs: false, elevator: false, longCarryFt: 0, basement: false, attic: false, tightAccess: false, heavyItems: false, specialDisposal: false },
      address: { street: input.pickup.address, city: input.pickup.city, state: input.pickup.state, zip: input.pickup.zip },
      photos: [],
      pricingBreakdown: input.pricingBreakdown,
      estimateType: "hauling_transport",
      disclaimerAccepted: input.disclaimerAccepted,
      warnings: [],
      scheduledDate: input.preferredPickupDate,
    });
    toast.success("Hauling request submitted");
    return job;
  }
  try {
    const { job } = await apiPost<{ job: Job }>("/api/jobs/create", {
      companyId,
      hauling: input,
    });
    await refreshStore(companyId);
    toast.success("Hauling request submitted");
    return job;
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "Request failed");
    throw e;
  }
}

export async function mutateReviewEstimate(
  companyId: string,
  jobId: string,
  input: {
    action: "approved" | "adjusted" | "declined" | "request_info" | "send_quote";
    adjustedTotal?: number;
    notes?: string;
  }
) {
  const actionMessages: Record<typeof input.action, string> = {
    approved: "Estimate approved",
    adjusted: "Estimate adjusted and approved",
    declined: "Estimate declined",
    request_info: "More information requested",
    send_quote: "Revised quote saved",
  };

  const resolvedStatus =
    input.action === "send_quote"
      ? "adjusted"
      : input.action === "request_info"
        ? "needs_review"
        : input.action;

  if (!useSupabaseData()) {
    const { updateJob, getJobByCompany } = await import("@/lib/mock-data");
    const job = getJobByCompany(companyId, jobId);
    if (!job) throw new Error("Job not found");
    const updated = updateJob(companyId, jobId, {
      reviewStatus: resolvedStatus,
      status:
        input.action === "declined"
          ? "cancelled"
          : input.action === "approved" || input.action === "adjusted" || input.action === "send_quote"
            ? "estimated"
            : job.status,
      junkRemovalDetails: job.junkRemovalDetails
        ? {
            ...job.junkRemovalDetails,
            reviewStatus: resolvedStatus,
            reviewRequired: input.action === "request_info",
          }
        : undefined,
      estimate:
        input.adjustedTotal != null && job.estimate
          ? { ...job.estimate, total: input.adjustedTotal }
          : job.estimate,
      priceAdjustmentNotes: input.notes ?? job.priceAdjustmentNotes,
    });
    toast.success(actionMessages[input.action]);
    return updated;
  }
  try {
    const apiAction =
      input.action === "send_quote"
        ? "adjusted"
        : input.action === "request_info"
          ? "approved"
          : input.action;
    const { job } = await apiPatch<{ job: Job }>(`/api/jobs/${jobId}/estimate-review`, {
      companyId,
      action: apiAction,
      adjustedTotal: input.adjustedTotal,
      notes: input.notes ? `[${input.action}] ${input.notes}` : `[${input.action}]`,
    });
    await refreshStore(companyId);
    toast.success(actionMessages[input.action]);
    return job;
  } catch (e) {
    toast.error(e instanceof Error ? e.message : "Review failed");
    throw e;
  }
}

export { refreshStore };
