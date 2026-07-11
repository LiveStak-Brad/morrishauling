"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { useCompany } from "@/lib/company-context";
import { isDemoDataEnabled } from "@/lib/is-demo-data";
import type { Job } from "@/types/job";
import type { OperationsCommandCenterData } from "@/types/operations-command-center";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import {
  CapacityBar,
  CommandCenterKpiGrid,
  DispatchJobDrawer,
  EmployeeOpsCard,
  FleetTruckCard,
  OpsStatusTile,
  QuickActionsPanel,
  TodayScheduleList,
} from "@/components/admin/command-center/CommandCenterWidgets";
import {
  CrmQuickList,
  CustomerCrmDrawer,
  DispatchTimelinePanel,
  FinancialCommandPanel,
  LiveOpsTicker,
  PrioritizedAlertsPanel,
  TruckRouteMapPanel,
} from "@/components/admin/command-center/LiveCommandCenterPanels";
import type { CustomerCrmProfile } from "@/types/operations-command-center";
import { MiniBarChart } from "@/components/morris/Charts";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DollarSign,
  Briefcase,
  TrendingUp,
  FileText,
  CalendarClock,
  ClipboardCheck,
  Truck,
  Users,
  AlertTriangle,
  Loader2,
  Plus,
  Radio,
  CreditCard,
  Receipt,
  UserPlus,
  Route,
} from "lucide-react";

function fmtMoney(n: number | null | undefined, fallback = "$0"): string {
  if (n == null || Number.isNaN(n)) return fallback;
  return `$${n.toLocaleString()}`;
}

const KPI_CONFIG = [
  { key: "revenueToday" as const, label: "Revenue today", icon: DollarSign, tone: "money" as const, emptyMessage: "No payments collected yet", hero: true },
  { key: "jobsScheduledToday" as const, label: "Jobs scheduled", icon: Briefcase, tone: "count" as const, emptyMessage: "No jobs scheduled yet" },
  { key: "jobsAwaitingReview" as const, label: "Legacy field reviews", icon: ClipboardCheck, tone: "count" as const, emptyMessage: "No legacy reviews" },
  { key: "outstandingReceivables" as const, label: "Outstanding", icon: FileText, tone: "money" as const, emptyMessage: "All invoices paid" },
  { key: "todaysCapacityPct" as const, label: "Today's capacity", icon: CalendarClock, tone: "pct" as const, emptyMessage: "No schedule created yet" },
  { key: "revenueThisWeek" as const, label: "Revenue this week", icon: TrendingUp, tone: "money" as const, emptyMessage: "No payments this week" },
  { key: "projectedProfitToday" as const, label: "Projected profit", icon: TrendingUp, tone: "money" as const, emptyMessage: "No profit projected today", hideWhenEmpty: true },
  { key: "averageTicket" as const, label: "Average ticket", icon: DollarSign, tone: "money" as const, emptyMessage: "No completed payments yet", hideWhenEmpty: true },
];

const PRIMARY_ACTIONS = [
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/estimates", label: "Estimates", icon: ClipboardCheck },
  { href: "/admin/jobs", label: "Jobs", icon: Briefcase },
  { href: "/admin/invoices", label: "Invoices", icon: Receipt },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
];

const SECONDARY_ACTIONS = [
  { href: "/book", label: "New Booking", icon: Plus },
  { href: "/planner", label: "Dispatch", icon: Radio },
  { href: "/admin/estimates/new", label: "New Estimate", icon: FileText },
  { href: "/admin/hr/employees", label: "Employees", icon: Users },
  { href: "/admin/schedule", label: "Schedule", icon: Route },
  { href: "/admin/hr/applicants", label: "Applicants", icon: UserPlus },
];

const ACTIVITY_ICONS: Record<string, string> = {
  payment: "bg-emerald-500",
  booking: "bg-blue-500",
  review: "bg-amber-500",
  schedule: "bg-violet-500",
  invoice: "bg-orange-500",
  employee: "bg-slate-500",
  financing: "bg-purple-500",
  dispatch: "bg-brand-primary",
  other: "bg-gray-400",
};

