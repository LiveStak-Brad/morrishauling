export interface PerformanceReview {
  id: string;
  employeeId: string;
  reviewPeriodStart: string;
  reviewPeriodEnd: string;
  overallRating?: number;
  managerRating?: number;
  customerRating?: number;
  strengths?: string;
  improvements?: string;
  goals?: string;
  status: "draft" | "submitted" | "acknowledged" | "archived";
}

export interface DisciplinaryAction {
  id: string;
  employeeId: string;
  actionType: string;
  incidentDate: string;
  description: string;
  correctiveAction?: string;
  suspensionStart?: string;
  suspensionEnd?: string;
  visibleToSupervisor: boolean;
  status: "active" | "resolved" | "appealed" | "expired";
}

export interface HrNote {
  id: string;
  employeeId: string;
  authorProfileId?: string;
  noteType: "general" | "manager" | "hr" | "recognition";
  content: string;
  isPrivate: boolean;
  visibleToSupervisor: boolean;
  createdAt: string;
}

export interface EmployeeKpiSnapshot {
  id: string;
  employeeId: string;
  snapshotDate: string;
  periodType: "daily" | "weekly" | "monthly" | "lifetime";
  jobsCompleted: number;
  revenueGenerated: number;
  profitGenerated: number;
  upsells: number;
  lateArrivals: number;
  callOffs: number;
  customerRating?: number;
}

export interface LeaderboardEntry {
  employeeId: string;
  employeeName: string;
  jobsCompleted: number;
  revenueGenerated: number;
  profitGenerated: number;
  rank: number;
}
