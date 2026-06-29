import type {
  FinancingRequest,
  Invoice,
  Job,
  Payment,
  User,
} from "@/types";
import type { Customer, Employee } from "@/types/user";
import { createClient } from "@/lib/supabase/server";

function rowToJob(row: {
  id: string;
  company_id: string;
  customer_id: string;
  status: string;
  junk_type: string;
  scheduled_date: string | null;
  payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}): Job {
  const payload = row.payload as Partial<Job>;
  return {
    ...payload,
    id: row.id,
    companyId: row.company_id,
    customerId: row.customer_id,
    status: row.status as Job["status"],
    junkType: row.junk_type || payload.junkType || "",
    scheduledDate: row.scheduled_date ?? payload.scheduledDate,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items: payload.items ?? [],
    loadSizeTier: payload.loadSizeTier ?? "quarter_25",
    accessDetails: payload.accessDetails ?? {
      stairs: false,
      elevator: false,
      longCarryFt: 0,
      basement: false,
      attic: false,
      tightAccess: false,
      heavyItems: false,
      specialDisposal: false,
    },
    address: payload.address ?? { street: "", city: "", state: "", zip: "" },
    photos: payload.photos ?? [],
    warnings: payload.warnings ?? [],
  };
}

function rowToInvoice(row: Record<string, unknown>): Invoice {
  return {
    id: row.id as string,
    invoiceNumber: row.invoice_number as string,
    companyId: row.company_id as string,
    jobId: row.job_id as string,
    customerId: row.customer_id as string,
    estimateAmount: Number(row.estimate_amount),
    adjustments: (row.adjustments as Invoice["adjustments"]) ?? [],
    subtotal: Number(row.subtotal),
    fees: Number(row.fees),
    depositAmount: Number(row.deposit_amount),
    depositPaid: Number(row.deposit_paid),
    total: Number(row.total),
    amountPaid: Number(row.amount_paid),
    balanceDue: Number(row.balance_due),
    status: row.status as Invoice["status"],
    paymentStatus: row.payment_status as Invoice["paymentStatus"],
    dueDate: (row.due_date as string) ?? undefined,
    terms: (row.terms as string) ?? undefined,
    finalPriceNotes: (row.final_price_notes as string) ?? undefined,
    createdAt: row.created_at as string,
  };
}

function rowToPayment(row: Record<string, unknown>): Payment {
  return {
    id: row.id as string,
    companyId: row.company_id as string,
    jobId: row.job_id as string,
    invoiceId: (row.invoice_id as string) ?? undefined,
    amount: Number(row.amount),
    method: row.method as Payment["method"],
    timing: row.timing as Payment["timing"],
    status: row.status as Payment["status"],
    receiptNumber: (row.receipt_number as string) ?? undefined,
    createdAt: row.created_at as string,
  };
}

function rowToFinancing(row: Record<string, unknown>): FinancingRequest {
  return {
    id: row.id as string,
    companyId: row.company_id as string,
    jobId: row.job_id as string,
    invoiceId: (row.invoice_id as string) ?? undefined,
    customerId: row.customer_id as string,
    provider: row.provider as FinancingRequest["provider"],
    status: row.status as FinancingRequest["status"],
    totalAmount: Number(row.total_amount),
    downPayment: Number(row.down_payment),
    numberOfPayments: Number(row.number_of_payments),
    paymentFrequency: row.payment_frequency as FinancingRequest["paymentFrequency"],
    preferredFirstPaymentDate: (row.preferred_first_payment_date as string) ?? undefined,
    employmentStatus: (row.employment_status as FinancingRequest["employmentStatus"]) ?? undefined,
    monthlyIncome: row.monthly_income != null ? Number(row.monthly_income) : undefined,
    customerNotes: (row.customer_notes as string) ?? undefined,
    internalNotes: (row.internal_notes as string) ?? undefined,
    signaturePlaceholder: (row.signature_placeholder as string) ?? undefined,
    termsAccepted: Boolean(row.terms_accepted),
    denialReason: (row.denial_reason as string) ?? undefined,
    riskScore: row.risk_score != null ? Number(row.risk_score) : undefined,
    paymentSchedule: (row.payment_schedule as FinancingRequest["paymentSchedule"]) ?? [],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function rowToUser(row: Record<string, unknown>): User {
  const base = {
    id: row.id as string,
    companyId: row.company_id as string,
    email: row.email as string,
    name: row.name as string,
    role: row.role as User["role"],
    phone: (row.phone as string) ?? undefined,
  };
  if (base.role === "customer") {
    const customer: Customer = {
      ...base,
      role: "customer",
      address: (row.address as string) ?? undefined,
    };
    return customer;
  }
  const employee: Employee = {
    ...base,
    role: base.role as Employee["role"],
    employeeId: (row.employee_id as string) ?? undefined,
  };
  return employee;
}

export function useSupabaseData() {
  return process.env.NEXT_PUBLIC_USE_SUPABASE === "true";
}

export async function fetchJobsFromSupabase(companyId: string): Promise<Job[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToJob);
}

export async function fetchInvoicesFromSupabase(companyId: string): Promise<Invoice[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("company_id", companyId);
  if (error) throw error;
  return (data ?? []).map(rowToInvoice);
}

export async function fetchPaymentsFromSupabase(companyId: string): Promise<Payment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("company_id", companyId);
  if (error) throw error;
  return (data ?? []).map(rowToPayment);
}

