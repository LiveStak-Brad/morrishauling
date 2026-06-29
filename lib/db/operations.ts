import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { useSupabaseData } from "./config";
import {
  rowToCustomerUser,
  rowToEmployeeUser,
  rowToFinancing,
  rowToInvoice,
  rowToJob,
  rowToPayment,
  jobToRow,
  invoiceToRow,
  haulingDetailsToRow,
  junkRemovalDetailsToRow,
} from "./mappers";
import { logActivity } from "./activity";
import { isDemoDataEnabled } from "@/lib/is-demo-data";
import type { UserProfile } from "@/lib/auth/types";
import type { FinancingRequest, Invoice, Job, Payment } from "@/types";
import { derivePaymentStatus, generatePaymentSchedule } from "@/lib/payment-utils";
import type { Customer, Employee } from "@/types/user";
import {
  getJobs as mockGetJobs,
  getJobByCompany as mockGetJobByCompany,
  getJob as mockGetJob,
  createJob as mockCreateJob,
  updateJob as mockUpdateJob,
  getInvoices as mockGetInvoices,
  getInvoice as mockGetInvoice,
  getPayments as mockGetPayments,
  createPayment as mockCreatePayment,
  getFinancingRequests as mockGetFinancingRequests,
  getFinancingRequest as mockGetFinancingRequest,
  createFinancingRequest as mockCreateFinancingRequest,
  updateFinancingRequest as mockUpdateFinancingRequest,
  updateInvoice as mockUpdateInvoice,
  getCustomers as mockGetCustomers,
  createInvoice as mockCreateInvoice,
  getUsers as mockGetUsers,
  DEMO_CUSTOMER_ID,
  DEMO_CUSTOMER_IDS,
} from "@/lib/mock-data";
import { morrisConfig } from "@/lib/morris-config";
import {
  filterActivityLog,
  filterCustomers,
  filterFinancing,
  filterInvoices,
  filterJobs,
  filterPayments,
  isExcludedJob,
} from "@/lib/data/real-record-filter";

export async function isDbReady(): Promise<boolean> {
  if (!useSupabaseData()) return false;
  try {
    const sb = await createClient();
    const { error } = await sb.from("customers").select("id").limit(1);
    return !error || error.code !== "PGRST205";
  } catch {
    return false;
  }
}

async function sb() {
  return createClient();
}

/** Prefer service role for server writes when configured */
async function sbWrite() {
  const admin = createAdminClient();
  if (admin) return admin;
  return createClient();
}

function demoOr<T>(value: T, empty: T): T {
  return isDemoDataEnabled() ? value : empty;
}

// --- Jobs ---

async function queryJobsFromDb(
  companyId: string,
  filters?: { status?: string; scheduledDate?: string }
): Promise<Job[]> {
  let query = (await sb()).from("jobs").select("*").eq("company_id", companyId);
  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.scheduledDate) query = query.eq("scheduled_date", filters.scheduledDate);
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => rowToJob(r));
}

export async function getJobs(
  companyId: string,
  filters?: { status?: string; scheduledDate?: string }
): Promise<Job[]> {
  if (!(await isDbReady())) return demoOr(filterJobs(mockGetJobs(companyId, filters)), []);
  return filterJobs(await queryJobsFromDb(companyId, filters));
}

export async function getJobsWithMeta(
  companyId: string,
  filters?: { status?: string; scheduledDate?: string }
) {
  const { buildListMetaFromCounts, buildListMeta, resolveAdminDataSource } = await import("@/lib/api/admin-data-meta");
  if (!(await isDbReady())) {
    const raw = mockGetJobs(companyId, filters);
    const jobs = filterJobs(raw);
    return { jobs, meta: buildListMeta(raw.length, jobs.length, await resolveAdminDataSource()) };
  }
  const all = await queryJobsFromDb(companyId, filters);
  const jobs = filterJobs(all);
  return { jobs, meta: await buildListMetaFromCounts(all.length, jobs.length) };
}

