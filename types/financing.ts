// @supabase-table: financing_requests

export type FinancingStatus =
  | "pending"
  | "approved"
  | "denied"
  | "active"
  | "completed";

export type PaymentFrequency = "weekly" | "biweekly" | "monthly";

export type EmploymentStatus =
  | "employed"
  | "self_employed"
  | "retired"
  | "student"
  | "other";

export type FinancingProviderType =
  | "in_house"
  | "klarna"
  | "affirm"
  | "afterpay"
  | "stripe_link"
  | "square"
  | "paypal";

export type SchedulePaymentStatus = "scheduled" | "paid" | "late" | "missed";

export interface FinancingSchedulePayment {
  id: string;
  dueDate: string;
  amount: number;
  status: SchedulePaymentStatus;
  paidAt?: string;
}

export interface FinancingRequest {
  id: string;
  companyId: string;
  jobId: string;
  invoiceId?: string;
  customerId: string;
  provider: FinancingProviderType;
  status: FinancingStatus;
  totalAmount: number;
  downPayment: number;
  numberOfPayments: number;
  paymentFrequency: PaymentFrequency;
  preferredFirstPaymentDate?: string;
  employmentStatus?: EmploymentStatus;
  monthlyIncome?: number;
  customerNotes?: string;
  internalNotes?: string;
  signaturePlaceholder?: string;
  termsAccepted: boolean;
  denialReason?: string;
  riskScore?: number;
  paymentSchedule?: FinancingSchedulePayment[];
  createdAt: string;
  updatedAt: string;
}

export interface FinancingRequestInput {
  companyId: string;
  jobId: string;
  invoiceId?: string;
  customerId: string;
  provider: FinancingProviderType;
  totalAmount: number;
  downPayment: number;
  numberOfPayments: number;
  paymentFrequency: PaymentFrequency;
  preferredFirstPaymentDate?: string;
  employmentStatus?: EmploymentStatus;
  monthlyIncome?: number;
  customerNotes?: string;
  termsAccepted: boolean;
  signaturePlaceholder?: string;
}

export const FINANCING_DISCLAIMER =
  "In-house financing is offered at the discretion of Morris Hauling & Junk Removal. Approval is not guaranteed. Missed payments may result in collection activity, late fees, or loss of future financing eligibility.";
