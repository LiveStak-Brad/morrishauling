import type { Job } from "@/types/job";
import type { HrEmployee } from "./employee";
import type { EmployeeShift } from "./schedule";
import type { TimeclockPunch, PunchType } from "./time";
import type { OnboardingProgress } from "./onboarding";

export type ClockState = "out" | "in" | "lunch" | "break";

export interface ClockSummary {
  state: ClockState;
  stateLabel: string;
  clockedInAt?: string;
  hoursWorkedToday: number;
  estimatedGrossPayToday: number;
  lunchStatus: "none" | "on_lunch" | "completed";
  breakStatus: "none" | "on_break" | "completed";
  recentPunches: TimeclockPunch[];
  allowedPunches: PunchType[];
}

export interface RouteStop {
  id: string;
  type: "yard" | "job" | "dump" | "lunch" | "break";
  label: string;
  time?: string;
  address?: string;
  status: "pending" | "active" | "completed" | "skipped";
  jobId?: string;
  jobType?: string;
  customerName?: string;
  loadPercent?: number;
}

export interface EmployeeDashboardData {
  employee: HrEmployee;
  greeting: string;
  todayShift?: EmployeeShift;
  shiftLabel?: string;
  crew: { id: string; name: string; role: string }[];
  truckName?: string;
  trailerName?: string;
  routeStopCount: number;
  todayJobs: Job[];
  currentJob?: Job;
  routeStops: RouteStop[];
  clock: ClockSummary;
  onboarding?: OnboardingProgress;
  trainingOverdueCount?: number;
  pendingDocumentsCount?: number;
  equipmentAssignedCount?: number;
  hoursThisWeek?: number;
  projectedPaycheck?: number;
  weather?: { tempF: number; condition: string };
  announcements?: Array<{ id: string; title: string; bodyHtml: string; priority: string }>;
}

export interface EmployeeProfileSelf {
  employee: HrEmployee;
  preferredName?: string;
  emergencyContact?: {
    id?: string;
    name: string;
    relationship?: string;
    phone: string;
    email?: string;
  };
  uniformSizes: { itemType: string; size: string }[];
  readOnly: {
    employmentType?: string;
    role: string;
    hourlyRate?: number;
    payType?: string;
    employeeNumber?: string;
  };
  driverLicense?: {
    licenseNumber: string;
    licenseClass?: string;
    licenseState: string;
    expiresAt: string;
  };
  directDepositLast4?: string;
  notificationPreferences?: { email: boolean; sms: boolean; push: boolean };
}

export interface EmployeeProfileUpdate {
  phone?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  zip?: string;
  preferredName?: string;
  emergencyContact?: {
    name: string;
    relationship?: string;
    phone: string;
    email?: string;
  };
  uniformSizes?: { itemType: string; size: string }[];
  driverLicense?: {
    licenseNumber: string;
    licenseClass?: string;
    licenseState?: string;
    expiresAt: string;
  };
  notificationPreferences?: { email: boolean; sms: boolean; push: boolean };
}
