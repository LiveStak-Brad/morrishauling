import type { CompanyConfig } from "@/types";
import type {
  AccountPaymentStatus,
  Invoice,
  Payment,
  PaymentMethodOption,
} from "@/types/payment";
import type { FinancingRequest } from "@/types/financing";
import { FINANCING_DISCLAIMER } from "@/types/financing";

export function computeDepositAmount(total: number, company: CompanyConfig): number {
  const { depositPercent, depositMinAmount } = company.paymentOptions;
  return Math.max(depositMinAmount, Math.round(total * (depositPercent / 100)));
}

export function derivePaymentStatus(
  invoice: Invoice,
  financing?: FinancingRequest | null
): AccountPaymentStatus {
  if (financing?.status === "pending") return "financing_requested";
  if (financing?.status === "denied") return "financing_denied";
  if (financing?.status === "approved" || financing?.status === "active") {
    return "financing_approved";
  }
  if (invoice.status === "overdue" || invoice.paymentStatus === "past_due") {
    return "past_due";
  }
  if (invoice.balanceDue <= 0 && invoice.amountPaid >= invoice.total) {
    return "paid_in_full";
  }
  if (invoice.depositPaid >= invoice.depositAmount && invoice.balanceDue > 0) {
    return invoice.depositPaid > 0 && invoice.amountPaid < invoice.total
      ? "balance_due"
      : "deposit_paid";
  }
  if (invoice.depositPaid > 0 && invoice.depositPaid < invoice.depositAmount) {
    return "deposit_due";
  }
  if (invoice.amountPaid === 0 && invoice.depositAmount > 0) {
    return "deposit_due";
  }
  if (invoice.amountPaid > 0 && invoice.balanceDue > 0) {
    return "balance_due";
  }
  return invoice.paymentStatus ?? "estimate_pending";
}

export function getPaymentStatusLabel(status: AccountPaymentStatus): string {
  const labels: Record<AccountPaymentStatus, string> = {
    past_due: "Overdue",
    paid_in_full: "Paid",
    balance_due: "Partially Paid",
    deposit_due: "Deposit Due",
    deposit_paid: "Deposit Paid",
    estimate_pending: "Estimate Pending",
    financing_requested: "Financing Requested",
    financing_approved: "Financing Approved",
    financing_denied: "Financing Denied",
  };
  return labels[status];
}

export function getPaymentStatusVariant(
  status: AccountPaymentStatus
): "success" | "warning" | "info" | "urgent" | "neutral" | "live" {
  const map: Record<AccountPaymentStatus, "success" | "warning" | "info" | "urgent" | "neutral" | "live"> = {
    estimate_pending: "neutral",
    deposit_due: "warning",
    deposit_paid: "info",
    balance_due: "warning",
    paid_in_full: "success",
    financing_requested: "live",
    financing_approved: "success",
    financing_denied: "urgent",
    past_due: "urgent",
  };
  return map[status];
}

export function getPaymentMethodOptions(company: CompanyConfig): PaymentMethodOption[] {
  const opts: PaymentMethodOption[] = [
    {
      id: "card",
      label: "Credit / Debit Card",
      description: "Visa, Mastercard, Amex, Discover",
      available: true,
      icon: "card",
    },
    {
      id: "apple_pay",
      label: "Apple Pay",
      description: "Pay with one tap",
      available: false,
      placeholder: true,
      icon: "apple",
    },
    {
      id: "google_pay",
      label: "Google Pay",
      description: "Fast checkout",
      available: false,
      placeholder: true,
      icon: "google",
    },
    {
      id: "paypal",
      label: "PayPal",
      description: "Pay with PayPal balance or card",
      available: false,
      placeholder: true,
      icon: "paypal",
    },
    {
      id: "cash_on_arrival",
      label: "Cash on arrival",
      description: "Pay crew when we arrive",
      available: company.paymentOptions.methods.includes("cash_on_arrival"),
      icon: "cash",
    },
    {
      id: "invoice",
      label: "Invoice",
      description: "Bill me — net 15 terms",
      available: company.paymentOptions.methods.includes("invoice"),
      icon: "invoice",
    },
    {
      id: "financing",
      label: "In-house financing",
      description: "Request a payment plan",
      available: company.financingOptions.inHouseEnabled,
      icon: "financing",
    },
  ];
  return opts.filter((o) => o.available || o.placeholder);
}

export function calculateFinancingBreakdown(
  total: number,
  downPayment: number,
  numberOfPayments: number
) {
  const remaining = Math.max(0, total - downPayment);
  const perPayment =
    numberOfPayments > 0
      ? Math.round((remaining / numberOfPayments) * 100) / 100
      : 0;
  return { total, downPayment, remaining, perPayment, numberOfPayments };
}

export function generatePaymentSchedule(
  remaining: number,
  numberOfPayments: number,
  frequency: "weekly" | "biweekly" | "monthly",
  startDate: string
) {
  const perPayment = Math.round((remaining / numberOfPayments) * 100) / 100;
  const daysBetween = frequency === "weekly" ? 7 : frequency === "biweekly" ? 14 : 30;
  const start = new Date(startDate);
  return Array.from({ length: numberOfPayments }, (_, i) => {
    const due = new Date(start);
    due.setDate(due.getDate() + daysBetween * i);
    return {
      id: `sched-${i + 1}`,
      dueDate: due.toISOString().split("T")[0],
      amount: perPayment,
      status: "scheduled" as const,
    };
  });
}

export function buildPaymentActivity(
  invoice: Invoice,
  payments: Payment[],
  financing?: FinancingRequest | null
) {
  const events: { id: string; label: string; amount?: number; date: string; type: string }[] = [];

  events.push({
    id: "inv-created",
    label: `Invoice ${invoice.invoiceNumber} created`,
    amount: invoice.total,
    date: invoice.createdAt,
    type: "invoice",
  });

  payments
    .filter((p) => p.invoiceId === invoice.id || p.jobId === invoice.jobId)
    .forEach((p) => {
      events.push({
        id: p.id,
        label: `${p.timing === "deposit" ? "Deposit" : p.timing === "full" ? "Full payment" : "Payment"} via ${p.method.replace(/_/g, " ")}`,
        amount: p.amount,
        date: p.createdAt,
        type: "payment",
      });
    });

  if (financing) {
    events.push({
      id: financing.id,
      label: `Financing request ${financing.status}`,
      amount: financing.totalAmount,
      date: financing.createdAt,
      type: "financing",
    });
  }

  return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export { FINANCING_DISCLAIMER };
