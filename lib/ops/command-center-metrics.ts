import {
  addDays,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
  subHours,
  isBefore,
} from "date-fns";
import type { CompanyConfig } from "@/types";
import type { Customer } from "@/types/user";
import type { OperationsDepthSnapshot } from "@/types/operations-depth";
import type { FinancingRequest, Invoice, Job, Payment } from "@/types";
import type { ScheduleSlot } from "@/types/schedule";
import type {
  ActivityFeedItem,
  CommandCenterKpis,
  DispatchTimelineEvent,
  EmployeeStatusRow,
  FinancialCommand,
  FleetTruckStatus,
  OperationsCommandCenterData,
  OpsAlert,
  PrioritizedAlerts,
  RevenuePanel,
  ScheduleOverview,
  ScheduleWindowSummary,
  TodayOps,
} from "@/types/operations-command-center";
import { buildCustomerCrmProfiles } from "@/lib/ops/customer-crm";
import { disposalAlertsFromJobs } from "@/lib/disposal/disposal-alerts";
import {
  resolveEmployeeRoster,
  findEmployeeInRoster,
  employeeDisplayName,
  avatarForEmployee,
  type EmployeeRosterEntry,
} from "@/lib/hr/employee-roster";
import { isDemoDataEnabled } from "@/lib/is-demo-data";
import { filterActivityFeedItems } from "@/lib/data/real-record-filter";
import {
  buildLiveCrewUpdates,
  buildTruckRouteTimelines,
  getEmployeeLiveState,
  getMarcusLivePhase,
} from "@/lib/ops/live-dispatch";

function rosterFor(input: CommandCenterInput): EmployeeRosterEntry[] {
  return resolveEmployeeRoster(input.hrEmployees, input.company.employees);
}

function avatarUrlFor(roster: EmployeeRosterEntry[], employeeId: string): string {
  const emp = findEmployeeInRoster(roster, employeeId);
  return emp?.avatarUrl ?? avatarForEmployee(emp?.name ?? employeeId, employeeId);
}

export interface CommandCenterInput {
  companyId: string;
  today: string;
  jobs: Job[];
  invoices: Invoice[];
  payments: Payment[];
  financing: FinancingRequest[];
  scheduleSlots: ScheduleSlot[];
  activityLog: Record<string, unknown>[];
  customers: Customer[];
  company: CompanyConfig;
  depth?: OperationsDepthSnapshot;
  trailers?: Array<{ id: string; name: string }>;
  hrEmployees?: Array<{ id: string; name: string; firstName: string; lastName: string }>;
}

function dateKey(iso: string): string {
  try {
    return format(parseISO(iso), "yyyy-MM-dd");
  } catch {
    return iso.slice(0, 10);
  }
}

function completedPayments(payments: Payment[]): Payment[] {
  return payments.filter((p) => p.status === "completed");
}

function sumPayments(payments: Payment[]): number {
  return payments.reduce((s, p) => s + p.amount, 0);
}

function paymentsInRange(payments: Payment[], from: Date, to: Date): Payment[] {
  return completedPayments(payments).filter((p) => {
    const d = parseISO(p.createdAt);
    return !isBefore(d, from) && isBefore(d, to);
  });
}

function windowKind(label: string): "morning" | "afternoon" | "flexible" | "other" {
  const lower = label.toLowerCase();
  if (lower.includes("flexible")) return "flexible";
  if (lower.includes("afternoon")) return "afternoon";
  if (lower.includes("morning")) return "morning";
  return "other";
}

function summarizeWindow(slots: ScheduleSlot[], kind: "morning" | "afternoon" | "flexible", today: string): ScheduleWindowSummary {
  const filtered = slots.filter(
    (s) => s.slotDate === today && windowKind(s.windowLabel) === kind
  );
  const booked = filtered.reduce((s, x) => s + x.currentJobs, 0);
  const max = filtered.reduce((s, x) => s + x.maxJobs, 0);
  return {
    label: kind === "flexible" ? "Flexible" : kind.charAt(0).toUpperCase() + kind.slice(1),
    booked,
    max,
    remaining: Math.max(0, max - booked),
    slots: filtered.map((s) => ({
      id: s.id,
      date: s.slotDate,
      booked: s.currentJobs,
      max: s.maxJobs,
      status: s.status,
    })),
  };
}

function jobDisplayLabel(job: Job): string {
  const type = job.junkType?.replace(/_/g, " ") ?? job.serviceType.replace(/_/g, " ");
  const title = type.charAt(0).toUpperCase() + type.slice(1);
  if (job.address.street) return `${title} — ${job.address.street}`;
  return `${title} — ${job.address.city}`;
}

function maintenanceLabel(status: "good" | "due_soon" | "overdue" | "out_of_service"): string {
  switch (status) {
    case "overdue":
      return "Overdue";
    case "due_soon":
      return "Due soon";
    case "out_of_service":
      return "Out of service";
    default:
      return "Good";
  }
}