export async function getJobById(companyId: string, jobId: string): Promise<Job | undefined> {
  if (!(await isDbReady())) return demoOr(mockGetJobByCompany(companyId, jobId), undefined);

  const { data, error } = await (await sb())
    .from("jobs")
    .select("*")
    .eq("company_id", companyId)
    .eq("id", jobId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return undefined;

  const job = rowToJob(data);
  if (isExcludedJob(job)) return undefined;
  const { listJobPhotos } = await import("@/lib/db/job-photos");
  const photoRecords = await listJobPhotos(companyId, jobId, { withSignedUrls: true });
  if (photoRecords.length === 0) return job;

  return {
    ...job,
    photos: photoRecords.map((p) => ({
      id: p.id,
      url: p.signedUrl ?? p.storagePath,
      caption: p.notes,
    })),
  };
}

export async function getJobGlobal(jobId: string): Promise<Job | undefined> {
  if (!(await isDbReady())) return demoOr(mockGetJob(jobId), undefined);
  const { data, error } = await (await sb()).from("jobs").select("*").eq("id", jobId).maybeSingle();
  if (error) throw error;
  return data ? rowToJob(data) : undefined;
}

export async function createJobFromBooking(
  companyId: string,
  job: Omit<Job, "id" | "createdAt" | "updatedAt">,
  options?: { actorProfileId?: string; scheduleSlotId?: string }
): Promise<Job> {
  const slotId = options?.scheduleSlotId ?? job.selectedScheduleSlotId;
  if (slotId) {
    const { reserveScheduleSlot } = await import("@/lib/db/schedule-operations");
    await reserveScheduleSlot(companyId, slotId, { actorProfileId: options?.actorProfileId });
  }

  const newJob = mockCreateJob(companyId, job);
  if (newJob.estimate) {
    newJob.estimate = { ...newJob.estimate, jobId: newJob.id };
  }
  if (await isDbReady()) {
    await (await sbWrite()).from("jobs").upsert(jobToRow(newJob));
    if (newJob.junkRemovalDetails) {
      await (await sbWrite())
        .from("junk_removal_details")
        .upsert(junkRemovalDetailsToRow(newJob.junkRemovalDetails));
    }
    if (newJob.estimate) {
      const jrd = newJob.junkRemovalDetails;
      await (await sbWrite()).from("estimates").upsert({
        id: newJob.estimate.id,
        company_id: companyId,
        job_id: newJob.id,
        customer_id: newJob.customerId,
        estimate_number: `EST-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
        status: jrd?.reviewRequired ? "draft" : "sent",
        base_amount: newJob.estimate.subtotal,
        adjustments_total: newJob.estimate.modifiers.reduce((s, m) => s + m.amount, 0),
        estimated_total: newJob.estimate.total,
        load_percentage: newJob.estimate.trailerPercent,
        labor_hours_estimate: jrd?.estimatedLaborMinutes ? jrd.estimatedLaborMinutes / 60 : null,
        crew_size: jrd?.estimatedCrewSize ?? 2,
        disclaimer_accepted: newJob.estimate.disclaimerAccepted,
        estimate_type: "junk_removal",
        review_status: jrd?.reviewStatus ?? "auto_ready",
        pricing_breakdown: jrd?.customerPricingBreakdown ?? newJob.pricingBreakdown ?? [],
        internal_cost_breakdown: jrd?.internalCostBreakdown ?? [],
        estimated_profit: jrd?.estimatedProfit ?? null,
        estimated_margin: jrd?.estimatedMargin ?? null,
        review_reasons: jrd?.reviewReasons ?? [],
      });
    }
    await logActivity({
      companyId,
      actorProfileId: options?.actorProfileId ?? newJob.customerId,
      entityType: "job",
      entityId: newJob.id,
      action: "created",
      message: `New booking submitted — ${newJob.address.street}, ${newJob.address.city}`,
      metadata: { status: newJob.status, junkType: newJob.junkType },
    });
  } else {
    await logActivity({
      companyId,
      actorProfileId: options?.actorProfileId ?? newJob.customerId,
      entityType: "job",
      entityId: newJob.id,
      action: "created",
      message: `New booking submitted — ${newJob.address.street}, ${newJob.address.city}`,
      metadata: { status: newJob.status, junkType: newJob.junkType },
    });
  }
  return newJob;
}

export async function createJobFromHauling(
  companyId: string,
  params: {
    customerId: string;
    haulingDetails: import("@/types/hauling").HaulingDetails;
    pricingBreakdown: import("@/types/hauling").PricingBreakdownLine[];
    total: number;
    disclaimerAccepted: boolean;
    preferredPickupDate?: string;
  },
  options?: { actorProfileId?: string }
): Promise<Job> {
  const hd = params.haulingDetails;
  const jobInput: Omit<Job, "id" | "createdAt" | "updatedAt"> = {
    companyId,
    customerId: params.customerId,
    serviceType: "hauling_transport",
    status: "submitted",
    junkType: hd.cargoCategory,
    items: [],
    loadSizeTier: "quarter_25",
    accessDetails: {
      stairs: false,
      elevator: false,
      longCarryFt: 0,
      basement: false,
      attic: false,
      tightAccess: false,
      heavyItems: false,
      specialDisposal: false,
      notes: hd.pickup.accessNotes,
    },
    address: {
      street: hd.pickup.address,
      city: hd.pickup.city,
      state: hd.pickup.state,
      zip: hd.pickup.zip,
    },
    photos: [],
    estimateType: "hauling_transport",
    pricingBreakdown: params.pricingBreakdown,
    disclaimerAccepted: params.disclaimerAccepted,
    haulingDetails: hd,
    warnings: hd.rentalRequired ? ["price_may_need_adjustment"] : [],
    scheduledDate: params.preferredPickupDate,
    customerNotes: hd.cargoDescription,
  };

  const newJob = mockCreateJob(companyId, jobInput);
  newJob.estimate = {
    id: `est-${newJob.id}`,
    jobId: newJob.id,
    subtotal: params.total,
    modifiers: params.pricingBreakdown.map((l) => ({ id: l.id, label: l.label, amount: l.amount })),
    total: params.total,
    trailerPercent: 0,
    disclaimerAccepted: params.disclaimerAccepted,
    createdAt: new Date().toISOString(),
  };
  newJob.haulingDetails = { ...hd, jobId: newJob.id, id: `hd-${newJob.id}` };

  if (await isDbReady()) {
    await (await sbWrite()).from("jobs").upsert(jobToRow(newJob));
    await (await sbWrite()).from("hauling_details").upsert(haulingDetailsToRow(newJob.haulingDetails!));
    await logActivity({
      companyId,
      actorProfileId: options?.actorProfileId ?? params.customerId,
      entityType: "job",
      entityId: newJob.id,
      action: "created",
      message: `Hauling request — ${hd.pickup.city} → ${hd.delivery.city}`,
      metadata: { serviceType: "hauling_transport", cargo: hd.cargoCategory },
    });
  }
  return newJob;
}

export async function updateJobStatus(
  companyId: string,
  jobId: string,
  status: Job["status"],
  options?: { actorProfileId?: string; updates?: Partial<Job> }
): Promise<Job | undefined> {
  return updateJob(companyId, jobId, { status, ...options?.updates }, options);
}

export async function updateJob(
  companyId: string,
  jobId: string,
  updates: Partial<Job>,
  options?: { actorProfileId?: string }
): Promise<Job | undefined> {
  const dbReady = await isDbReady();
  let updated: Job | undefined;

  if (dbReady) {
    const existing = await getJobById(companyId, jobId);
    if (!existing) return undefined;
    updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await (await sbWrite()).from("jobs").upsert(jobToRow(updated));
    if (updates.junkRemovalDetails && updated.junkRemovalDetails) {
      await (await sbWrite())
        .from("junk_removal_details")
        .upsert(junkRemovalDetailsToRow(updated.junkRemovalDetails));
    }
  } else if (isDemoDataEnabled()) {
    updated = mockUpdateJob(companyId, jobId, updates);
    if (!updated) return undefined;
  } else {
    return undefined;
  }

  if (updates.status) {
    await logActivity({
      companyId,
      actorProfileId: options?.actorProfileId,
      entityType: "job",
      entityId: jobId,
      action: "status_changed",
      message: `Job status updated to ${updates.status}`,
      metadata: { status: updates.status },
    });
  } else if (Object.keys(updates).length) {
    await logActivity({
      companyId,
      actorProfileId: options?.actorProfileId,
      entityType: "job",
      entityId: jobId,
      action: "updated",
      message: `Job ${jobId} updated`,
      metadata: { fields: Object.keys(updates) },
    });
  }

  return updated;
}

export async function reviewJobEstimate(
  companyId: string,
  jobId: string,
  params: {
    action: "approved" | "adjusted" | "declined";
    adjustedTotal?: number;
    notes?: string;
  },
  options?: { actorProfileId?: string }
): Promise<Job | undefined> {
  const job = (await isDbReady())
    ? await getJobById(companyId, jobId)
    : demoOr(mockGetJobByCompany(companyId, jobId), undefined);
  if (!job) return undefined;

  const reviewStatus = params.action;
  const updates: Partial<Job> = {
    reviewStatus,
    status:
      params.action === "declined"
        ? "cancelled"
        : params.action === "approved" || params.action === "adjusted"
          ? "estimated"
          : job.status,
    priceAdjustmentNotes: params.notes ?? job.priceAdjustmentNotes,
  };

  if (job.junkRemovalDetails) {
    updates.junkRemovalDetails = {
      ...job.junkRemovalDetails,
      reviewStatus,
      reviewRequired: false,
    };
  }

  if (params.adjustedTotal != null && job.estimate) {
    updates.estimate = { ...job.estimate, total: params.adjustedTotal };
  }

  const updated = await updateJob(companyId, jobId, updates, options);

  if (updated && (await isDbReady()) && updated.estimate) {
    await (await sbWrite())
      .from("estimates")
      .update({
        review_status: reviewStatus,
        estimated_total: updated.estimate.total,
        final_amount: params.action !== "declined" ? updated.estimate.total : null,
        status: params.action === "declined" ? "declined" : "accepted",
        updated_at: new Date().toISOString(),
      })
      .eq("job_id", jobId);
  }

  if (updated) {
    const action =
      params.action === "approved"
        ? "estimate_approved"
        : params.action === "adjusted"
          ? "estimate_adjusted"
          : "estimate_declined";
    await logActivity({
      companyId,
      actorProfileId: options?.actorProfileId,
      entityType: "job",
      entityId: jobId,
      action,
      message: `Estimate ${reviewStatus}${params.adjustedTotal ? ` — $${params.adjustedTotal}` : ""}`,
      metadata: { reviewStatus, adjustedTotal: params.adjustedTotal },
    });
  }

  return updated;
}

export async function assignJobToEmployee(
  companyId: string,
  jobId: string,
  employeeId: string,
  role: "driver" | "helper" | "lead" = "helper"
): Promise<void> {
  const job = await getJobById(companyId, jobId);
  if (!job) return;

  const ids = new Set([...(job.assignedEmployeeIds ?? []), employeeId]);
  await updateJob(companyId, jobId, { assignedEmployeeIds: [...ids] });

  await logActivity({
    companyId,
    entityType: "job",
    entityId: jobId,
    action: "employee_assigned",
    message: `Employee assigned to job`,
    metadata: { employeeId, role },
  });

  if (await isDbReady()) {
    await (await sbWrite()).from("job_assignments").upsert({
      id: `ja-${jobId}-${employeeId}`,
      company_id: companyId,
      job_id: jobId,
      employee_id: employeeId,
      role,
      assigned_at: new Date().toISOString(),
    });
  }
}

// --- Invoices ---

export async function getInvoices(companyId: string): Promise<Invoice[]> {
  if (!(await isDbReady())) return demoOr(mockGetInvoices(companyId), []);
  const { data, error } = await (await sb())
    .from("invoices")
    .select("*")
    .eq("company_id", companyId);
  if (error) throw error;
  return filterInvoices((data ?? []).map(rowToInvoice));
}

export async function getInvoiceById(
  companyId: string,
  invoiceId: string
): Promise<Invoice | undefined> {
  if (!(await isDbReady())) return demoOr(mockGetInvoice(companyId, invoiceId), undefined);
  const { data, error } = await (await sb())
    .from("invoices")
    .select("*")
    .eq("company_id", companyId)
    .eq("id", invoiceId)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToInvoice(data) : undefined;
}

export async function updateInvoice(
  companyId: string,
  invoiceId: string,
  updates: Partial<Invoice>,
  options?: { actorProfileId?: string }
): Promise<Invoice | undefined> {
  const existing = await getInvoiceById(companyId, invoiceId);
  if (!existing) return undefined;
  const updated = { ...existing, ...updates };
  if (await isDbReady()) {
    await (await sbWrite()).from("invoices").upsert(invoiceToRow(updated));
  } else if (isDemoDataEnabled()) {
    mockUpdateInvoice(companyId, invoiceId, updates);
  }
  await logActivity({
    companyId,
    actorProfileId: options?.actorProfileId,
    entityType: "invoice",
    entityId: invoiceId,
    action: "updated",
    message: `Invoice ${updated.invoiceNumber} updated`,
    metadata: { fields: Object.keys(updates), balanceDue: updated.balanceDue },
  });
  return updated;
}

function opsId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export async function createAdminInvoice(
  companyId: string,
  input: {
    customerId: string;
    jobId?: string;
    lineItems: Invoice["adjustments"];
    fees?: number;
    tax?: number;
    discount?: number;
    dueDate?: string;
    terms?: string;
    status?: Invoice["status"];
    depositAmount?: number;
    markPaid?: boolean;
    finalPriceNotes?: string;
  },
  options?: { actorProfileId?: string }
): Promise<Invoice> {
  let jobId = input.jobId;
  if (!jobId) {
    const job = await createAdminJobManual(
      companyId,
      {
        customerId: input.customerId,
        serviceType: "junk_removal",
        street: "Admin billing",
        city: "Office",
        state: "MO",
        zip: "63383",
        notes: "Placeholder job for standalone invoice",
      },
      options
    );
    jobId = job.id;
  }

  const lineTotal = input.lineItems.reduce((s, l) => s + l.amount, 0);
  const discount = input.discount ?? 0;
  const subtotal = Math.max(0, lineTotal - discount);
  const fees = (input.fees ?? 0) + (input.tax ?? 0);
  const total = subtotal + fees;
  const depositAmount = input.depositAmount ?? 0;
  const markPaid = input.markPaid ?? false;
  const amountPaid = markPaid ? total : 0;
  const balanceDue = markPaid ? 0 : total;

  const invoice: Invoice = {
    id: opsId("inv"),
    invoiceNumber: `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
    companyId,
    jobId,
    customerId: input.customerId,
    estimateAmount: subtotal,
    adjustments: input.lineItems,
    subtotal,
    fees,
    depositAmount,
    depositPaid: 0,
    total,
    amountPaid,
    balanceDue,
    status: markPaid ? "paid" : (input.status ?? "draft"),
    paymentStatus: markPaid ? "paid_in_full" : "balance_due",
    dueDate: input.dueDate,
    terms: input.terms,
    finalPriceNotes: input.finalPriceNotes,
    createdAt: new Date().toISOString(),
  };

  if (await isDbReady()) {
    await (await sbWrite()).from("invoices").insert(invoiceToRow(invoice));
  } else if (isDemoDataEnabled()) {
    mockCreateInvoice(companyId, invoice);
  }

  await logActivity({
    companyId,
    actorProfileId: options?.actorProfileId,
    entityType: "invoice",
    entityId: invoice.id,
    action: "created",
    message: `Invoice ${invoice.invoiceNumber} created`,
    metadata: { total: invoice.total, customerId: input.customerId },
  });

  return invoice;
}

// --- Payments ---

export async function getPayments(companyId: string): Promise<Payment[]> {
  if (!(await isDbReady())) return demoOr(mockGetPayments(companyId), []);
  const { data, error } = await (await sb())
    .from("payments")
    .select("*")
    .eq("company_id", companyId);
  if (error) throw error;
  return filterPayments((data ?? []).map(rowToPayment));
}

export async function createPayment(
  companyId: string,
  payment: Omit<Payment, "id" | "createdAt"> & {
    customerId?: string;
    collectedByEmployeeId?: string;
    notes?: string;
  },
  options?: { actorProfileId?: string }
): Promise<Payment> {
  const paymentId = opsId("pay");
  const created: Payment = {
    ...payment,
    id: paymentId,
    createdAt: new Date().toISOString(),
  };

  const dbReady = await isDbReady();
  let invoice: Invoice | undefined;
  if (dbReady) {
    if (payment.invoiceId) {
      invoice = await getInvoiceById(companyId, payment.invoiceId);
    } else if (payment.jobId) {
      const all = await getInvoices(companyId);
      invoice = all.find((i) => i.jobId === payment.jobId);
    }
  } else if (isDemoDataEnabled()) {
    const invoices = mockGetInvoices(companyId);
    invoice = payment.invoiceId
      ? invoices.find((i) => i.id === payment.invoiceId)
      : invoices.find((i) => i.jobId === payment.jobId);
    mockCreatePayment(companyId, payment);
  }

  if (!payment.customerId && !invoice?.customerId && !dbReady && !isDemoDataEnabled()) {
    throw new Error("customerId required for payment");
  }

  if (invoice) {
    const amountPaid = invoice.amountPaid + payment.amount;
    const depositPaid =
      payment.timing === "deposit"
        ? invoice.depositPaid + payment.amount
        : invoice.depositPaid;
    const balanceDue = Math.max(0, invoice.total - amountPaid);
    const invUpdates: Partial<Invoice> = {
      amountPaid,
      depositPaid,
      balanceDue,
      status: balanceDue <= 0 ? "paid" : amountPaid > 0 ? "partial" : invoice.status,
    };
    const draft = { ...invoice, ...invUpdates };
    invUpdates.paymentStatus = derivePaymentStatus(draft);
    await updateInvoice(companyId, invoice.id, invUpdates, options);
  }

  const customerId = payment.customerId ?? invoice?.customerId;
  if (!customerId) {
    throw new Error("customerId required — select customer or link invoice");
  }

  if (dbReady) {
    await (await sbWrite()).from("payments").upsert({
      id: created.id,
      company_id: companyId,
      customer_id: customerId,
      job_id: created.jobId,
      invoice_id: created.invoiceId ?? null,
      amount: created.amount,
      method: created.method,
      timing: created.timing,
      status: created.status,
      receipt_number: created.receiptNumber ?? null,
      transaction_id: created.receiptNumber ?? null,
      collected_by_employee_id: payment.collectedByEmployeeId ?? null,
      notes: payment.notes ?? null,
    });
  }

  await logActivity({
    companyId,
    actorProfileId: options?.actorProfileId ?? customerId,
    entityType: "payment",
    entityId: created.id,
    action: "created",
    message: `Payment of $${payment.amount} received`,
    metadata: { jobId: payment.jobId, invoiceId: payment.invoiceId, method: payment.method },
  });

  return created;
}

// --- Financing ---

export async function getFinancingRequests(companyId: string): Promise<FinancingRequest[]> {
  if (!(await isDbReady())) return demoOr(mockGetFinancingRequests(companyId), []);
  const { data, error } = await (await sb())
    .from("financing_requests")
    .select("*")
    .eq("company_id", companyId);
  if (error) throw error;
  return filterFinancing((data ?? []).map(rowToFinancing));
}

export async function createFinancingRequest(
  companyId: string,
  request: Omit<FinancingRequest, "id" | "createdAt" | "updatedAt">,
  options?: { actorProfileId?: string }
): Promise<FinancingRequest> {
  const created = mockCreateFinancingRequest(companyId, request);
  if (created.invoiceId) {
    mockUpdateInvoice(companyId, created.invoiceId, { paymentStatus: "financing_requested" });
  }
  if (await isDbReady()) {
    await (await sbWrite()).from("financing_requests").upsert({
      id: created.id,
      company_id: companyId,
      job_id: created.jobId,
      invoice_id: created.invoiceId ?? null,
      customer_id: created.customerId,
      provider: created.provider,
      status: created.status,
      total_amount: created.totalAmount,
      requested_amount: created.totalAmount,
      down_payment: created.downPayment,
      number_of_payments: created.numberOfPayments,
      payment_count: created.numberOfPayments,
      payment_frequency: created.paymentFrequency,
      preferred_first_payment_date: created.preferredFirstPaymentDate ?? null,
      first_payment_date: created.preferredFirstPaymentDate ?? null,
      employment_status: created.employmentStatus ?? null,
      monthly_income: created.monthlyIncome ?? null,
      customer_notes: created.customerNotes ?? null,
      internal_notes: created.internalNotes ?? null,
      admin_notes: created.internalNotes ?? null,
      terms_accepted: created.termsAccepted,
      risk_score: created.riskScore ?? null,
      payment_schedule: created.paymentSchedule ?? [],
    });
    if (created.invoiceId) {
      const inv = mockGetInvoice(companyId, created.invoiceId);
      if (inv) await (await sbWrite()).from("invoices").upsert(invoiceToRow(inv));
    }
    await logActivity({
      companyId,
      actorProfileId: options?.actorProfileId ?? created.customerId,
      entityType: "financing_request",
      entityId: created.id,
      action: "submitted",
      message: `Financing request submitted for $${created.totalAmount}`,
      metadata: { jobId: created.jobId },
    });
  } else {
    await logActivity({
      companyId,
      actorProfileId: options?.actorProfileId ?? created.customerId,
      entityType: "financing_request",
      entityId: created.id,
      action: "submitted",
      message: `Financing request submitted for $${created.totalAmount}`,
      metadata: { jobId: created.jobId },
    });
  }
  return created;
}

export async function approveFinancingRequest(
  companyId: string,
  requestId: string,
  options?: {
    downPayment?: number;
    numberOfPayments?: number;
    internalNotes?: string;
    actorProfileId?: string;
  }
): Promise<FinancingRequest | undefined> {
  const existing = mockGetFinancingRequest(companyId, requestId);
  if (!existing) return undefined;

  const merged = {
    ...existing,
    downPayment: options?.downPayment ?? existing.downPayment,
    numberOfPayments: options?.numberOfPayments ?? existing.numberOfPayments,
    internalNotes: options?.internalNotes ?? existing.internalNotes,
  };
  const remaining = Math.max(0, merged.totalAmount - merged.downPayment);
  const start = merged.preferredFirstPaymentDate ?? new Date().toISOString().split("T")[0];
  const paymentSchedule = generatePaymentSchedule(
    remaining,
    merged.numberOfPayments,
    merged.paymentFrequency,
    start
  );

  const updated = mockUpdateFinancingRequest(companyId, requestId, {
    status: "approved",
    downPayment: merged.downPayment,
    numberOfPayments: merged.numberOfPayments,
    internalNotes: merged.internalNotes,
    paymentSchedule,
  });

  if (updated?.invoiceId) {
    mockUpdateInvoice(companyId, updated.invoiceId, { paymentStatus: "financing_approved" });
  }

  if (updated && (await isDbReady())) {
    await (await sbWrite())
      .from("financing_requests")
      .update({
        status: "approved",
        down_payment: updated.downPayment,
        number_of_payments: updated.numberOfPayments,
        payment_count: updated.numberOfPayments,
        admin_notes: updated.internalNotes ?? null,
        approved_at: new Date().toISOString(),
        payment_schedule: updated.paymentSchedule ?? [],
      })
      .eq("id", requestId);

    if (updated.invoiceId) {
      const inv = mockGetInvoice(companyId, updated.invoiceId);
      if (inv) await (await sbWrite()).from("invoices").upsert(invoiceToRow(inv));
    }

    await (await sbWrite()).from("financing_payments").upsert(
      paymentSchedule.map((p, i) => ({
        id: `fp-${requestId}-${i + 1}`,
        company_id: companyId,
        financing_request_id: requestId,
        customer_id: updated.customerId,
        invoice_id: updated.invoiceId ?? null,
        payment_number: i + 1,
        amount_due: p.amount,
        due_date: p.dueDate,
        amount_paid: 0,
        status: "pending",
      }))
    );

    await logActivity({
      companyId,
      actorProfileId: options?.actorProfileId,
      entityType: "financing_request",
      entityId: requestId,
      action: "approved",
      message: `Financing approved — ${updated.numberOfPayments} payments`,
      metadata: { downPayment: updated.downPayment },
    });
  } else if (updated) {
    await logActivity({
      companyId,
      actorProfileId: options?.actorProfileId,
      entityType: "financing_request",
      entityId: requestId,
      action: "approved",
      message: `Financing approved — ${updated.numberOfPayments} payments`,
      metadata: { downPayment: updated.downPayment },
    });
  }
  return updated;
}

export async function denyFinancingRequest(
  companyId: string,
  requestId: string,
  reason?: string,
  options?: { actorProfileId?: string; internalNotes?: string }
): Promise<FinancingRequest | undefined> {
  const updated = mockUpdateFinancingRequest(companyId, requestId, {
    status: "denied",
    denialReason: reason,
    internalNotes: options?.internalNotes,
  });
  if (updated?.invoiceId) {
    mockUpdateInvoice(companyId, updated.invoiceId, { paymentStatus: "financing_denied" });
  }
  if (updated && (await isDbReady())) {
    await (await sbWrite())
      .from("financing_requests")
      .update({
        status: "denied",
        denial_reason: reason ?? "Not approved",
        admin_notes: options?.internalNotes ?? null,
        denied_at: new Date().toISOString(),
      })
      .eq("id", requestId);
    if (updated.invoiceId) {
      const inv = mockGetInvoice(companyId, updated.invoiceId);
      if (inv) await (await sbWrite()).from("invoices").upsert(invoiceToRow(inv));
    }
    await logActivity({
      companyId,
      actorProfileId: options?.actorProfileId,
      entityType: "financing_request",
      entityId: requestId,
      action: "denied",
      message: `Financing request denied`,
      metadata: { reason },
    });
  } else if (updated) {
    await logActivity({
      companyId,
      actorProfileId: options?.actorProfileId,
      entityType: "financing_request",
      entityId: requestId,
      action: "denied",
      message: "Financing request denied",
      metadata: { reason },
    });
  }
  return updated;
}

export async function getCustomers(companyId: string): Promise<Customer[]> {
  if (!(await isDbReady())) return isDemoDataEnabled() ? mockGetCustomers(companyId) : [];
  const { data, error } = await (await sb())
    .from("customers")
    .select("*")
    .eq("company_id", companyId);
  if (error) throw error;
  return filterCustomers((data ?? []).map(rowToCustomerUser));
}

export async function createAdminCustomer(
  companyId: string,
  input: {
    firstName: string;
    lastName: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    notes?: string;
  },
  options?: { actorProfileId?: string }
): Promise<Customer> {
  const custId = `cust-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const row = {
    id: custId,
    company_id: companyId,
    first_name: input.firstName,
    last_name: input.lastName,
    phone: input.phone,
    email: input.email,
    address: input.address,
    city: input.city,
    state: input.state ?? "MO",
    zip: input.zip,
    notes: input.notes,
    preferred_contact_method: "phone",
  };
  if (await isDbReady()) {
    await (await sbWrite()).from("customers").insert(row);
  }
  await logActivity({
    companyId,
    actorProfileId: options?.actorProfileId,
    entityType: "customer",
    entityId: custId,
    action: "created",
    message: `Customer created — ${input.firstName} ${input.lastName}`,
  });
  return rowToCustomerUser({ ...row, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), lifetime_value: 0, total_jobs: 0 });
}

export async function createAdminJobManual(
  companyId: string,
  input: {
    customerId: string;
    serviceType: "junk_removal" | "hauling_transport";
    street: string;
    city: string;
    state: string;
    zip: string;
    junkType?: string;
    scheduledDate?: string;
    scheduledWindowLabel?: string;
    estimatedTotal?: number;
    notes?: string;
    assignedEmployeeIds?: string[];
    truckId?: string;
    trailerId?: string;
  },
  options?: { actorProfileId?: string }
): Promise<Job> {
  const total = input.estimatedTotal ?? 0;
  return createJobFromBooking(
    companyId,
    {
      companyId,
      customerId: input.customerId,
      serviceType: input.serviceType,
      status: input.scheduledDate ? "scheduled" : "submitted",
      junkType: input.junkType ?? "mixed",
      items: [],
      loadSizeTier: "quarter_25",
      accessDetails: {
        stairs: false,
        elevator: false,
        longCarryFt: 0,
        basement: false,
        attic: false,
        tightAccess: false,
        heavyItems: false,
        specialDisposal: false,
        notes: input.notes,
      },
      address: {
        street: input.street,
        city: input.city,
        state: input.state,
        zip: input.zip,
      },
      photos: [],
      warnings: [],
      estimateType: input.serviceType,
      pricingBreakdown: total ? [{ id: "base", label: "Admin estimate", amount: total }] : [],
      disclaimerAccepted: true,
      scheduledDate: input.scheduledDate,
      scheduledWindowLabel: input.scheduledWindowLabel,
      assignedEmployeeIds: input.assignedEmployeeIds,
      assignedTruckId: input.truckId,
      assignedTrailerId: input.trailerId,
      customerNotes: input.notes,
    },
    { actorProfileId: options?.actorProfileId }
  );
}

export async function getEmployees(companyId: string): Promise<Employee[]> {
  if (!(await isDbReady())) {
    return demoOr(
      mockGetUsers(companyId).filter((u): u is Employee => u.role !== "customer"),
      []
    );
  }
  const { data, error } = await (await sb())
    .from("employees")
    .select("*")
    .eq("company_id", companyId)
    .eq("status", "active");
  if (error) throw error;
  return (data ?? []).map(rowToEmployeeUser);
}

// --- Fleet & ops ---

export async function getDumpSites(companyId: string) {
  if (!(await isDbReady())) {
    if (isDemoDataEnabled()) return morrisConfig.dumpSites;
    return [];
  }
  const { data, error } = await (await sb())
    .from("dump_sites")
    .select("*")
    .eq("company_id", companyId)
    .eq("status", "active");
  if (error) throw error;
  return (data ?? []).map((d) => ({
    id: d.id,
    name: d.name,
    address: [d.address, d.city, d.state, d.zip].filter(Boolean).join(", "),
    location: { lat: Number(d.latitude), lng: Number(d.longitude) },
    feePerLoad: d.base_fee != null ? Number(d.base_fee) : undefined,
  }));
}

export async function getServiceAreas(companyId: string) {
  if (!(await isDbReady())) return [{ label: morrisConfig.serviceArea.label }];
  const { data, error } = await (await sb())
    .from("service_areas")
    .select("*")
    .eq("company_id", companyId)
    .eq("is_active", true);
  if (error) throw error;
  return data ?? [];
}

export async function getActivityLog(companyId: string, limit = 50) {
  const { getActivityLogRows } = await import("@/lib/db/activity");
  const rows = await getActivityLogRows(companyId, limit);
  return filterActivityLog(rows);
}

// --- Routes ---

export async function createRoute(
  companyId: string,
  route: {
    id: string;
    routeDate: string;
    truckId?: string;
    trailerId?: string;
    assignedDriverId?: string;
    status?: string;
    startLocation?: object;
    endLocation?: object;
    estimatedMiles?: number;
    estimatedHours?: number;
    notes?: string;
  }
) {
  if (!(await isDbReady())) return route;
  const { error } = await (await sbWrite()).from("routes").upsert({
    id: route.id,
    company_id: companyId,
    route_date: route.routeDate,
    truck_id: route.truckId ?? null,
    trailer_id: route.trailerId ?? null,
    assigned_driver_id: route.assignedDriverId ?? null,
    status: route.status ?? "planned",
    start_location: route.startLocation ?? null,
    end_location: route.endLocation ?? null,
    estimated_miles: route.estimatedMiles ?? null,
    estimated_hours: route.estimatedHours ?? null,
    notes: route.notes ?? null,
  });
  if (error) throw error;
  return route;
}

export async function updateRouteStop(
  companyId: string,
  stopId: string,
  updates: Record<string, unknown>
) {
  if (!(await isDbReady())) return;
  const { error } = await (await sbWrite())
    .from("route_stops")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", stopId)
    .eq("company_id", companyId);
  if (error) throw error;
}

export async function getRoutesForDate(companyId: string, routeDate: string) {
  if (!(await isDbReady())) return [];
  const { data, error } = await (await sb())
    .from("routes")
    .select("*, route_stops(*)")
    .eq("company_id", companyId)
    .eq("route_date", routeDate);
  if (error) throw error;
  return data ?? [];
}

export async function getInvoiceByJob(
  companyId: string,
  jobId: string
): Promise<Invoice | undefined> {
  const invoices = await getInvoices(companyId);
  return invoices.find((i) => i.jobId === jobId);
}

export async function getFinancingByJob(
  companyId: string,
  jobId: string
): Promise<FinancingRequest | undefined> {
  const requests = await getFinancingRequests(companyId);
  return requests.find((f) => f.jobId === jobId);
}

export async function getAdminInvoiceDetail(companyId: string, invoiceId: string) {
  const invoice = await getInvoiceById(companyId, invoiceId);
  if (!invoice) return null;

  const [job, customers, payments, financing, activityRows] = await Promise.all([
    getJobById(companyId, invoice.jobId),
    getCustomers(companyId),
    getPayments(companyId),
    getFinancingRequests(companyId),
    getActivityLog(companyId, 100),
  ]);

  const customer = customers.find((c) => c.id === invoice.customerId);
  const invoicePayments = payments.filter(
    (p) => p.invoiceId === invoiceId || p.jobId === invoice.jobId
  );
  const jobFinancing = financing.find((f) => f.jobId === invoice.jobId);
  const activity = (activityRows as Record<string, unknown>[]).filter(
    (r) =>
      (r.entity_type === "invoice" && r.entity_id === invoiceId) ||
      (r.entity_type === "payment" &&
        invoicePayments.some((p) => p.id === r.entity_id)) ||
      (r.entity_type === "job" && r.entity_id === invoice.jobId)
  );

  return { invoice, job, customer, payments: invoicePayments, financing: jobFinancing, activity };
}

export async function generateInvoicePdf(
  companyId: string,
  invoiceId: string,
  options?: { actorProfileId?: string; force?: boolean }
): Promise<{ storagePath: string; signedUrl: string }> {
  const detail = await getAdminInvoiceDetail(companyId, invoiceId);
  if (!detail) throw new Error("Invoice not found");

  if (detail.invoice.pdfStoragePath && !options?.force) {
    const { createSignedStorageUrl } = await import("@/lib/storage/upload");
    const { STORAGE_BUCKETS } = await import("@/lib/storage/buckets");
    return {
      storagePath: detail.invoice.pdfStoragePath,
      signedUrl: await createSignedStorageUrl(STORAGE_BUCKETS.invoicePdfs, detail.invoice.pdfStoragePath),
    };
  }

  const { buildInvoicePdf } = await import("@/lib/invoices/generate-pdf");
  const { uploadToStorage, createSignedStorageUrl } = await import("@/lib/storage/upload");
  const { STORAGE_BUCKETS } = await import("@/lib/storage/buckets");

  const pdfBytes = await buildInvoicePdf({
    invoice: detail.invoice,
    job: detail.job,
    customer: detail.customer,
    payments: detail.payments,
  });

  const storagePath = `${companyId}/invoices/${invoiceId}.pdf`;
  await uploadToStorage({
    bucket: STORAGE_BUCKETS.invoicePdfs,
    path: storagePath,
    body: Buffer.from(pdfBytes),
    contentType: "application/pdf",
  });

  await updateInvoice(companyId, invoiceId, { pdfStoragePath: storagePath }, { actorProfileId: options?.actorProfileId });

  return {
    storagePath,
    signedUrl: await createSignedStorageUrl(STORAGE_BUCKETS.invoicePdfs, storagePath),
  };
}

export async function voidInvoice(
  companyId: string,
  invoiceId: string,
  options?: { actorProfileId?: string; reason?: string }
) {
  return updateInvoice(
    companyId,
    invoiceId,
    {
      status: "void",
      balanceDue: 0,
      finalPriceNotes: options?.reason ?? "Voided by admin",
    },
    options
  );
}

// --- Dashboards ---

export async function getCustomerDashboard(companyId: string, customerId: string) {
  const [jobs, invoices, payments, financing] = await Promise.all([
    getJobs(companyId),
    getInvoices(companyId),
    getPayments(companyId),
    getFinancingRequests(companyId),
  ]);
  const customerJobs = jobs.filter((j) => j.customerId === customerId);
  const jobIds = new Set(customerJobs.map((j) => j.id));
  return {
    jobs: customerJobs,
    invoices: invoices.filter((i) => i.customerId === customerId),
    payments: payments.filter(
      (p) =>
        p.customerId === customerId ||
        jobIds.has(p.jobId) ||
        invoices.some((i) => i.id === p.invoiceId && i.customerId === customerId)
    ),
    financing: financing.filter((f) => f.customerId === customerId),
  };
}

export async function getCustomerJobDetail(
  companyId: string,
  customerId: string,
  jobId: string
) {
  const job = await getJobById(companyId, jobId);
  if (!job || job.customerId !== customerId) return null;
  const invoice = await getInvoiceByJob(companyId, jobId);
  const financing = await getFinancingByJob(companyId, jobId);
  return { job, invoice, financing };
}

export async function getOperationsCommandCenter(
  companyId: string,
  options?: { debug?: boolean }
) {
  const { format } = await import("date-fns");
  const { morrisConfig } = await import("@/lib/morris-config");
  const { buildOperationsCommandCenter } = await import("@/lib/ops/command-center-metrics");
  const { getScheduleSlots } = await import("@/lib/db/schedule-operations");
  const { getOperationsDepthSnapshot, getOperationalTrailers } = await import("@/lib/db/operations-depth");
  const { getHrEmployees } = await import("@/lib/db/hr/employees");

  const today = format(new Date(), "yyyy-MM-dd");

  const [jobs, invoices, payments, financing, activity, customers, scheduleSlots, depth, hrEmployees, trailers] =
    await Promise.all([
      getJobs(companyId),
      getInvoices(companyId),
      getPayments(companyId),
      getFinancingRequests(companyId),
      getActivityLog(companyId, 100),
      getCustomers(companyId),
      getScheduleSlots(companyId, { fromDate: today, includeClosed: true }),
      getOperationsDepthSnapshot(companyId),
      getHrEmployees(companyId, { lifecycleStatus: "active" }).catch(() => []),
      getOperationalTrailers(companyId).catch(() => []),
    ]);

  const onboardingEmployees = await getHrEmployees(companyId, { lifecycleStatus: "onboarding" }).catch(() => []);
  const allHr = [...hrEmployees, ...onboardingEmployees];

  const rawInput = {
    companyId,
    today,
    jobs,
    invoices,
    payments,
    financing,
    scheduleSlots,
    activityLog: activity,
    customers,
    company: morrisConfig,
    depth,
    trailers,
    hrEmployees: allHr.map((e) => ({
      id: e.id,
      name: `${e.firstName} ${e.lastName}`,
      firstName: e.firstName,
      lastName: e.lastName,
      email: e.email,
    })),
  };

  const { applyRealRecordFilter, buildOperationsDebugReport } = await import(
    "@/lib/data/operations-debug-report"
  );
  const {
    fetchJobsUnfiltered,
    fetchInvoicesUnfiltered,
    fetchPaymentsUnfiltered,
    fetchCustomersUnfiltered,
    fetchFinancingUnfiltered,
    fetchActivityUnfiltered,
  } = await import("@/lib/db/admin-unfiltered");

  const filtered = applyRealRecordFilter({
    jobs: rawInput.jobs,
    invoices: rawInput.invoices,
    payments: rawInput.payments,
    financing: rawInput.financing,
    customers: rawInput.customers,
    hrEmployees: rawInput.hrEmployees,
    depth: rawInput.depth,
    trailers: rawInput.trailers,
    activityLog: rawInput.activityLog,
    scheduleSlots: rawInput.scheduleSlots,
  });

  const commandCenterInput = {
    ...rawInput,
    jobs: filtered.jobs,
    invoices: filtered.invoices,
    payments: filtered.payments,
    financing: filtered.financing,
    customers: filtered.customers,
    depth: filtered.depth,
    trailers: filtered.trailers,
    activityLog: filtered.activityLog,
    hrEmployees: filtered.hrEmployees,
    scheduleSlots: filtered.scheduleSlots ?? rawInput.scheduleSlots,
  };

  const data = buildOperationsCommandCenter(commandCenterInput);

  if (options?.debug) {
    const [jobsRaw, invoicesRaw, paymentsRaw, customersRaw, activityRaw] = await Promise.all([
      fetchJobsUnfiltered(companyId),
      fetchInvoicesUnfiltered(companyId),
      fetchPaymentsUnfiltered(companyId),
      fetchCustomersUnfiltered(companyId),
      fetchActivityUnfiltered(companyId, 100),
    ]);
    return {
      data,
      debug: buildOperationsDebugReport({
        jobs: jobsRaw,
        invoices: invoicesRaw,
        payments: paymentsRaw,
        financing: await fetchFinancingUnfiltered(companyId),
        customers: customersRaw,
        hrEmployees: rawInput.hrEmployees,
        depth,
        trailers,
        activityLog: activityRaw,
      }),
    };
  }

  return data;
}

export async function getAdminDashboard(companyId: string) {
  const [jobs, invoices, payments, financing, activity] = await Promise.all([
    getJobs(companyId),
    getInvoices(companyId),
    getPayments(companyId),
    getFinancingRequests(companyId),
    getActivityLog(companyId, 20),
  ]);
  const outstanding = invoices.reduce((s, i) => s + i.balanceDue, 0);
  const pendingFinancing = financing.filter((f) => f.status === "pending").length;
  return {
    jobCount: jobs.length,
    activeJobs: jobs.filter((j) => !["completed", "cancelled"].includes(j.status)).length,
    outstandingBalance: outstanding,
    pendingFinancing,
    recentActivity: activity,
    invoices,
    payments,
  };
}

export async function getEmployeeDashboard(companyId: string, employeeId: string) {
  const jobs = await getJobs(companyId);
  const today = new Date().toISOString().split("T")[0];
  const todayJobs = jobs.filter(
    (j) =>
      j.scheduledDate === today &&
      (j.assignedEmployeeIds?.includes(employeeId) ?? false)
  );
  return { todayJobs, totalAssigned: todayJobs.length };
}

export async function getPlannerDashboard(companyId: string) {
  const today = new Date().toISOString().split("T")[0];
  const { getScheduleSlots } = await import("@/lib/db/schedule-operations");
  const [jobs, routes, dumpSites, scheduleSlots] = await Promise.all([
    getJobs(companyId, { scheduledDate: today }),
    getRoutesForDate(companyId, today),
    getDumpSites(companyId),
    getScheduleSlots(companyId, { fromDate: today, includeClosed: true }),
  ]);
  return { jobs, routes, dumpSites, scheduleSlots };
}

/** Filter hydrated store by authenticated profile role */
export function filterStoreByProfile<T extends {
  jobs: Job[];
  invoices: Invoice[];
  payments: Payment[];
  financingRequests: FinancingRequest[];
}>(store: T, profile: UserProfile | null): T {
  const emptyScoped = (): T => ({
    ...store,
    jobs: [],
    invoices: [],
    payments: [],
    financingRequests: [],
  });

  if (!profile) return emptyScoped();

  if (profile.role === "admin" || profile.role === "planner") return store;

  if (profile.role === "customer" && profile.customer_id) {
    const cid = profile.customer_id;
    return {
      ...store,
      jobs: store.jobs.filter((j) => j.customerId === cid),
      invoices: store.invoices.filter((i) => i.customerId === cid),
      payments: store.payments.filter((p) =>
        store.jobs.some((j) => j.id === p.jobId && j.customerId === cid)
      ),
      financingRequests: store.financingRequests.filter((f) => f.customerId === cid),
    };
  }

  if (profile.role === "employee" && profile.employee_id) {
    const eid = profile.employee_id;
    const assignedJobs = store.jobs.filter((j) => j.assignedEmployeeIds?.includes(eid));
    const jobIds = new Set(assignedJobs.map((j) => j.id));
    return {
      ...store,
      jobs: assignedJobs,
      invoices: store.invoices.filter((i) => jobIds.has(i.jobId)),
      payments: store.payments.filter((p) => jobIds.has(p.jobId)),
      financingRequests: store.financingRequests.filter((f) => jobIds.has(f.jobId)),
    };
  }

  return emptyScoped();
}

/** Full store payload for client hydration */
export async function getCompanyStore(companyId: string, profile?: UserProfile | null) {
  const ready = await isDbReady();
  if (!ready) {
    const empty = {
      source: "mock" as const,
      tablesReady: false,
      users: [] as (Customer | Employee)[],
      jobs: [] as Job[],
      invoices: [] as Invoice[],
      payments: [] as Payment[],
      financingRequests: [] as FinancingRequest[],
    };
    if (!isDemoDataEnabled()) {
      return filterStoreByProfile(empty, profile ?? null);
    }
    return filterStoreByProfile(
      {
        source: "mock" as const,
        tablesReady: false,
        users: mockGetUsers(companyId),
        jobs: mockGetJobs(companyId),
        invoices: mockGetInvoices(companyId),
        payments: mockGetPayments(companyId),
        financingRequests: mockGetFinancingRequests(companyId),
      },
      profile ?? null
    );
  }

  const [customers, employees, jobs, invoices, payments, financingRequests] =
    await Promise.all([
      getCustomers(companyId),
      getEmployees(companyId),
      getJobs(companyId),
      getInvoices(companyId),
      getPayments(companyId),
      getFinancingRequests(companyId),
    ]);

  return filterStoreByProfile(
    {
      source: "supabase" as const,
      tablesReady: true,
      users: [...customers, ...employees],
      jobs,
      invoices,
      payments,
      financingRequests,
    },
    profile ?? null
  );
}
