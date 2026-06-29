import type { FinancingRequest, Invoice, Job, Payment } from "@/types";
import type { Customer } from "@/types/user";
import type { OperationsDepthSnapshot } from "@/types/operations-depth";
import type { ScheduleSlot } from "@/types/schedule";
import {
  classifyRecordSource,
  filterActivityLog,
  filterCustomers,
  filterDepthSnapshot,
  filterFinancing,
  filterHrEmployees,
  filterInvoices,
  filterJobs,
  filterPayments,
  filterScheduleSlots,
  filterTrailers,
  getExclusionReason,
  isExcludedJob,
  isFilteringActive,
  type DataSourceKind,
  type ExclusionReason,
} from "@/lib/data/real-record-filter";
import { isDemoDataEnabled } from "@/lib/is-demo-data";

type SampleRow = {
  id: string;
  label: string;
  status?: string;
  amount?: number;
  source: DataSourceKind;
  excluded: boolean;
  exclusionReason?: ExclusionReason;
};

function sampleJobs(jobs: Job[], limit = 10): SampleRow[] {
  return jobs.slice(0, limit).map((j) => ({
    id: j.id,
    label: `${j.junkType ?? j.serviceType} — ${j.address.city}`,
    status: j.status,
    amount: j.estimate?.total,
    source: classifyRecordSource(j.id),
    excluded: isExcludedJob(j),
    exclusionReason: getExclusionReason({ id: j.id, title: j.junkType }) ?? undefined,
  }));
}

function sampleInvoices(invoices: Invoice[], limit = 10): SampleRow[] {
  return invoices.slice(0, limit).map((i) => ({
    id: i.id,
    label: i.id,
    status: i.status,
    amount: i.balanceDue,
    source: classifyRecordSource(i.id),
    excluded: getExclusionReason({ id: i.id }) !== null,
    exclusionReason: getExclusionReason({ id: i.id }) ?? undefined,
  }));
}

function samplePayments(payments: Payment[], limit = 10): SampleRow[] {
  return payments.slice(0, limit).map((p) => ({
    id: p.id,
    label: p.id,
    status: p.status,
    amount: p.amount,
    source: classifyRecordSource(p.id),
    excluded: getExclusionReason({ id: p.id }) !== null,
    exclusionReason: getExclusionReason({ id: p.id }) ?? undefined,
  }));
}

function sampleCustomers(customers: Customer[], limit = 10): SampleRow[] {
  return customers.slice(0, limit).map((c) => ({
    id: c.id,
    label: c.name,
    status: c.email,
    source: classifyRecordSource(c.id),
    excluded: getExclusionReason({ id: c.id, name: c.name, email: c.email }) !== null,
    exclusionReason: getExclusionReason({ id: c.id, name: c.name, email: c.email }) ?? undefined,
  }));
}

function sampleEmployees(
  employees: Array<{ id: string; firstName?: string; lastName?: string; email?: string }>,
  limit = 10
): SampleRow[] {
  return employees.slice(0, limit).map((e) => {
    const name = `${e.firstName ?? ""} ${e.lastName ?? ""}`.trim();
    return {
      id: e.id,
      label: name || e.id,
      status: e.email,
      source: classifyRecordSource(e.id),
      excluded: getExclusionReason({ id: e.id, name, email: e.email }) !== null,
      exclusionReason: getExclusionReason({ id: e.id, name, email: e.email }) ?? undefined,
    };
  });
}

export interface OperationsDebugReport {
  generatedAt: string;
  demoDataEnabled: boolean;
  filteringActive: boolean;
  summary: {
    jobs: { total: number; afterFilter: number; excluded: number };
    invoices: { total: number; afterFilter: number; excluded: number };
    payments: { total: number; afterFilter: number; excluded: number };
    customers: { total: number; afterFilter: number; excluded: number };
    employees: { total: number; afterFilter: number; excluded: number };
    trucks: { total: number; afterFilter: number; excluded: number };
    trailers: { total: number; afterFilter: number; excluded: number };
    activity: { total: number; afterFilter: number; excluded: number };
  };
  samples: {
    jobs: SampleRow[];
    invoices: SampleRow[];
    payments: SampleRow[];
    customers: SampleRow[];
    employees: SampleRow[];
    trucks: SampleRow[];
    trailers: SampleRow[];
    activity: SampleRow[];
  };
  origins: {
    hardcodedFinancialFallbacks: string[];
    seedDataInDatabase: string;
    notes: string[];
  };
}