function jobProfit(job: Job): number | null {
  const p = job.junkRemovalDetails?.estimatedProfit ?? job.haulingDetails?.estimatedProfit;
  return p != null ? p : null;
}

function jobMargin(job: Job): number | null {
  const m = job.junkRemovalDetails?.estimatedMargin ?? job.haulingDetails?.estimatedMargin;
  return m != null ? m : null;
}

function isReviewJob(job: Job): boolean {
  return (
    job.serviceType === "junk_removal" &&
    (job.junkRemovalDetails?.reviewRequired === true ||
      job.junkRemovalDetails?.reviewStatus === "needs_review" ||
      job.reviewStatus === "needs_review")
  );
}

function buildActivity(input: CommandCenterInput): ActivityFeedItem[] {
  let items: ActivityFeedItem[];

  if (input.activityLog.length > 0) {
    items = mapActivityLog(input.activityLog);
  } else if (isDemoDataEnabled()) {
    items = synthesizeActivity(input);
  } else {
    items = [];
  }

  return filterActivityFeedItems(items);
}

function synthesizeActivity(input: CommandCenterInput): ActivityFeedItem[] {
  const roster = rosterFor(input);
  const items: ActivityFeedItem[] = [];

  for (const p of completedPayments(input.payments).slice(0, 20)) {
    const job = input.jobs.find((j) => j.id === p.jobId);
    items.push({
      id: `pay-${p.id}`,
      category: "payment",
      message: `Payment received${job ? ` — ${job.address.city}` : ""}`,
      time: formatRelative(p.createdAt),
      amount: p.amount,
      createdAt: p.createdAt,
    });
  }

  for (const j of [...input.jobs].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 15)) {
    items.push({
      id: `job-${j.id}`,
      category: "booking",
      message: `Job ${j.status.replace(/_/g, " ")} — ${j.address.street}, ${j.address.city}`,
      time: formatRelative(j.createdAt),
      amount: j.estimate?.total,
      createdAt: j.createdAt,
    });
  }

  for (const f of input.financing.filter((x) => x.status === "pending").slice(0, 5)) {
    items.push({
      id: `fin-${f.id}`,
      category: "financing",
      message: `Financing request pending`,
      time: formatRelative(f.createdAt),
      amount: f.totalAmount,
      createdAt: f.createdAt,
    });
  }

  if (isDemoDataEnabled()) {
    const live = getMarcusLivePhase();
    const leadName = roster[0]?.name ?? "Crew";
    items.push({
      id: "live-dispatch-now",
      category: "dispatch",
      message: `${leadName} — ${live.headline}`,
      time: "Just now",
      createdAt: new Date().toISOString(),
      isLive: true,
    });
  }

  const clocked = input.depth?.timeclock.filter((t) => t.shiftDate === input.today && t.shiftStatus === "clocked_in") ?? [];
  for (const tc of clocked.slice(0, 3)) {
    const name = employeeDisplayName(roster, tc.employeeId);
    items.push({
      id: `clock-${tc.id}`,
      category: "employee",
      message: `${name} clocked in`,
      time: formatRelative(tc.clockInAt),
      createdAt: tc.clockInAt,
    });
  }

  return items
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 50);
}

function formatRelative(iso: string): string {
  const d = parseISO(iso);
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return format(d, "MMM d, h:mm a");
}

function mapActivityLog(rows: Record<string, unknown>[]): ActivityFeedItem[] {
  return rows.map((row) => {
    const entityType = String(row.entity_type ?? "other");
    const category = activityCategory(entityType, String(row.action ?? ""));
    return {
      id: String(row.id),
      category,
      message: String(row.message ?? ""),
      time: formatRelative(String(row.created_at)),
      amount:
        row.metadata && typeof row.metadata === "object" && "amount" in (row.metadata as object)
          ? Number((row.metadata as { amount: number }).amount)
          : undefined,
      createdAt: String(row.created_at),
    };
  });
}

function activityCategory(entityType: string, action: string): ActivityFeedItem["category"] {
  if (entityType === "payment") return "payment";
  if (entityType === "job" && action === "created") return "booking";
  if (entityType === "job" || entityType === "estimate") return "review";
  if (entityType === "schedule_slot" || entityType === "schedule") return "schedule";
  if (entityType === "invoice") return "invoice";
  if (entityType === "employee") return "employee";
  if (entityType === "financing") return "financing";
  if (entityType === "truck" || action.includes("clocked") || action.includes("departed")) return "dispatch";
  return "other";
}