export async function fetchFinancingFromSupabase(
  companyId: string
): Promise<FinancingRequest[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("financing_requests")
    .select("*")
    .eq("company_id", companyId);
  if (error) throw error;
  return (data ?? []).map(rowToFinancing);
}

export async function fetchUsersFromSupabase(companyId: string): Promise<User[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("company_id", companyId);
  if (error) throw error;
  return (data ?? []).map(rowToUser);
}

export async function isSupabaseTablesReady(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("companies").select("id").limit(1);
    return !error || error.code !== "PGRST205";
  } catch {
    return false;
  }
}

export function jobToRow(job: Job) {
  const { id, companyId, customerId, status, junkType, scheduledDate, ...rest } = job;
  return {
    id,
    company_id: companyId,
    customer_id: customerId,
    status,
    junk_type: junkType,
    scheduled_date: scheduledDate ?? null,
    payload: { ...rest, id, companyId, customerId, status, junkType, scheduledDate },
    updated_at: new Date().toISOString(),
  };
}

export function invoiceToRow(inv: Invoice) {
  return {
    id: inv.id,
    invoice_number: inv.invoiceNumber,
    company_id: inv.companyId,
    job_id: inv.jobId,
    customer_id: inv.customerId,
    estimate_amount: inv.estimateAmount,
    adjustments: inv.adjustments,
    subtotal: inv.subtotal,
    fees: inv.fees,
    deposit_amount: inv.depositAmount,
    deposit_paid: inv.depositPaid,
    total: inv.total,
    amount_paid: inv.amountPaid,
    balance_due: inv.balanceDue,
    status: inv.status,
    payment_status: inv.paymentStatus,
    due_date: inv.dueDate ?? null,
    terms: inv.terms ?? null,
    final_price_notes: inv.finalPriceNotes ?? null,
    updated_at: new Date().toISOString(),
  };
}

export async function upsertJobToSupabase(job: Job) {
  const supabase = await createClient();
  const { error } = await supabase.from("jobs").upsert(jobToRow(job));
  if (error) throw error;
}

export async function upsertInvoiceToSupabase(inv: Invoice) {
  const supabase = await createClient();
  const { error } = await supabase.from("invoices").upsert(invoiceToRow(inv));
  if (error) throw error;
}

export async function upsertPaymentToSupabase(payment: Payment) {
  const supabase = await createClient();
  const { error } = await supabase.from("payments").upsert({
    id: payment.id,
    company_id: payment.companyId,
    job_id: payment.jobId,
    invoice_id: payment.invoiceId ?? null,
    amount: payment.amount,
    method: payment.method,
    timing: payment.timing,
    status: payment.status,
    receipt_number: payment.receiptNumber ?? null,
  });
  if (error) throw error;
}

export async function upsertFinancingToSupabase(req: FinancingRequest) {
  const supabase = await createClient();
  const { error } = await supabase.from("financing_requests").upsert({
    id: req.id,
    company_id: req.companyId,
    job_id: req.jobId,
    invoice_id: req.invoiceId ?? null,
    customer_id: req.customerId,
    provider: req.provider,
    status: req.status,
    total_amount: req.totalAmount,
    down_payment: req.downPayment,
    number_of_payments: req.numberOfPayments,
    payment_frequency: req.paymentFrequency,
    preferred_first_payment_date: req.preferredFirstPaymentDate ?? null,
    employment_status: req.employmentStatus ?? null,
    monthly_income: req.monthlyIncome ?? null,
    customer_notes: req.customerNotes ?? null,
    internal_notes: req.internalNotes ?? null,
    signature_placeholder: req.signaturePlaceholder ?? null,
    terms_accepted: req.termsAccepted,
    denial_reason: req.denialReason ?? null,
    risk_score: req.riskScore ?? null,
    payment_schedule: req.paymentSchedule ?? [],
    updated_at: req.updatedAt,
  });
  if (error) throw error;
}
