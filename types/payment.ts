// @supabase-table: payments, invoices

export type PaymentMethod =
  | "card"
  | "cash_on_arrival"
  | "cash"
  | "check"
  | "invoice"
  | "financing"
  | "paypal"
  | "apple_pay"
  | "google_pay";

export type PaymentStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "refunded"
  | "partially_refunded";

export type PaymentTiming = "deposit" | "full" | "after_completion";

/** Customer-facing account payment status */
export type AccountPaymentStatus =
  | "estimate_pending"
  | "deposit_due"
  | "deposit_paid"
  | "balance_due"
  | "paid_in_full"
  | "financing_requested"
  | "financing_approved"
  | "financing_denied"
  | "past_due";

export interface InvoiceAdjustment {
  id: string;
  label: string;
  amount: number;
}

export interface Payment {
  id: string;
  companyId: string;
  jobId: string;
  invoiceId?: string;
  amount: number;
  method: PaymentMethod;
  timing: PaymentTiming;
  status: PaymentStatus;
  receiptNumber?: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  companyId: string;
  jobId: string;
  customerId: string;
  estimateAmount: number;
  adjustments: InvoiceAdjustment[];
  subtotal: number;
  fees: number;
  depositAmount: number;
  depositPaid: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  status: "draft" | "sent" | "paid" | "partial" | "overdue";
  paymentStatus: AccountPaymentStatus;
  dueDate?: string;
  terms?: string;
  finalPriceNotes?: string;
  createdAt: string;
}

export interface CreatePaymentRequest {
  companyId: string;
  jobId: string;
  invoiceId?: string;
  amount: number;
  method: PaymentMethod;
  timing: PaymentTiming;
}

export interface PaymentIntentResult {
  intentId: string;
  clientSecret?: string;
  status: PaymentStatus;
  amount: number;
}

export interface PaymentResult {
  paymentId: string;
  status: PaymentStatus;
  amount: number;
  receiptNumber?: string;
}

export interface RefundResult {
  refundId: string;
  status: PaymentStatus;
  amount: number;
}

export interface PaymentMethodOption {
  id: PaymentMethod;
  label: string;
  description: string;
  available: boolean;
  placeholder?: boolean;
  icon: string;
}