function buildKpis(input: CommandCenterInput): CommandCenterKpis {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);
  const weekEnd = addDays(weekStart, 7);

  const paidToday = paymentsInRange(input.payments, startOfDay(now), addDays(startOfDay(now), 1));
  const paidWeek = paymentsInRange(input.payments, weekStart, weekEnd);
  const paidMonth = completedPayments(input.payments).filter((p) => {
    const d = parseISO(p.createdAt);
    return !isBefore(d, monthStart);
  });

  const todayJobs = input.jobs.filter((j) => j.scheduledDate === input.today);
  const weekJobs = input.jobs.filter((j) => {
    if (!j.scheduledDate) return false;
    const d = parseISO(`${j.scheduledDate}T12:00:00`);
    return !isBefore(d, weekStart) && isBefore(d, weekEnd);
  });

  const todaySlots = input.scheduleSlots.filter((s) => s.slotDate === input.today);
  const slotBooked = todaySlots.reduce((s, x) => s + x.currentJobs, 0);
  const slotMax = todaySlots.reduce((s, x) => s + x.maxJobs, 0);

  const completedWithPayment = completedPayments(input.payments);
  const avgTicket =
    completedWithPayment.length > 0
      ? Math.round(sumPayments(completedWithPayment) / completedWithPayment.length)
      : null;

  const projectedWeekly = weekJobs
    .filter((j) => !["cancelled", "draft"].includes(j.status))
    .reduce((s, j) => s + (j.estimate?.total ?? 0), 0);

  const projectedProfitToday = todayJobs
    .filter((j) => ["scheduled", "in_progress", "estimated"].includes(j.status))
    .reduce((s, j) => s + (jobProfit(j) ?? 0), 0);

  return {
    revenueToday: paidToday.length ? sumPayments(paidToday) : null,
    revenueThisWeek: paidWeek.length ? sumPayments(paidWeek) : null,
    revenueThisMonth: paidMonth.length ? sumPayments(paidMonth) : null,
    projectedProfitToday: projectedProfitToday > 0 ? Math.round(projectedProfitToday) : null,
    outstandingReceivables: input.invoices.reduce((s, i) => s + i.balanceDue, 0),
    jobsScheduledToday: todayJobs.filter((j) => !["cancelled", "draft"].includes(j.status)).length,
    jobsAwaitingReview: input.jobs.filter(isReviewJob).length,
    todaysCapacityPct: slotMax > 0 ? Math.round((slotBooked / slotMax) * 100) : null,
    todaysCapacityLabel: slotMax > 0 ? `${slotBooked}/${slotMax} booked` : "No slots today",
    averageTicket: avgTicket,
    projectedWeeklyRevenue: projectedWeekly > 0 ? projectedWeekly : null,
  };
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function buildTodayOps(input: CommandCenterInput): TodayOps {
  const todayJobs = input.jobs.filter((j) => j.scheduledDate === input.today);
  const crewIds = new Set<string>();
  todayJobs.forEach((j) => j.assignedEmployeeIds?.forEach((id) => crewIds.add(id)));

  const trucksUsed = new Set(
    todayJobs.filter((j) => ["scheduled", "in_progress"].includes(j.status)).map((j) => j.assignedTruckId).filter(Boolean)
  );
  const trailersUsed = new Set(
    todayJobs.filter((j) => ["scheduled", "in_progress"].includes(j.status)).map((j) => j.assignedTrailerId).filter(Boolean)
  );

  const overdueInvoices = input.invoices.filter(
    (i) =>
      i.balanceDue > 0 &&
      (i.status === "overdue" || (i.dueDate && i.dueDate < input.today))
  ).length;

  return {
    morning: summarizeWindow(input.scheduleSlots, "morning", input.today),
    afternoon: summarizeWindow(input.scheduleSlots, "afternoon", input.today),
    flexible: summarizeWindow(input.scheduleSlots, "flexible", input.today),
    crewsAssigned: crewIds.size,
    trucksInService: trucksUsed.size,
    trailersInUse: trailersUsed.size,
    jobsInProgress: input.jobs.filter((j) => j.status === "in_progress").length,
    jobsCompletedToday: input.jobs.filter(
      (j) => j.status === "completed" && dateKey(j.updatedAt) === input.today
    ).length,
    jobsAwaitingReview: input.jobs.filter(isReviewJob).length,
    unassignedJobs: todayJobs.filter(
      (j) =>
        !["cancelled", "completed", "draft"].includes(j.status) &&
        (!j.assignedEmployeeIds || j.assignedEmployeeIds.length === 0)
    ).length,
    lateJobs: input.jobs.filter(
      (j) =>
        j.scheduledDate &&
        j.scheduledDate < input.today &&
        !["completed", "cancelled"].includes(j.status)
    ).length,
    overdueInvoices,
    financingPending: input.financing.filter((f) => f.status === "pending").length,
  };
}

