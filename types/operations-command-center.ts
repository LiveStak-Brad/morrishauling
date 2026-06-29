import type { Job } from "@/types/job";
import type { Customer } from "@/types/user";
import type { Invoice } from "@/types";

export interface DataPoint {
  label: string;
  value: number;
}

export interface CommandCenterKpis {
  revenueToday: number | null;
  revenueThisWeek: number | null;
  revenueThisMonth: number | null;
  projectedProfitToday: number | null;
  outstandingReceivables: number;
  jobsScheduledToday: number;
  jobsAwaitingReview: number;
  todaysCapacityPct: number | null;
  todaysCapacityLabel: string;
  averageTicket: number | null;
  projectedWeeklyRevenue: number | null;
}

export interface ScheduleWindowSummary {
  label: string;
  booked: number;
  max: number;
  remaining: number;
  slots: { id: string; date: string; booked: number; max: number; status: string }[];
}

export interface TodayOps {
  morning: ScheduleWindowSummary;
  afternoon: ScheduleWindowSummary;
  flexible: ScheduleWindowSummary;
  crewsAssigned: number;
  trucksInService: number;
  trailersInUse: number;
  jobsInProgress: number;
  jobsCompletedToday: number;
  jobsAwaitingReview: number;
  unassignedJobs: number;
  lateJobs: number;
  overdueInvoices: number;
  financingPending: number;
}

export interface ScheduleOverview {
  morning: ScheduleWindowSummary;
  afternoon: ScheduleWindowSummary;
  flexible: ScheduleWindowSummary;
  crewUtilizationPct: number | null;
  trailerUtilizationPct: number | null;
  capacityWarnings: string[];
}

export interface RevenuePanel {
  revenueByDay: DataPoint[];
  profitByDay: DataPoint[];
  paymentsCollected: number | null;
  outstandingBalances: number;
  estimateApprovalValue: number | null;
  pendingFinancingTotal: number;
}

export interface FleetTruckStatus {
  truckId: string;
  truckName: string;
  assignedCrew: string[];
  crewAvatars: { name: string; avatarUrl: string }[];
  driverName: string | null;
  currentJob: string | null;
  currentJobLabel: string | null;
  fuelLevelPct: number | null;
  fuelEstimate: number | null;
  trailerAttached: string | null;
  nextScheduledStop: string | null;
  nextStopLabel: string | null;
  nextStopEta: string | null;
  maintenanceWarning: string | null;
  maintenanceStatus: "good" | "due_soon" | "overdue" | "out_of_service";
  maintenanceLabel: string;
  todayRevenue: number;
  todayStops: number;
  livePhase: LiveDispatchPhase | null;
  liveMessage: string | null;
}

export interface EmployeeStatusRow {
  employeeId: string;
  name: string;
  avatarUrl: string;
  status: "on_route" | "available" | "assigned" | "unknown";
  statusLabel: string;
  clockStatus: "clocked_in" | "on_break" | "clocked_out" | "off" | "not_clocked";
  clockedInAt: string | null;
  hoursToday: number | null;
  currentAssignment: string | null;
  currentJobLabel: string | null;
  jobsToday: number;
  jobsCompletedToday: number;
  revenueProducedToday: number | null;
  livePhase: LiveDispatchPhase | null;
  liveMessage: string | null;
  liveDetail: string | null;
  liveEtaMinutes: number | null;
  trailerLoadPct: number | null;
}

export type LiveDispatchPhase =
  | "clocked_in"
  | "departed_yard"
  | "driving"
  | "on_site"
  | "loading"
  | "driving_dump"
  | "at_dump"
  | "dump_complete"
  | "next_job"
  | "returning"
  | "available";

export interface LiveCrewUpdate {
  id: string;
  employeeId: string;
  employeeName: string;
  avatarUrl: string;
  phase: LiveDispatchPhase;
  headline: string;
  detail: string;
  etaMinutes: number | null;
  trailerLoadPct: number | null;
  truckName: string | null;
  updatedAt: string;
  isLive: boolean;
}

export interface RouteTimelineStop {
  id: string;
  timeLabel: string;
  title: string;
  subtitle: string;
  stopType: "yard" | "job" | "dump" | "end";
  driveMinutesFromPrevious: number | null;
  location?: { lat: number; lng: number };
}

export interface TruckRouteTimeline {
  truckId: string;
  truckName: string;
  crew: { name: string; avatarUrl: string }[];
  trailerName: string | null;
  stops: RouteTimelineStop[];
  googleMapsDirectionsUrl: string;
  livePhase: LiveDispatchPhase | null;
  liveMessage: string | null;
}

export interface DispatchTimelineEvent {
  id: string;
  timeLabel: string;
  title: string;
  subtitle?: string;
  category: ActivityCategory | "dispatch";
  isLive?: boolean;
}

export interface FinancialCommand {
  revenueToday: number;
  revenueGoal: number;
  revenueGoalPct: number;
  revenueGap: number;
  payrollDueLabel: string;
  payrollDueAmount: number;
  expectedRevenueWeek: number;
  projectedProfitWeek: number;
}

export interface PrioritizedAlerts {
  immediate: OpsAlert[];
  today: OpsAlert[];
  soon: OpsAlert[];
}

export interface CustomerCrmProfile {
  customerId: string;
  name: string;
  email: string;
  phone?: string;
  customerSince: string;
  totalJobs: number;
  totalSpent: number;
  averageTicket: number;
  lastReviewStars: number | null;
  preferredCrew: string | null;
  callCount: number;
  textCount: number;
  invoiceStatus: string;
  financingStatus: string;
  notes: string[];
  tags: string[];
}

export type OpsAlertSeverity = "info" | "warning" | "urgent";

export interface OpsAlert {
  id: string;
  severity: OpsAlertSeverity;
  title: string;
  detail: string;
  href?: string;
}

export type ActivityCategory =
  | "payment"
  | "booking"
  | "review"
  | "schedule"
  | "invoice"
  | "employee"
  | "financing"
  | "dispatch"
  | "other";

export interface ActivityFeedItem {
  id: string;
  category: ActivityCategory;
  message: string;
  time: string;
  amount?: number;
  createdAt: string;
  isLive?: boolean;
}

export interface OperationsCommandCenterData {
  kpis: CommandCenterKpis;
  todayOps: TodayOps;
  scheduleOverview: ScheduleOverview;
  revenuePanel: RevenuePanel;
  financial: FinancialCommand;
  fleet: FleetTruckStatus[];
  employees: EmployeeStatusRow[];
  liveUpdates: LiveCrewUpdate[];
  truckRoutes: TruckRouteTimeline[];
  dispatchTimeline: DispatchTimelineEvent[];
  todayScheduleJobs: Job[];
  reviewQueue: Job[];
  alerts: OpsAlert[];
  prioritizedAlerts: PrioritizedAlerts;
  activity: ActivityFeedItem[];
  crmProfiles: CustomerCrmProfile[];
  customers: Customer[];
  invoices: Invoice[];
  generatedAt: string;
}
