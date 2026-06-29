import { isDemoDataEnabled } from "@/lib/is-demo-data";
import type { FinancingRequest, Invoice, Job, Payment } from "@/types";
import type { Customer } from "@/types/user";
import type { OperationsDepthSnapshot } from "@/types/operations-depth";
import type { ScheduleSlot } from "@/types/schedule";

/** Mock/seed id prefixes from db-seed.mjs and mock-data.ts */
export const MOCK_ID_PREFIXES = [
  "job-m",
  "cust-m",
  "inv-m",
  "pay-m",
  "route-m",
  "emp-m",
  "user-m",
  "fin-m",
  "slot-m",
  "truck-m",
  "trailer-m",
  "jp-m",
  "est-m",
] as const;

export const FAKE_KNOWN_NAMES = [
  "Marcus Webb",
  "Tyler Brooks",
  "Dana Chen",
  "James Morris",
  "Alex Johnson",
  "Maria Garcia",
  "Robert Chen",
  "Verify Customer",
] as const;

export type DataSourceKind =
  | "supabase"
  | "mock-data"
  | "morris-config"
  | "seed-data"
  | "smoke-test"
  | "demo-fallback";

export type ExclusionReason =
  | "mock-id-prefix"
  | "qa-test-prefix"
  | "test-prefix"
  | "test-email"
  | "fake-name"
  | "smoke-id"
  | "smoke-metadata"
  | "smoke-name";

function norm(s: string | null | undefined): string {
  return (s ?? "").trim().toLowerCase();
}

export function isFilteringActive(): boolean {
  return !isDemoDataEnabled();
}

export function classifyRecordSource(id: string | null | undefined): DataSourceKind {
  if (!id) return "supabase";
  const lower = id.toLowerCase();
  if (lower.includes("-smoke-") || lower.includes("smoke-")) return "smoke-test";
  if (MOCK_ID_PREFIXES.some((p) => lower.startsWith(p))) return "seed-data";
  return "supabase";
}

export function getExclusionReason(input: {
  id?: string | null;
  name?: string | null;
  title?: string | null;
  description?: string | null;
  email?: string | null;
  metadata?: unknown;
}): ExclusionReason | null {
  if (!isFilteringActive()) return null;

  const id = input.id ?? "";
  const lowerId = id.toLowerCase();
  if (MOCK_ID_PREFIXES.some((p) => lowerId.startsWith(p))) return "mock-id-prefix";
  if (lowerId.includes("-smoke-") || lowerId.startsWith("smoke-")) return "smoke-id";

  const texts = [input.name, input.title, input.description].filter(Boolean) as string[];
  for (const t of texts) {
    if (t.startsWith("QA TEST")) return "qa-test-prefix";
    if (t.startsWith("Test")) return "test-prefix";
    if (norm(t).includes("smoke test") || norm(t).includes("qa test")) return "smoke-name";
  }

  if (input.email && (norm(input.email).includes("test") || norm(input.email).includes("smoke"))) {
    return "test-email";
  }

  if (input.name && FAKE_KNOWN_NAMES.some((n) => norm(input.name) === norm(n))) {
    return "fake-name";
  }

  if (input.metadata && typeof input.metadata === "object" && input.metadata !== null) {
    const meta = input.metadata as Record<string, unknown>;
    if (meta.is_test === true || meta.isTest === true) return "smoke-metadata";
  }

  return null;
}

export function isExcludedRecord(input: Parameters<typeof getExclusionReason>[0]): boolean {
  return getExclusionReason(input) !== null;
}

function isTestAddress(street: string | null | undefined): boolean {
  if (!street) return false;
  const s = norm(street);
  return (
    s.startsWith("qa test") ||
    s.includes("test st") ||
    s.includes("test ln") ||
    s.includes("test lane") ||
    /\b\d+\s+test\b/.test(s)
  );
}

function jobTitle(job: Job): string {
  const type = job.junkType?.replace(/_/g, " ") ?? job.serviceType.replace(/_/g, " ");
  return `${type} — ${job.address.street}, ${job.address.city}`;
}

export function isExcludedJob(job: Job): boolean {
  if (
    isExcludedRecord({
      id: job.id,
      title: jobTitle(job),
      description: job.customerNotes,
    })
  ) {
    return true;
  }
  if (
    isExcludedRecord({
      id: job.id,
      title: job.address.street,
      description: `${job.address.city} ${job.address.zip}`,
    })
  ) {
    return true;
  }
  if (isTestAddress(job.address.street)) {
    return isFilteringActive();
  }
  if (job.customerId && isExcludedRecord({ id: job.customerId })) {
    return true;
  }
  const extended = job as Job & { payload?: { is_test?: boolean; isTest?: boolean } };
  if (extended.payload?.is_test === true || extended.payload?.isTest === true) {
    return isFilteringActive();
  }
  return false;
}

export function isExcludedCustomer(c: Customer): boolean {
  return isExcludedRecord({ id: c.id, name: c.name, email: c.email });
}

export function isExcludedInvoice(inv: Invoice): boolean {
  return isExcludedRecord({ id: inv.id, title: inv.id });
}

export function isExcludedPayment(p: Payment): boolean {
  return isExcludedRecord({ id: p.id, title: p.id });
}

export function isExcludedFinancing(f: FinancingRequest): boolean {
  return isExcludedRecord({ id: f.id, title: f.id });
}