function buildScheduleOverview(input: CommandCenterInput): ScheduleOverview {
  const morning = summarizeWindow(input.scheduleSlots, "morning", input.today);
  const afternoon = summarizeWindow(input.scheduleSlots, "afternoon", input.today);
  const flexible = summarizeWindow(input.scheduleSlots, "flexible", input.today);

  const todayJobs = input.jobs.filter((j) => j.scheduledDate === input.today);
  const assignedEmployees = new Set<string>();
  todayJobs.forEach((j) => j.assignedEmployeeIds?.forEach((id) => assignedEmployees.add(id)));

  const roster = rosterFor(input);
  const totalEmployees = roster.length;
  const crewUtil =
    totalEmployees > 0 ? Math.round((assignedEmployees.size / totalEmployees) * 100) : null;

  const trailersTotal = isDemoDataEnabled()
    ? input.company.trailers.length
    : (input.trailers?.length ?? 0);
  const trailersUsed = new Set(
    todayJobs.map((j) => j.assignedTrailerId).filter(Boolean)
  ).size;
  const trailerUtil =
    trailersTotal > 0 ? Math.round((trailersUsed / trailersTotal) * 100) : null;

  const warnings: string[] = [];
  for (const s of input.scheduleSlots.filter((x) => x.slotDate === input.today)) {
    const pct = s.maxJobs > 0 ? s.currentJobs / s.maxJobs : 0;
    if (pct >= 0.9 && s.status !== "full") {
      warnings.push(`${s.windowLabel} (${s.slotDate}) is ${Math.round(pct * 100)}% booked`);
    }
    if (s.status === "full") {
      warnings.push(`${s.windowLabel} (${s.slotDate}) is full`);
    }
  }

  return { morning, afternoon, flexible, crewUtilizationPct: crewUtil, trailerUtilizationPct: trailerUtil, capacityWarnings: warnings };
}

function buildRevenuePanel(input: CommandCenterInput): RevenuePanel {
  const now = new Date();
  const revenueByDay: { label: string; value: number }[] = [];
  const profitByDay: { label: string; value: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const day = addDays(startOfDay(now), -i);
    const key = format(day, "yyyy-MM-dd");
    const label = format(day, "EEE");
    const dayPayments = completedPayments(input.payments).filter((p) => dateKey(p.createdAt) === key);
    revenueByDay.push({ label, value: sumPayments(dayPayments) });

    const dayProfit = input.jobs
      .filter((j) => j.status === "completed" && dateKey(j.updatedAt) === key)
      .reduce((s, j) => s + (jobProfit(j) ?? 0), 0);
    profitByDay.push({ label, value: Math.round(dayProfit) });
  }

  const approvalValue = input.jobs
    .filter(isReviewJob)
    .reduce((s, j) => s + (j.estimate?.total ?? 0), 0);

  const pendingFinTotal = input.financing
    .filter((f) => f.status === "pending")
    .reduce((s, f) => s + f.totalAmount, 0);

  const collected = completedPayments(input.payments);
  return {
    revenueByDay,
    profitByDay,
    paymentsCollected: collected.length ? sumPayments(collected) : null,
    outstandingBalances: input.invoices.reduce((s, i) => s + i.balanceDue, 0),
    estimateApprovalValue: approvalValue > 0 ? approvalValue : null,
    pendingFinancingTotal: pendingFinTotal,
  };
}

function fleetTruckList(input: CommandCenterInput): Array<{ id: string; name: string }> {
  if (isDemoDataEnabled()) {
    return input.company.trucks.map((t) => ({ id: t.id, name: t.name }));
  }
  return (input.depth?.trucks ?? []).map((t) => ({ id: t.id, name: t.name }));
}

function trailerName(input: CommandCenterInput, trailerId: string | null | undefined): string | null {
  if (!trailerId) return null;
  if (isDemoDataEnabled()) {
    return input.company.trailers.find((t) => t.id === trailerId)?.name ?? trailerId;
  }
  return input.trailers?.find((t) => t.id === trailerId)?.name ?? trailerId;
}