export function buildOperationsDebugReport(input: {
  jobs: Job[];
  invoices: Invoice[];
  payments: Payment[];
  financing: FinancingRequest[];
  customers: Customer[];
  hrEmployees: Array<{ id: string; firstName: string; lastName: string; email?: string }>;
  depth: OperationsDepthSnapshot;
  trailers: Array<{ id: string; name: string }>;
  activityLog: Record<string, unknown>[];
}): OperationsDebugReport {
  const filteredJobs = filterJobs(input.jobs);
  const filteredInvoices = filterInvoices(input.invoices);
  const filteredPayments = filterPayments(input.payments);
  const filteredCustomers = filterCustomers(input.customers);
  const filteredEmployees = filterHrEmployees(input.hrEmployees);
  const filteredDepth = filterDepthSnapshot(input.depth);
  const filteredTrailers = filterTrailers(input.trailers);
  const filteredActivity = filterActivityLog(input.activityLog);

  const seedJobs = input.jobs.filter((j) => classifyRecordSource(j.id) === "seed-data");
  const seedPayments = input.payments.filter((p) => classifyRecordSource(p.id) === "seed-data");
  const seedInvoices = input.invoices.filter((i) => classifyRecordSource(i.id) === "seed-data");

  return {
    generatedAt: new Date().toISOString(),
    demoDataEnabled: isDemoDataEnabled(),
    filteringActive: isFilteringActive(),
    summary: {
      jobs: { total: input.jobs.length, afterFilter: filteredJobs.length, excluded: input.jobs.length - filteredJobs.length },
      invoices: { total: input.invoices.length, afterFilter: filteredInvoices.length, excluded: input.invoices.length - filteredInvoices.length },
      payments: { total: input.payments.length, afterFilter: filteredPayments.length, excluded: input.payments.length - filteredPayments.length },
      customers: { total: input.customers.length, afterFilter: filteredCustomers.length, excluded: input.customers.length - filteredCustomers.length },
      employees: { total: input.hrEmployees.length, afterFilter: filteredEmployees.length, excluded: input.hrEmployees.length - filteredEmployees.length },
      trucks: { total: input.depth.trucks.length, afterFilter: filteredDepth.trucks.length, excluded: input.depth.trucks.length - filteredDepth.trucks.length },
      trailers: { total: input.trailers.length, afterFilter: filteredTrailers.length, excluded: input.trailers.length - filteredTrailers.length },
      activity: { total: input.activityLog.length, afterFilter: filteredActivity.length, excluded: input.activityLog.length - filteredActivity.length },
    },
    samples: {
      jobs: sampleJobs(input.jobs),
      invoices: sampleInvoices(input.invoices),
      payments: samplePayments(input.payments),
      customers: sampleCustomers(input.customers),
      employees: sampleEmployees(input.hrEmployees),
      trucks: input.depth.trucks.slice(0, 10).map((t) => ({
        id: t.id,
        label: t.name,
        source: classifyRecordSource(t.id),
        excluded: getExclusionReason({ id: t.id, name: t.name }) !== null,
        exclusionReason: getExclusionReason({ id: t.id, name: t.name }) ?? undefined,
      })),
      trailers: input.trailers.slice(0, 10).map((t) => ({
        id: t.id,
        label: t.name,
        source: classifyRecordSource(t.id),
        excluded: getExclusionReason({ id: t.id, name: t.name }) !== null,
        exclusionReason: getExclusionReason({ id: t.id, name: t.name }) ?? undefined,
      })),
      activity: input.activityLog.slice(0, 10).map((r) => ({
        id: String(r.id ?? ""),
        label: String(r.message ?? r.action ?? ""),
        source: classifyRecordSource(String(r.id ?? "")),
        excluded: getExclusionReason({ id: String(r.id ?? ""), title: String(r.message ?? "") }) !== null,
        exclusionReason: getExclusionReason({ id: String(r.id ?? ""), title: String(r.message ?? "") }) ?? undefined,
      })),
    },
    origins: {
      hardcodedFinancialFallbacks: [
        "lib/ops/command-center-metrics.ts buildFinancial() — was defaulting revenueToday=62, payrollDue=2841, expectedRevenueWeek=8944, projectedProfitWeek=4231 from morrisConfig when no real payments",
      ],
      seedDataInDatabase:
        seedJobs.length > 0 || seedPayments.length > 0 || seedInvoices.length > 0
          ? `Supabase contains db-seed.mjs rows (job-m*, cust-m*, pay-m*, inv-m*, emp-m*). Found ${seedJobs.length} seed jobs, ${seedPayments.length} seed payments, ${seedInvoices.length} seed invoices.`
          : "No mock-id-prefix seed rows detected in current fetch.",
      notes: [
        "Fake employee names (Marcus Webb, Tyler Brooks, etc.) originate from scripts/db-seed.mjs and lib/morris-config.ts when seeded into Supabase or DEMO_DATA=true.",
        "Truck 1 route/map comes from buildTruckRouteTimelines() when seeded jobs have assignedTruckId=truck-m1.",
        "Apply real-record-filter before Mission Control metrics when DEMO_DATA is unset.",
      ],
    },
  };
}

export function applyRealRecordFilter<T extends {
  jobs: Job[];
  invoices: Invoice[];
  payments: Payment[];
  financing: FinancingRequest[];
  customers: Customer[];
  hrEmployees: Array<{ id: string; firstName: string; lastName: string; email?: string }>;
  depth: OperationsDepthSnapshot;
  trailers: Array<{ id: string; name: string }>;
  activityLog: Record<string, unknown>[];
  scheduleSlots?: ScheduleSlot[];
}>(input: T): T {
  if (!isFilteringActive()) return input;
  return {
    ...input,
    jobs: filterJobs(input.jobs),
    invoices: filterInvoices(input.invoices),
    payments: filterPayments(input.payments),
    financing: filterFinancing(input.financing),
    customers: filterCustomers(input.customers),
    hrEmployees: filterHrEmployees(input.hrEmployees),
    depth: filterDepthSnapshot(input.depth),
    trailers: filterTrailers(input.trailers),
    activityLog: filterActivityLog(input.activityLog),
    scheduleSlots: input.scheduleSlots ? filterScheduleSlots(input.scheduleSlots) : input.scheduleSlots,
  };
}