async function loadCommandCenter(companyId: string): Promise<OperationsCommandCenterData | null> {
  try {
    const res = await fetch(`/api/admin/operations?companyId=${encodeURIComponent(companyId)}`);
    const json = await res.json();
    if (json.ok && json.data) return json.data as OperationsCommandCenterData;
  } catch {
    /* fallback below */
  }

  if (!isDemoDataEnabled()) return null;

  const { getJobs, getInvoices, getPayments, getFinancingRequests, getScheduleSlots, getCustomers } =
    await import("@/lib/mock-data");
  const { buildOperationsCommandCenter } = await import("@/lib/ops/command-center-metrics");
  const { morrisConfig } = await import("@/lib/morris-config");
  const { getMockOperationsDepthSnapshot } = await import("@/lib/mock-operations-depth");

  const today = format(new Date(), "yyyy-MM-dd");
  return buildOperationsCommandCenter({
    companyId,
    today,
    jobs: getJobs(companyId),
    invoices: getInvoices(companyId),
    payments: getPayments(companyId),
    financing: getFinancingRequests(companyId),
    scheduleSlots: getScheduleSlots(companyId, { fromDate: today, includeClosed: true }),
    activityLog: [],
    customers: getCustomers(companyId),
    company: morrisConfig,
    depth: getMockOperationsDepthSnapshot(companyId),
  });
}

type WorkflowQueues = {
  estimates: {
    toApprove: number;
    needsInternalApproval: number;
    waitingOnCustomer: number;
    finalAgreed: number;
    convertedToJob: number;
    completed: number;
  };
  jobs: {
    needsScheduling: number;
    scheduled: number;
    inProgress: number;
    awaitingProof: number;
    readyToInvoice: number;
    invoiced: number;
  };
  invoices: {
    draft: number;
    readyToSend: number;
    sentUnpaid: number;
    partiallyPaid: number;
    paid: number;
    overdue: number;
    void: number;
  };
};