function buildFleet(input: CommandCenterInput): FleetTruckStatus[] {
  const roster = rosterFor(input);
  return fleetTruckList(input).map((truck) => {
    const activeJob = input.jobs.find(
      (j) => j.assignedTruckId === truck.id && j.status === "in_progress"
    );
    const nextJob = input.jobs
      .filter(
        (j) =>
          j.assignedTruckId === truck.id &&
          j.scheduledDate &&
          j.scheduledDate >= input.today &&
          !["completed", "cancelled"].includes(j.status)
      )
      .sort((a, b) => (a.routeOrder ?? 99) - (b.routeOrder ?? 99))[0];

    const scheduledToday = input.jobs.filter(
      (j) => j.assignedTruckId === truck.id && j.scheduledDate === input.today
    );
    const crewIds = new Set<string>();
    scheduledToday.forEach((j) => j.assignedEmployeeIds?.forEach((id) => crewIds.add(id)));
    const crewNames = [...crewIds].map((id) => employeeDisplayName(roster, id));
    const crewAvatars = [...crewIds].map((id) => {
      const e = findEmployeeInRoster(roster, id);
      return { name: e?.name ?? id, avatarUrl: avatarUrlFor(roster, id) };
    });

    const truckJobIds = new Set(scheduledToday.map((j) => j.id));
    const todayRevenue = completedPayments(input.payments)
      .filter((p) => p.jobId && truckJobIds.has(p.jobId) && dateKey(p.createdAt) === input.today)
      .reduce((s, p) => s + p.amount, 0);

    const live = isDemoDataEnabled() && truck.id === "truck-m1" ? getMarcusLivePhase() : null;
    const fuelLevelPct =
      isDemoDataEnabled() && truck.id === "truck-m1" && live && !["available", "clocked_in"].includes(live.phase)
        ? 82
        : null;

    const fuelEst = activeJob?.junkRemovalDetails?.fuelAdjustment ?? activeJob?.haulingDetails?.estimatedFuelCost ?? null;
    const truckOps = input.depth?.trucks.find((t) => t.id === truck.id);
    const maintStatus = truckOps?.maintenanceStatus ?? "good";
    const maintenanceWarning =
      truckOps?.maintenanceStatus === "overdue"
        ? `Maintenance overdue${truckOps.nextServiceDueAt ? ` — due ${truckOps.nextServiceDueAt}` : ""}`
        : truckOps?.maintenanceStatus === "due_soon"
          ? `Service due soon${truckOps.nextServiceDueAt ? ` — ${truckOps.nextServiceDueAt}` : ""}`
          : truckOps?.maintenanceStatus === "out_of_service"
            ? "Out of service"
            : null;

    const driverName = crewNames[0] ?? null;
    const activeLabel = activeJob ? jobDisplayLabel(activeJob) : null;
    const nextLabel = nextJob ? jobDisplayLabel(nextJob) : null;

    return {
      truckId: truck.id,
      truckName: truck.name,
      assignedCrew: crewNames,
      crewAvatars,
      driverName,
      currentJob: activeJob
        ? `${activeJob.address.street}, ${activeJob.address.city}`
        : null,
      currentJobLabel: activeLabel,
      fuelLevelPct,
      fuelEstimate: fuelEst,
      trailerAttached: trailerName(input, activeJob?.assignedTrailerId ?? nextJob?.assignedTrailerId),
      nextScheduledStop: nextJob
        ? `${nextJob.address.street}, ${nextJob.address.city}`
        : null,
      nextStopLabel: nextLabel,
      nextStopEta: nextJob?.scheduledWindowLabel ?? null,
      maintenanceWarning,
      maintenanceStatus: maintStatus,
      maintenanceLabel: maintenanceLabel(maintStatus),
      todayRevenue,
      todayStops: scheduledToday.length,
      livePhase: live?.phase ?? null,
      liveMessage: live ? `${live.headline} — ${live.detail}` : null,
    };
  });
}

