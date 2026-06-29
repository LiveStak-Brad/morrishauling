export type PayPeriodStatus = "open" | "locked" | "exported" | "paid";
export type PayrollExportFormat = "csv" | "quickbooks" | "adp" | "gusto" | "paychex";

export interface PayPeriod {
  id: string;
  companyId: string;
  startDate: string;
  endDate: string;
  status: PayPeriodStatus;
  lockedAt?: string;
  lockedByProfileId?: string;
  createdAt: string;
}

export interface PayrollEntry {
  id: string;
  payPeriodId: string;
  employeeId: string;
  regularHours: number;
  overtimeHours: number;
  holidayHours: number;
  bonusAmount: number;
  tipsAmount: number;
  commissionAmount: number;
  perJobIncentive: number;
  mileageAmount: number;
  reimbursementAmount: number;
  grossPay: number;
  federalWithholding: number;
  stateWithholding: number;
  otherDeductions: number;
  netPay: number;
  notes?: string;
  employee?: { id: string; firstName: string; lastName: string; employeeNumber?: string };
}

export interface PayrollExport {
  id: string;
  payPeriodId: string;
  exportFormat: PayrollExportFormat;
  filePath?: string;
  fileName?: string;
  rowCount?: number;
  exportedByProfileId?: string;
  exportedAt: string;
}

export interface Contractor1099Yearly {
  id: string;
  employeeId: string;
  taxYear: number;
  totalCompensation: number;
  otherIncome: number;
  notes?: string;
  employee?: { firstName: string; lastName: string };
}
