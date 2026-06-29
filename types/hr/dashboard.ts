export interface HrDashboardStats {
  applicants: {
    total: number;
    newThisWeek: number;
    byStatus: Record<string, number>;
  };
  employees: {
    total: number;
    active: number;
    onboarding: number;
    onLeave: number;
  };
  alerts: {
    expiringLicenses: number;
    missingOnboarding: number;
    clockedIn: number;
    lateArrivals: number;
    openShifts: number;
    upcomingBirthdays: number;
    upcomingAnniversaries: number;
    payrollDue: boolean;
    onVacation: number;
    trainingExpiring: number;
    workersCompAlerts: number;
    safetyIncidents: number;
    equipmentNotReturned: number;
    outstandingWriteUps: number;
  };
}