function buildEmployees(input: CommandCenterInput): EmployeeStatusRow[] {
  const roster = rosterFor(input);
  const todayClock = input.depth?.timeclock.filter((t) => t.shiftDate === input.today) ?? [];
  const clockedInIds = new Set(
    todayClock.filter((t) => t.shiftStatus === "clocked_in" || t.shiftStatus === "on_break").map((t) => t.employeeId)
  );
  const onBreakIds = new Set(todayClock.filter((t) => t.shiftStatus === "on_break").map((t) => t.employeeId));

  return roster.map((emp) => {
    const activeJob = input.jobs.find(
      (j) =>
        j.assignedEmployeeIds?.includes(emp.id) &&
        j.status === "in_progress"
    );
    const todayAssigned = input.jobs.filter(
      (j) =>
        j.assignedEmployeeIds?.includes(emp.id) &&
        j.scheduledDate === input.today
    );
    const completedToday = input.jobs.filter(
      (j) =>
        j.assignedEmployeeIds?.includes(emp.id) &&
        j.status === "completed" &&
        dateKey(j.updatedAt) === input.today
    );

    const jobPayments = completedToday
      .map((j) => completedPayments(input.payments).filter((p) => p.jobId === j.id))
      .flat();
    const revenueToday = jobPayments.length ? sumPayments(jobPayments) : null;

    const clockEntry = todayClock.find(
      (t) => t.employeeId === emp.id && (t.shiftStatus === "clocked_in" || t.shiftStatus === "on_break")
    );
    const hoursToday =
      clockEntry?.clockInAt != null
        ? Math.round(((clockEntry.clockOutAt ? parseISO(clockEntry.clockOutAt) : new Date()).getTime() - parseISO(clockEntry.clockInAt).getTime()) / 360000) / 10
        : null;

    let clockStatus: EmployeeStatusRow["clockStatus"] = "not_clocked";
    if (onBreakIds.has(emp.id)) clockStatus = "on_break";
    else if (clockedInIds.has(emp.id)) clockStatus = "clocked_in";
    else if (todayClock.some((t) => t.employeeId === emp.id && t.shiftStatus === "clocked_out")) clockStatus = "clocked_out";
    else if (todayAssigned.length === 0 && !clockedInIds.has(emp.id)) clockStatus = "off";

    let status: EmployeeStatusRow["status"] = "unknown";
    let statusLabel = "Not clocked in";
    if (onBreakIds.has(emp.id)) {
      status = "available";
      statusLabel = "On break";
    } else if (activeJob) {
      status = "on_route";
      statusLabel = "On route";
    } else if (clockedInIds.has(emp.id)) {
      status = "assigned";
      statusLabel = "Clocked in";
    } else if (todayAssigned.length > 0) {
      status = "assigned";
      statusLabel = "Assigned today";
    } else if (!clockedInIds.has(emp.id) && todayClock.some((t) => t.employeeId === emp.id && t.shiftStatus === "no_show")) {
      status = "unknown";
      statusLabel = "Off today";
      clockStatus = "off";
    } else {
      status = "available";
      statusLabel = clockedInIds.size ? "Available" : "Not clocked in";
    }

    return {
      employeeId: emp.id,
      name: emp.name,
      avatarUrl: avatarUrlFor(roster, emp.id),
      status,
      statusLabel,
      clockStatus,
      clockedInAt: clockEntry?.clockInAt ?? null,
      hoursToday,
      currentAssignment: activeJob
        ? `${activeJob.address.city} — ${activeJob.scheduledWindowLabel ?? "In progress"}`
        : todayAssigned[0]
          ? `${todayAssigned[0].address.city} — ${todayAssigned[0].scheduledWindowLabel ?? "Scheduled"}`
          : null,
      currentJobLabel: activeJob
        ? jobDisplayLabel(activeJob)
        : todayAssigned[0]
          ? jobDisplayLabel(todayAssigned[0])
          : null,
      jobsToday: todayAssigned.length,
      jobsCompletedToday: completedToday.length,
      revenueProducedToday: revenueToday,
      livePhase: (() => {
        const ls = getEmployeeLiveState(emp.id, roster, input.jobs, input.today);
        return ls?.phase ?? null;
      })(),
      liveMessage: (() => {
        const ls = getEmployeeLiveState(emp.id, roster, input.jobs, input.today);
        return ls?.headline ?? null;
      })(),
      liveDetail: (() => {
        const ls = getEmployeeLiveState(emp.id, roster, input.jobs, input.today);
        return ls?.detail ?? null;
      })(),
      liveEtaMinutes: (() => {
        const ls = getEmployeeLiveState(emp.id, roster, input.jobs, input.today);
        return ls?.etaMinutes ?? null;
      })(),
      trailerLoadPct: (() => {
        const ls = getEmployeeLiveState(emp.id, roster, input.jobs, input.today);
        return ls?.trailerLoadPct ?? null;
      })(),
    };
  });
}