export function isExcludedEmployee(input: {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
}): boolean {
  const name =
    input.name ??
    `${input.firstName ?? ""} ${input.lastName ?? ""}`.trim();
  return isExcludedRecord({ id: input.id, name, email: input.email });
}

export function isExcludedTruck(input: { id: string; name?: string }): boolean {
  return isExcludedRecord({ id: input.id, name: input.name });
}

export function isExcludedRoute(input: { id: string }): boolean {
  return isExcludedRecord({ id: input.id });
}

export function isExcludedActivity(row: Record<string, unknown>): boolean {
  if (!isFilteringActive()) return false;

  const entityId = String(row.entity_id ?? "");
  const message = String(row.message ?? "");
  const action = String(row.action ?? "");
  const id = String(row.id ?? "");

  if (entityId && MOCK_ID_PREFIXES.some((p) => entityId.toLowerCase().startsWith(p))) {
    return true;
  }
  if (MOCK_ID_PREFIXES.some((p) => id.toLowerCase().startsWith(p))) {
    return true;
  }
  if (isExcludedRecord({ id, title: message, description: action, metadata: row.metadata })) {
    return true;
  }
  return isExcludedActivityMessage(message);
}

/** Block known seed/demo activity copy when not in demo mode. */
export function isExcludedActivityMessage(message: string | null | undefined): boolean {
  if (!isFilteringActive() || !message) return false;
  const m = message.toLowerCase();
  if (m.includes("99 test")) return true;
  if (m.includes("estate cleanout")) return true;
  if (/job-m\d/.test(m)) return true;
  if (m.includes("route planned with 3 jobs")) return true;
  if (m.includes("deposit of $62")) return true;
  if (m.includes("new booking submitted") && m.includes("test")) return true;
  if (m.includes("missing disposal")) return false;
  if (m.includes("financing request submitted")) return true;
  if (m.includes("job completed and paid in full")) return true;
  return false;
}

export interface ActivityFeedLike {
  id: string;
  message: string;
  amount?: number;
}

export function isExcludedActivityFeedItem(item: ActivityFeedLike): boolean {
  if (!isFilteringActive()) return false;
  const idLower = item.id.toLowerCase();
  if (MOCK_ID_PREFIXES.some((p) => idLower.includes(p))) return true;
  if (isExcludedActivityMessage(item.message)) return true;
  if (item.amount === 62 && item.message.toLowerCase().includes("deposit")) return true;
  return false;
}

export function filterActivityFeedItems<T extends ActivityFeedLike>(items: T[]): T[] {
  if (!isFilteringActive()) return items;
  return items.filter((item) => !isExcludedActivityFeedItem(item));
}

export function filterJobs(jobs: Job[]): Job[] {
  if (!isFilteringActive()) return jobs;
  return jobs.filter((j) => !isExcludedJob(j));
}

export function filterCustomers(customers: Customer[]): Customer[] {
  if (!isFilteringActive()) return customers;
  return customers.filter((c) => !isExcludedCustomer(c));
}

export function filterInvoices(invoices: Invoice[]): Invoice[] {
  if (!isFilteringActive()) return invoices;
  return invoices.filter((i) => !isExcludedInvoice(i));
}

export function filterPayments(payments: Payment[]): Payment[] {
  if (!isFilteringActive()) return payments;
  return payments.filter((p) => !isExcludedPayment(p));
}

export function filterFinancing(items: FinancingRequest[]): FinancingRequest[] {
  if (!isFilteringActive()) return items;
  return items.filter((f) => !isExcludedFinancing(f));
}

export function filterHrEmployees<T extends { id: string; firstName?: string; lastName?: string; name?: string; email?: string }>(
  employees: T[]
): T[] {
  if (!isFilteringActive()) return employees;
  return employees.filter((e) => !isExcludedEmployee(e));
}

export function filterDepthSnapshot(depth: OperationsDepthSnapshot): OperationsDepthSnapshot {
  if (!isFilteringActive()) return depth;
  return {
    ...depth,
    trucks: depth.trucks.filter((t) => !isExcludedTruck(t)),
    timeclock: depth.timeclock.filter((tc) => !isExcludedRecord({ id: tc.id, title: tc.employeeId })),
    interactions: depth.interactions.filter((i) => !isExcludedRecord({ id: i.id, title: i.subject ?? i.body })),
    dumpSites: depth.dumpSites,
    maintenanceLogs: depth.maintenanceLogs.filter((l) => !isExcludedRecord({ id: l.id })),
  };
}

export function filterTrailers<T extends { id: string; name?: string }>(trailers: T[]): T[] {
  if (!isFilteringActive()) return trailers;
  return trailers.filter((t) => !isExcludedTruck(t));
}

export function filterActivityLog(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  if (!isFilteringActive()) return rows;
  return rows.filter((r) => !isExcludedActivity(r));
}

export function filterScheduleSlots(slots: ScheduleSlot[]): ScheduleSlot[] {
  if (!isFilteringActive()) return slots;
  return slots.filter((s) => !isExcludedRecord({ id: s.id, title: s.windowLabel }));
}

export function countExcluded<T>(
  all: T[],
  isExcluded: (item: T) => boolean
): { kept: number; excluded: number } {
  const excluded = all.filter(isExcluded).length;
  return { kept: all.length - excluded, excluded };
}
