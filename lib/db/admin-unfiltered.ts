/**
 * Unfiltered DB reads for debug/inspector — returns all rows before real-record-filter.
 */
import { isDemoDataEnabled } from "@/lib/is-demo-data";
import { isDbReady } from "@/lib/db/operations";
import {
  getJobs as mockGetJobs,
  getInvoices as mockGetInvoices,
  getPayments as mockGetPayments,
  getCustomers as mockGetCustomers,
  getFinancingRequests as mockGetFinancingRequests,
} from "@/lib/mock-data";
import {
  rowToJob,
  rowToInvoice,
  rowToPayment,
  rowToCustomerUser,
  rowToFinancing,
} from "@/lib/db/mappers";
import { createClient } from "@/lib/supabase/server";

async function sb() {
  return createClient();
}

export async function fetchJobsUnfiltered(companyId: string) {
  if (!(await isDbReady())) return isDemoDataEnabled() ? mockGetJobs(companyId) : [];
  const { data, error } = await (await sb())
    .from("jobs")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => rowToJob(r));
}

export async function fetchInvoicesUnfiltered(companyId: string) {
  if (!(await isDbReady())) return isDemoDataEnabled() ? mockGetInvoices(companyId) : [];
  const { data, error } = await (await sb())
    .from("invoices")
    .select("*")
    .eq("company_id", companyId);
  if (error) throw error;
  return (data ?? []).map((r) => rowToInvoice(r));
}

export async function fetchPaymentsUnfiltered(companyId: string) {
  if (!(await isDbReady())) return isDemoDataEnabled() ? mockGetPayments(companyId) : [];
  const { data, error } = await (await sb())
    .from("payments")
    .select("*")
    .eq("company_id", companyId);
  if (error) throw error;
  return (data ?? []).map((r) => rowToPayment(r));
}

export async function fetchCustomersUnfiltered(companyId: string) {
  if (!(await isDbReady())) return isDemoDataEnabled() ? mockGetCustomers(companyId) : [];
  const { data, error } = await (await sb())
    .from("customers")
    .select("*")
    .eq("company_id", companyId);
  if (error) throw error;
  return (data ?? []).map((r) => rowToCustomerUser(r));
}

export async function fetchFinancingUnfiltered(companyId: string) {
  if (!(await isDbReady())) return isDemoDataEnabled() ? mockGetFinancingRequests(companyId) : [];
  const { data, error } = await (await sb())
    .from("financing_requests")
    .select("*")
    .eq("company_id", companyId);
  if (error) throw error;
  return (data ?? []).map((r) => rowToFinancing(r));
}

export async function fetchActivityUnfiltered(companyId: string, limit = 100) {
  if (!(await isDbReady())) return [];
  const { data, error } = await (await sb())
    .from("activity_log")
    .select("*")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}