function buildAlerts(input: CommandCenterInput): OpsAlert[] {
  const alerts: OpsAlert[] = [];
  let n = 0;
  const add = (severity: OpsAlert["severity"], title: string, detail: string, href?: string) => {
    alerts.push({ id: `alert-${++n}`, severity, title, detail, href });
  };

  const todayJobs = input.jobs.filter((j) => j.scheduledDate === input.today);
  const unassigned = todayJobs.filter(
    (j) =>
      !["cancelled", "completed", "draft"].includes(j.status) &&
      (!j.assignedEmployeeIds || j.assignedEmployeeIds.length === 0)
  );
  if (unassigned.length) {
    add("urgent", "Jobs without crew", `${unassigned.length} job(s) scheduled today have no crew assigned`, "/admin/jobs");
  }

  const noPhotos = input.jobs.filter(
    (j) => isReviewJob(j) && j.photos.length === 0
  );
  if (noPhotos.length) {
    add("warning", "Jobs missing photos", `${noPhotos.length} review job(s) have no photos`, "/admin/review");
  }

  const noDisposal = input.jobs.filter(
    (j) =>
      j.serviceType === "junk_removal" &&
      !j.junkRemovalDetails?.selectedDisposalSiteId &&
      !["completed", "cancelled"].includes(j.status)
  );
  if (noDisposal.length) {
    add("warning", "Jobs missing disposal site", `${noDisposal.length} junk job(s) lack disposal routing`, "/admin/jobs");
  }

  const lowProfit = input.jobs.filter((j) => {
    const m = jobMargin(j);
    return m != null && m < 20 && !["completed", "cancelled"].includes(j.status);
  });
  if (lowProfit.length) {
    add("warning", "Low profit jobs", `${lowProfit.length} job(s) under 20% estimated margin`, "/admin/estimates");
  }

  const longRoutes = input.jobs.filter((j) => {
    const mins = j.junkRemovalDetails?.estimatedDriveMinutes;
    return mins != null && mins > 120;
  });
  if (longRoutes.length) {
    add("info", "Routes over 2 hours", `${longRoutes.length} job(s) exceed 2 hr drive estimate`, "/planner");
  }

  for (const s of input.scheduleSlots.filter((x) => x.slotDate === input.today)) {
    if (s.maxJobs > 0 && s.currentJobs / s.maxJobs >= 0.9) {
      add("warning", "Schedule nearing capacity", `${s.windowLabel}: ${s.currentJobs}/${s.maxJobs} booked`, "/admin/schedule");
    }
  }

  const overdue = input.invoices.filter(
    (i) => i.balanceDue > 0 && (i.status === "overdue" || (i.dueDate && i.dueDate < input.today))
  );
  if (overdue.length) {
    add("urgent", "Invoices overdue", `${overdue.length} invoice(s) past due — $${overdue.reduce((s, i) => s + i.balanceDue, 0)}`, "/admin/invoices");
  }

  const staleFinancing = input.financing.filter((f) => {
    if (f.status !== "pending") return false;
    return isBefore(parseISO(f.createdAt), subHours(new Date(), 48));
  });
  if (staleFinancing.length) {
    add("warning", "Financing pending 48+ hours", `${staleFinancing.length} request(s) awaiting decision`, "/admin/financing");
  }

  const late = input.jobs.filter(
    (j) =>
      j.scheduledDate &&
      j.scheduledDate < input.today &&
      !["completed", "cancelled"].includes(j.status)
  );
  if (late.length) {
    add("urgent", "Late jobs", `${late.length} job(s) past scheduled date`, "/admin/jobs");
  }

  const trucks = input.depth?.trucks ?? [];
  const overdueMaint = trucks.filter((t) => t.maintenanceStatus === "overdue");
  if (overdueMaint.length) {
    add("urgent", "Truck maintenance overdue", `${overdueMaint.length} truck(s) past service due`, "/admin/fleet");
  }
  const dueSoonMaint = trucks.filter((t) => t.maintenanceStatus === "due_soon");
  if (dueSoonMaint.length) {
    add("warning", "Maintenance due soon", `${dueSoonMaint.length} truck(s) need service soon`, "/admin/fleet");
  }
  const outOfService = trucks.filter((t) => t.maintenanceStatus === "out_of_service");
  if (outOfService.length) {
    add("urgent", "Trucks out of service", `${outOfService.length} truck(s) unavailable`, "/admin/fleet");
  }

  const closedDumps = (input.depth?.dumpSites ?? []).filter((d) => d.isClosed);
  if (closedDumps.length) {
    add("warning", "Dump site closed", `${closedDumps.map((d) => d.name).join(", ")}`, "/admin/dump-sites");
  }

  const jobsOnClosedDump = input.jobs.filter((j) => {
    const siteId = j.junkRemovalDetails?.selectedDisposalSiteId;
    if (!siteId) return false;
    const site = closedDumps.find((d) => d.id === siteId);
    return !!site && !["completed", "cancelled"].includes(j.status);
  });
  if (jobsOnClosedDump.length) {
    add("urgent", "Jobs routed to closed dump", `${jobsOnClosedDump.length} active job(s) use a closed site`, "/admin/jobs");
  }

  const callbacksDue = input.customers.filter(
    (c) => c.callbackStatus === "due" && c.callbackDueAt && c.callbackDueAt.slice(0, 10) <= input.today
  );
  if (callbacksDue.length) {
    add("warning", "Callbacks due today", `${callbacksDue.length} customer(s) need follow-up`, "/admin/customers");
  }
  const overdueCallbacks = input.customers.filter(
    (c) => c.callbackStatus === "due" && c.callbackDueAt && c.callbackDueAt.slice(0, 10) < input.today
  );
  if (overdueCallbacks.length) {
    add("urgent", "Overdue callbacks", `${overdueCallbacks.length} callback(s) past due`, "/admin/customers");
  }

  for (const da of disposalAlertsFromJobs(input.jobs)) {
    add(da.severity, da.title, da.message, da.href);
  }

  return alerts;
}

function buildPrioritizedAlerts(alerts: OpsAlert[]): PrioritizedAlerts {
  return {
    immediate: alerts.filter((a) => a.severity === "urgent"),
    today: alerts.filter((a) => a.severity === "warning"),
    soon: alerts.filter((a) => a.severity === "info"),
  };
}