export function OperationsCommandCenter() {
  const { company, companyId } = useCompany();
  const [data, setData] = useState<OperationsCommandCenterData | null>(null);
  const [queues, setQueues] = useState<WorkflowQueues | null>(null);
  const [loading, setLoading] = useState(true);
  const [activityFilter, setActivityFilter] = useState<string>("all");
  const [reviewKey] = useState(0);
  const [dispatchJob, setDispatchJob] = useState<Job | null>(null);
  const [crmProfile, setCrmProfile] = useState<CustomerCrmProfile | null>(null);

  const customers = useMemo(() => data?.customers ?? [], [data]);
  const invoices = useMemo(() => data?.invoices ?? [], [data]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [center, qRes] = await Promise.all([
        loadCommandCenter(companyId),
        fetch("/api/admin/workflow-queues").then((r) => r.json()).catch(() => null),
      ]);
      setData(center);
      if (qRes?.ok) {
        setQueues({
          estimates: qRes.estimates,
          jobs: qRes.jobs,
          invoices: qRes.invoices,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void refresh();
  }, [refresh, reviewKey]);

  const filteredActivity = useMemo(() => {
    if (!data) return [];
    if (activityFilter === "all") return data.activity;
    return data.activity.filter((a) => a.category === activityFilter);
  }, [data, activityFilter]);

  const dispatchCustomer = dispatchJob
    ? customers.find((c) => c.id === dispatchJob.customerId) ?? null
    : null;
  const dispatchInvoice = dispatchJob
    ? invoices.find((i) => i.jobId === dispatchJob.id) ?? null
    : null;

  const getEmployeeName = useCallback(
    (id: string) => data?.employees.find((e) => e.employeeId === id)?.name ?? id,
    [data]
  );

  if (loading && !data) {
    return (
      <AdminPageShell title="Operations Command Center" description={`${company.companyName} · loading…`}>
        <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          Loading operational data…
        </div>
      </AdminPageShell>
    );
  }

  if (!data) {
    return (
      <AdminPageShell title="Operations Command Center" description={company.companyName}>
        <p className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground">
          No data yet — bookings and payments will appear here as your operation grows.
        </p>
      </AdminPageShell>
    );
  }

  const { kpis, todayOps, scheduleOverview, revenuePanel, financial, fleet, employees, liveUpdates, truckRoutes, dispatchTimeline, todayScheduleJobs, reviewQueue, prioritizedAlerts, crmProfiles, activity } =
    data;

  const primaryRoute = truckRoutes.find((r) => r.stops.length > 0);

  return (
    <AdminPageShell
      title="Operations Command Center"
      description={`${company.companyName} · Real-time dispatch & revenue`}
      action={
        <Button variant="outline" size="sm" className="rounded-xl" onClick={() => void refresh()}>
          Refresh
        </Button>
      }
    >
      <CommandCenterKpiGrid kpis={kpis} configs={KPI_CONFIG} />

      {queues && (
        <div className="mb-6 grid gap-4 lg:grid-cols-3">
          <PremiumCard className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold">Estimates</h3>
              <Link href="/admin/estimates" className="text-sm text-brand-primary hover:underline">
                Open
              </Link>
            </div>
            <ul className="space-y-1.5 text-sm">
              <li className="flex justify-between"><span>Needs Approval</span><span className="font-semibold">{queues.estimates.toApprove}</span></li>
              <li className="flex justify-between text-muted-foreground"><span>Internal</span><span>{queues.estimates.needsInternalApproval}</span></li>
              <li className="flex justify-between text-muted-foreground"><span>Waiting on Customer</span><span>{queues.estimates.waitingOnCustomer}</span></li>
              <li className="flex justify-between"><span>Agreed</span><span className="font-semibold">{queues.estimates.finalAgreed}</span></li>
              <li className="flex justify-between text-muted-foreground"><span>Completed</span><span>{queues.estimates.completed}</span></li>
            </ul>
          </PremiumCard>
          <PremiumCard className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold">Jobs</h3>
              <Link href="/admin/jobs" className="text-sm text-brand-primary hover:underline">
                Open
              </Link>
            </div>
            <ul className="space-y-1.5 text-sm">
              <li className="flex justify-between"><span>Needs Scheduling</span><span className="font-semibold">{queues.jobs.needsScheduling}</span></li>
              <li className="flex justify-between"><span>Missing Assignment</span><span className="font-semibold">{(queues.jobs as { missingAssignments?: number }).missingAssignments ?? 0}</span></li>
              <li className="flex justify-between"><span>Scheduled</span><span className="font-semibold">{queues.jobs.scheduled}</span></li>
              <li className="flex justify-between"><span>In Progress</span><span className="font-semibold">{queues.jobs.inProgress}</span></li>
              <li className="flex justify-between"><span>Awaiting Proof</span><span className="font-semibold">{queues.jobs.awaitingProof}</span></li>
              <li className="flex justify-between"><span>Ready to Invoice</span><span className="font-semibold">{queues.jobs.readyToInvoice}</span></li>
              <li className="flex justify-between text-muted-foreground"><span>Invoiced</span><span>{queues.jobs.invoiced}</span></li>
            </ul>
          </PremiumCard>
          <PremiumCard className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold">Invoices</h3>
              <Link href="/admin/invoices" className="text-sm text-brand-primary hover:underline">
                Open
              </Link>
            </div>
            <ul className="space-y-1.5 text-sm">
              <li className="flex justify-between"><span>Draft</span><span className="font-semibold">{queues.invoices.draft}</span></li>
              <li className="flex justify-between"><span>Ready to send</span><span className="font-semibold">{queues.invoices.readyToSend}</span></li>
              <li className="flex justify-between"><span>Sent / unpaid</span><span className="font-semibold">{queues.invoices.sentUnpaid}</span></li>
              <li className="flex justify-between"><span>Partially paid</span><span className="font-semibold">{queues.invoices.partiallyPaid}</span></li>
              <li className="flex justify-between"><span>Paid</span><span className="font-semibold">{queues.invoices.paid}</span></li>
              <li className="flex justify-between"><span>Overdue</span><span className="font-semibold">{queues.invoices.overdue}</span></li>
              <li className="flex justify-between text-muted-foreground"><span>Void</span><span>{queues.invoices.void}</span></li>
            </ul>
          </PremiumCard>
        </div>
      )}

      <LiveOpsTicker initial={liveUpdates} />

      <QuickActionsPanel primary={PRIMARY_ACTIONS} secondary={SECONDARY_ACTIONS} />

      {primaryRoute ? (
        <div className="mb-6">
          <TruckRouteMapPanel route={primaryRoute} />
        </div>
      ) : (
        <PremiumCard className="mb-6 p-5">
          <h3 className="font-bold">Dispatch route</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            No route planned yet. Assign jobs to a crew and create a route.
          </p>
          <Link href="/planner" className="mt-3 inline-block text-sm font-medium text-brand-primary hover:underline">
            Open dispatch planner
          </Link>
        </PremiumCard>
      )}

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <FinancialCommandPanel financial={financial} />
        <DispatchTimelinePanel events={dispatchTimeline} />
      </div>

      {/* Today's schedule + dispatch drawer */}
      <PremiumCard className="mb-6 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-bold">Today&apos;s schedule</h3>
          <Link href="/planner" className="text-sm font-medium text-brand-primary hover:underline">
            Open dispatch
          </Link>
        </div>
        <TodayScheduleList
          jobs={todayScheduleJobs}
          company={company}
          onSelect={setDispatchJob}
          getEmployeeName={getEmployeeName}
        />
      </PremiumCard>

      <DispatchJobDrawer
        job={dispatchJob}
        open={!!dispatchJob}
        onOpenChange={(open) => !open && setDispatchJob(null)}
        company={company}
        customer={dispatchCustomer}
        invoice={dispatchInvoice}
        getEmployeeName={getEmployeeName}
      />

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <PremiumCard className="p-5">
          <h3 className="mb-4 font-bold">Today&apos;s operations</h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <OpsStatusTile
              label="Jobs completed"
              value={todayOps.jobsCompletedToday}
              tone="success"
              hint="No completed jobs today"
            />
            <OpsStatusTile label="In progress" value={todayOps.jobsInProgress} tone="info" />
            <OpsStatusTile label="Awaiting review" value={todayOps.jobsAwaitingReview} tone="warning" />
            <OpsStatusTile label="Financing pending" value={todayOps.financingPending} tone="orange" />
            <OpsStatusTile label="Overdue invoices" value={todayOps.overdueInvoices} tone="urgent" />
            <OpsStatusTile label="Unassigned jobs" value={todayOps.unassignedJobs} tone="urgent" />
            <OpsStatusTile label="Crews assigned" value={todayOps.crewsAssigned} tone="neutral" />
            <OpsStatusTile label="Trucks in service" value={todayOps.trucksInService} tone="neutral" />
            <OpsStatusTile label="Late jobs" value={todayOps.lateJobs} tone={todayOps.lateJobs > 0 ? "urgent" : "neutral"} />
          </div>
        </PremiumCard>

        <PremiumCard className="p-5">
          <h3 className="mb-4 font-bold">Schedule overview</h3>
          <div className="space-y-3">
            <CapacityBar title="Morning" summary={scheduleOverview.morning} />
            <CapacityBar title="Afternoon" summary={scheduleOverview.afternoon} />
            <CapacityBar title="Flexible" summary={scheduleOverview.flexible} />
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="rounded-xl border bg-muted/30 p-3">
                <p className="text-xs font-medium text-muted-foreground">Crew utilization</p>
                <p className="mt-1 text-lg font-bold">
                  {scheduleOverview.crewUtilizationPct != null
                    ? `${scheduleOverview.crewUtilizationPct}%`
                    : "Not started"}
                </p>
              </div>
              <div className="rounded-xl border bg-muted/30 p-3">
                <p className="text-xs font-medium text-muted-foreground">Trailer utilization</p>
                <p className="mt-1 text-lg font-bold">
                  {scheduleOverview.trailerUtilizationPct != null
                    ? `${scheduleOverview.trailerUtilizationPct}%`
                    : "Not started"}
                </p>
              </div>
            </div>
            {scheduleOverview.capacityWarnings.length > 0 && (
              <ul className="space-y-1">
                {scheduleOverview.capacityWarnings.map((w) => (
                  <li key={w} className="flex items-start gap-2 text-xs text-amber-700">
                    <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                    {w}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </PremiumCard>
      </div>

      <PremiumCard className="mb-6 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-bold">Estimates needing action</h3>
          <Link href="/admin/estimates" className="text-sm font-medium text-brand-primary hover:underline">
            Open estimates
          </Link>
        </div>
        {queues ? (
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between">
              <span>Needs Approval</span>
              <Link href="/admin/estimates" className="font-semibold text-brand-primary">
                {queues.estimates.toApprove}
              </Link>
            </li>
            <li className="flex justify-between text-muted-foreground">
              <span>Waiting on Customer</span>
              <span>{queues.estimates.waitingOnCustomer}</span>
            </li>
            <li className="flex justify-between">
              <span>Agreed (ready for job work)</span>
              <span className="font-semibold">{queues.estimates.finalAgreed}</span>
            </li>
          </ul>
        ) : (
          <p className="text-sm text-amber-800">Could not load estimate queues. Refresh to retry.</p>
        )}
        {reviewQueue.length > 0 && (
          <p className="mt-4 text-xs text-muted-foreground">
            {reviewQueue.length} legacy field photo review(s) still open —{" "}
            <Link href="/admin/review" className="underline">
              view legacy queue
            </Link>
          </p>
        )}
      </PremiumCard>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <MiniBarChart data={revenuePanel.revenueByDay} title="Revenue by day (7d)" />
        <MiniBarChart data={revenuePanel.profitByDay} title="Profit by day (7d)" />
      </div>
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Payments collected", value: fmtMoney(revenuePanel.paymentsCollected, "No payments yet") },
          { label: "Outstanding balances", value: fmtMoney(revenuePanel.outstandingBalances) },
          { label: "Estimate approval value", value: fmtMoney(revenuePanel.estimateApprovalValue, "None pending") },
          { label: "Pending financing", value: fmtMoney(revenuePanel.pendingFinancingTotal) },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">{m.label}</p>
            <p className="mt-1 text-lg font-bold">{m.value}</p>
          </div>
        ))}
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <PremiumCard className="p-5">
          <h3 className="mb-4 flex items-center gap-2 font-bold">
            <Truck className="h-4 w-4" /> Fleet status
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {fleet.length === 0 ? (
              <p className="text-sm text-muted-foreground sm:col-span-2">
                No trucks registered yet.{" "}
                <Link href="/admin/fleet" className="font-medium text-brand-primary hover:underline">
                  Add fleet assets
                </Link>
              </p>
            ) : (
              fleet.map((t) => <FleetTruckCard key={t.truckId} truck={t} />)
            )}
          </div>
        </PremiumCard>

        <PremiumCard className="p-5">
          <h3 className="mb-4 flex items-center gap-2 font-bold">
            <Users className="h-4 w-4" /> Crew live
          </h3>
          <div className="space-y-3">
            {employees.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No active employees yet.{" "}
                <Link href="/admin/hr/employees/new" className="font-medium text-brand-primary hover:underline">
                  Create an employee
                </Link>
              </p>
            ) : (
              employees.map((e) => <EmployeeOpsCard key={e.employeeId} employee={e} />)
            )}
          </div>
        </PremiumCard>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <PremiumCard className="p-5 lg:col-span-2">
          <h3 className="mb-3 font-bold">Live activity</h3>
          <div className="mb-4 flex flex-wrap gap-1">
            {["all", "payment", "booking", "review", "schedule", "invoice", "employee", "financing", "dispatch"].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setActivityFilter(f)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium capitalize",
                  activityFilter === f ? "bg-brand-primary text-white" : "bg-muted text-muted-foreground"
                )}
              >
                {f}
              </button>
            ))}
          </div>
          {filteredActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No live activity yet. Activity will appear after real bookings, estimates, dispatch actions,
              payments, and employee updates.
            </p>
          ) : (
            <div className="max-h-80 space-y-3 overflow-y-auto">
              {filteredActivity.map((item) => (
                <div key={item.id} className="flex gap-3 border-b border-border/60 pb-3 last:border-0">
                  <div className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", item.isLive ? "animate-pulse bg-emerald-500" : ACTIVITY_ICONS[item.category] ?? ACTIVITY_ICONS.other)} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{item.message}</p>
                    <div className="mt-0.5 flex gap-2 text-xs text-muted-foreground">
                      <span>{item.time}</span>
                      {item.amount != null && (
                        <span className="font-semibold text-emerald-700">+{fmtMoney(item.amount)}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </PremiumCard>

        <PremiumCard className="p-5">
          <h3 className="mb-4 flex items-center gap-2 font-bold">
            <AlertTriangle className="h-4 w-4 text-amber-600" /> Alerts
          </h3>
          <PrioritizedAlertsPanel alerts={prioritizedAlerts} />
        </PremiumCard>
      </div>

      <CrmQuickList profiles={crmProfiles} onSelect={setCrmProfile} />
      <CustomerCrmDrawer profile={crmProfile} open={!!crmProfile} onOpenChange={(o) => !o && setCrmProfile(null)} />

      <PremiumCard className="p-5">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          Operations shortcuts
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { label: "Schedule", href: "/admin/schedule", icon: Briefcase },
            { label: "Jobs", href: "/admin/jobs", icon: FileText },
            { label: "Invoices", href: "/admin/invoices", icon: DollarSign },
            { label: "Fleet", href: "/admin/fleet", icon: TrendingUp },
            { label: "Divisions", href: "/admin/divisions", icon: AlertTriangle },
          ].map((w) => {
            const Icon = w.icon;
            return (
              <Link
                key={w.label}
                href={w.href}
                className="flex flex-col items-center gap-2 rounded-xl border border-black/5 bg-white p-4 text-center shadow-sm transition hover:border-brand-primary/25"
              >
                <Icon className="h-5 w-5 text-brand-primary" />
                <p className="text-xs font-medium">{w.label}</p>
              </Link>
            );
          })}
        </div>
      </PremiumCard>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Data as of {format(new Date(data.generatedAt), "MMM d, yyyy h:mm a")}
      </p>
    </AdminPageShell>
  );
}
