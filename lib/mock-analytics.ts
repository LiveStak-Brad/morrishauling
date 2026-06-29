export interface MorrisKPIs {
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  jobsToday: number;
  pendingEstimates: number;
  conversionRate: number;
  outstandingInvoices: number;
  financingRequests: number;
  customerSatisfaction: number;
  averageTicket: number;
  repeatCustomerRate: number;
  employeeProductivity: number;
  profitMargin: number;
}

export interface RevenueDataPoint {
  label: string;
  value: number;
}

export interface ActivityItem {
  id: string;
  type: "job" | "payment" | "estimate" | "review" | "financing";
  message: string;
  time: string;
  amount?: number;
}

export function getMorrisKPIs(_companyId?: string): MorrisKPIs {
  return {
    todayRevenue: 4280,
    weekRevenue: 28450,
    monthRevenue: 112400,
    jobsToday: 8,
    pendingEstimates: 5,
    conversionRate: 74,
    outstandingInvoices: 3420,
    financingRequests: 1,
    customerSatisfaction: 4.9,
    averageTicket: 412,
    repeatCustomerRate: 42,
    employeeProductivity: 91,
    profitMargin: 41,
  };
}

export function getWeeklyRevenue(_companyId?: string): RevenueDataPoint[] {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return days.map((label, i) => ({
    label,
    value: Math.round(4200 * (0.7 + Math.sin(i) * 0.3 + i * 0.05)),
  }));
}

export function getActivityFeed(_companyId?: string): ActivityItem[] {
  return [
    { id: "1", type: "payment", message: "Deposit received — Main St, St. Charles", time: "12 min ago", amount: 62 },
    { id: "2", type: "job", message: "Job scheduled — Oakwood Dr estate cleanout, Warrenton", time: "34 min ago" },
    { id: "3", type: "estimate", message: "New estimate submitted — Builder Way, O'Fallon", time: "1 hr ago", amount: 499 },
    { id: "4", type: "financing", message: "Financing request pending approval", time: "2 hr ago", amount: 614 },
    { id: "5", type: "review", message: "5-star review from Alex J.", time: "3 hr ago" },
    { id: "6", type: "job", message: "Crew completed — Maple St, Troy", time: "4 hr ago", amount: 349 },
  ];
}
