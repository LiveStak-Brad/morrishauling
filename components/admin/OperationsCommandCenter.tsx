"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { useCompany } from "@/lib/company-context";
import { isDemoDataEnabled } from "@/lib/is-demo-data";
import type { Job } from "@/types/job";
import type { OperationsCommandCenterData } from "@/types/operations-command-center";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { EstimateReviewCard } from "@/components/admin/EstimateReviewCard";
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
  Cloud,
  Fuel,
  Map,
  Bell,
} from "lucide-react";

function fmtMoney(n: number | null | undefined, fallback = "$0"): string {
  if (n == null || Number.isNaN(n)) return fallback;
  return `$${n.toLocaleString()}`;
}

const KPI_CONFIG = [
  { key: "revenueToday" as const, label: "Revenue today", icon: DollarSign, tone: "money" as const, emptyMessage: "No payments collected yet", hero: true },
  { key: "jobsScheduledToday" as const, label: "Jobs scheduled", icon: Briefcase, tone: "count" as const, emptyMessage: "No jobs scheduled yet" },
  { key: "jobsAwaitingReview" as const, label: "Awaiting review", icon: ClipboardCheck, tone: "count" as const, emptyMessage: "No estimates waiting" },
  { key: "outstandingReceivables" as const, label: "Outstanding", icon: FileText, tone: "money" as const, emptyMessage: "All invoices paid" },
  { key: "todaysCapacityPct" as const, label: "Today's capacity", icon: CalendarClock, tone: "pct" as const, emptyMessage: "No schedule created yet" },
  { key: "revenueThisWeek" as const, label: "Revenue this week", icon: TrendingUp, tone: "money" as const, emptyMessage: "No payments this week" },
  { key: "projectedProfitToday" as const, label: "Projected profit", icon: TrendingUp, tone: "money" as const, emptyMessage: "No profit projected today", hideWhenEmpty: true },
  { key: "averageTicket" as const, label: "Average ticket", icon: DollarSign, tone: "money" as const, emptyMessage: "No completed payments yet", hideWhenEmpty: true },
];

const PRIMARY_ACTIONS = [
  { href: "/book", label: "New Booking", icon: Plus },
  { href: "/admin/review", label: "Review Estimates", icon: ClipboardCheck },
  { href: "/planner", label: "Dispatch", icon: Radio },
  { href: "/admin/payments", label: "Collect Payment", icon: CreditCard },
  { href: "/admin/invoices/new", label: "Create Invoice", icon: Receipt },
];

const SECONDARY_ACTIONS = [
  { href: "/admin/jobs", label: "View Jobs", icon: Briefcase },
  { href: "/admin/jobs", label: "Create Job", icon: Plus },
  { href: "/admin/hr/employees", label: "View Employees", icon: Users },
  { href: "/admin/customers", label: "View Customers", icon: Users },
  { href: "/admin/invoices", label: "View Invoices", icon: Receipt },
  { href: "/planner", label: "View Dispatch", icon: Route },
  { href: "/admin/hr/applicants", label: "Careers / Applicants", icon: UserPlus },
  { href: "/admin/schedule", label: "Schedule Route", icon: Route },
  { href: "/admin/hr/employees/new", label: "Create Employee", icon: UserPlus },
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

const COMING_SOON = [
  { label: "Weather", icon: Cloud },
  { label: "Fuel prices", icon: Fuel },
  { label: "Google Maps route optimization", icon: Map },
  { label: "Crew GPS", icon: Radio },
  { label: "Business notifications", icon: Bell },
];

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

export function OperationsCommandCenter() {
  const { company, companyId } = useCompany();
  const [data, setData] = useState<OperationsCommandCenterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activityFilter, setActivityFilter] = useState<string>("all");
  const [reviewKey, setReviewKey] = useState(0);
  const [dispatchJob, setDispatchJob] = useState<Job | null>(null);
  const [crmProfile, setCrmProfile] = useState<CustomerCrmProfile | null>(null);

  const customers = useMemo(() => data?.customers ?? [], [data]);
  const invoices = useMemo(() => data?.invoices ?? [], [data]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setData(await loadCommandCenter(companyId));
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
          <h3 className="font-bold">Review queue</h3>
          <Link href="/admin/review" className="text-sm font-medium text-brand-primary hover:underline">
            View all
          </Link>
        </div>
        {reviewQueue.length === 0 ? (
          <p className="text-sm text-muted-foreground">No jobs waiting for review.</p>
        ) : (
          <div className="space-y-6">
            {reviewQueue.slice(0, 3).map((job) => (
              <EstimateReviewCard key={job.id} job={job} onUpdated={() => setReviewKey((k) => k + 1)} />
            ))}
          </div>
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
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">Coming soon</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {COMING_SOON.map((w) => {
            const Icon = w.icon;
            return (
              <div
                key={w.label}
                className="flex flex-col items-center gap-2 rounded-xl border border-dashed bg-muted/20 p-4 text-center"
              >
                <Icon className="h-5 w-5 text-muted-foreground" />
                <p className="text-xs font-medium text-muted-foreground">{w.label}</p>
              </div>
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
