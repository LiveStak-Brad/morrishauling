// @supabase-table: payments, invoices

export type PaymentMethod =
  | "card"
  | "cash_on_arrival"
  | "cash"
  | "check"
  | "manual_card"
  | "bank_transfer"
  | "other"
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
  customerId?: string;
  amount: number;
  method: PaymentMethod;
  timing: PaymentTiming;
  status: PaymentStatus;
  receiptNumber?: string;
  notes?: string;
  proofUrl?: string;
  reversedAt?: string;
  reversalReason?: string;
  receiptIssuedAt?: string;
  externalReference?: string;
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
  status:
    | "draft"
    | "ready_to_send"
    | "sent"
    | "viewed"
    | "partially_paid"
    | "paid"
    | "overdue"
    | "void"
    | "refunded"
    | "disputed"
    | "written_off"
    | "partial";
  paymentStatus: AccountPaymentStatus;
  dueDate?: string;
  terms?: string;
  finalPriceNotes?: string;
  pdfStoragePath?: string;
  estimateId?: string;
  originalEstimateTotal?: number;
  approvedAdjustmentsTotal?: number;
  customerNotes?: string;
  internalNotes?: string;
  deliveryStatus?: "not_sent" | "pending" | "delivered" | "failed" | "skipped";
  deliveryError?: string;
  sentAt?: string;
  viewedAt?: string;
  issueDate?: string;
  createdAt: string;
}

export interface PaymentAllocation {
  id: string;
  companyId: string;
  paymentId: string;
  invoiceId: string;
  amount: number;
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