function buildFinancial(input: CommandCenterInput): FinancialCommand {
  const now = new Date();
  const paidToday = paymentsInRange(input.payments, startOfDay(now), addDays(startOfDay(now), 1));
  const revenueToday = paidToday.length ? sumPayments(paidToday) : 0;
  const goal = input.company.operationsGoals?.dailyRevenueGoal ?? 2500;
  const goalPct = revenueToday > 0 ? Math.min(100, Math.round((revenueToday / goal) * 100)) : 0;
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 7);
  const weekJobs = input.jobs.filter((j) => {
    if (!j.scheduledDate) return false;
    const d = parseISO(`${j.scheduledDate}T12:00:00`);
    return !isBefore(d, weekStart) && isBefore(d, weekEnd);
  });
  const expectedWeek = weekJobs
    .filter((j) => !["cancelled", "draft"].includes(j.status))
    .reduce((s, j) => s + (j.estimate?.total ?? 0), 0);
  const projectedProfit = weekJobs
    .filter((j) => !["cancelled", "draft", "completed"].includes(j.status))
    .reduce((s, j) => s + (jobProfit(j) ?? 0), 0);

  return {
    revenueToday,
    revenueGoal: goal,
    revenueGoalPct: goalPct,
    revenueGap: Math.max(0, goal - revenueToday),
    payrollDueLabel: input.company.operationsGoals?.payrollDueLabel ?? "Payroll due",
    payrollDueAmount: 0,
    expectedRevenueWeek: expectedWeek,
    projectedProfitWeek: projectedProfit > 0 ? Math.round(projectedProfit) : 0,
  };
}

function buildDispatchTimeline(input: CommandCenterInput): DispatchTimelineEvent[] {
  const roster = rosterFor(input);
  const events: DispatchTimelineEvent[] = [];
  const todayClock = input.depth?.timeclock.filter((t) => t.shiftDate === input.today) ?? [];

  for (const tc of todayClock) {
    const name = employeeDisplayName(roster, tc.employeeId);
    events.push({
      id: `tl-clock-${tc.id}`,
      timeLabel: format(parseISO(tc.clockInAt), "h:mm a"),
      title: `${name} clocked in`,
      category: "employee",
    });
    if (tc.clockOutAt) {
      events.push({
        id: `tl-out-${tc.id}`,
        timeLabel: format(parseISO(tc.clockOutAt), "h:mm a"),
        title: `${name} clocked out`,
        category: "employee",
      });
    }
  }

  if (isDemoDataEnabled()) {
    const crewLabel = roster.slice(0, 2).map((e) => e.name.split(" ")[0]).join(" · ") || "Crew";
    events.push(
      { id: "tl-depart", timeLabel: "7:02 AM", title: "Truck left yard", subtitle: crewLabel, category: "dispatch" },
      { id: "tl-arrive", timeLabel: "8:10 AM", title: "Arrived on site", category: "dispatch" },
      { id: "tl-complete", timeLabel: "8:58 AM", title: "Job completed", subtitle: "Residential pickup", category: "dispatch" },
      { id: "tl-dump", timeLabel: "9:12 AM", title: "Dump run", subtitle: "Transfer station", category: "dispatch" },
      { id: "tl-next", timeLabel: "10:01 AM", title: "Next job", category: "dispatch", isLive: true }
    );
  }

  for (const p of completedPayments(input.payments).filter((p) => dateKey(p.createdAt) === input.today).slice(0, 3)) {
    events.push({
      id: `tl-pay-${p.id}`,
      timeLabel: format(parseISO(p.createdAt), "h:mm a"),
      title: "Payment received",
      subtitle: `$${p.amount}`,
      category: "payment",
    });
  }

  return events.sort((a, b) => {
    const parse = (t: string) => {
      const d = new Date(`1970-01-01 ${t.replace(" AM", " AM").replace(" PM", " PM")}`);
      return d.getTime();
    };
    try {
      return parse(a.timeLabel) - parse(b.timeLabel);
    } catch {
      return 0;
    }
  });
}

export function buildOperationsCommandCenter(input: CommandCenterInput): OperationsCommandCenterData {
  const roster = rosterFor(input);
  const alerts = buildAlerts(input);
  const activity = buildActivity(input);

  const todayJobs = input.jobs.filter((j) => j.scheduledDate === input.today);

  return {
    kpis: buildKpis(input),
    todayOps: buildTodayOps(input),
    scheduleOverview: buildScheduleOverview(input),
    revenuePanel: buildRevenuePanel(input),
    financial: buildFinancial(input),
    fleet: buildFleet(input),
    employees: buildEmployees(input),
    liveUpdates: buildLiveCrewUpdates(roster, input.jobs, input.today, input.depth),
    truckRoutes: buildTruckRouteTimelines(
      input.company,
      input.jobs,
      input.today,
      roster,
      input.depth?.trucks
    ),
    dispatchTimeline: buildDispatchTimeline(input),
    todayScheduleJobs: todayJobs
      .filter((j) => !["cancelled", "draft", "completed"].includes(j.status))
      .sort((a, b) => (a.routeOrder ?? 99) - (b.routeOrder ?? 99)),
    reviewQueue: input.jobs.filter(isReviewJob),
    alerts,
    prioritizedAlerts: buildPrioritizedAlerts(alerts),
    activity,
    crmProfiles: buildCustomerCrmProfiles(
      input.customers,
      input.jobs,
      input.payments,
      input.invoices,
      input.financing,
      input.depth?.interactions ?? []
    ),
    customers: input.customers,
    invoices: input.invoices,
    generatedAt: new Date().toISOString(),
  };
}
