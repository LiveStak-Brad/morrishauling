"use client";

import type { AccountPaymentStatus } from "@/types/payment";
import { Timeline, type TimelineStep } from "@/components/morris/Timeline";

const STEPS: { id: string; label: string; statuses: AccountPaymentStatus[] }[] = [
  { id: "estimate", label: "Estimate", statuses: ["estimate_pending"] },
  { id: "deposit", label: "Deposit", statuses: ["deposit_due", "deposit_paid"] },
  { id: "balance", label: "Balance", statuses: ["balance_due", "past_due"] },
  { id: "complete", label: "Paid", statuses: ["paid_in_full"] },
];

const FINANCING_STEPS = [
  { id: "request", label: "Request submitted" },
  { id: "review", label: "Under review" },
  { id: "approved", label: "Plan active" },
  { id: "complete", label: "Paid off" },
];

function statusIndex(status: AccountPaymentStatus): number {
  if (
    ["financing_requested", "financing_approved", "financing_denied"].includes(status)
  ) {
    if (status === "financing_requested") return 1;
    if (status === "financing_approved") return 2;
    return 1;
  }
  if (status === "paid_in_full") return 3;
  if (status === "balance_due" || status === "past_due") return 2;
  if (status === "deposit_paid") return 2;
  if (status === "deposit_due") return 1;
  return 0;
}

interface PaymentStatusStepperProps {
  status: AccountPaymentStatus;
  className?: string;
}

export function PaymentStatusStepper({ status, className }: PaymentStatusStepperProps) {
  const isFinancing = status.startsWith("financing");

  if (isFinancing) {
    const idx =
      status === "financing_requested"
        ? 1
        : status === "financing_approved"
          ? 2
          : status === "financing_denied"
            ? 1
            : 0;
    const steps: TimelineStep[] = FINANCING_STEPS.map((s, i) => ({
      ...s,
      status: i < idx ? "completed" : i === idx ? "current" : "upcoming",
      description:
        status === "financing_denied" && i === 1
          ? "Application not approved"
          : undefined,
    }));
    return <Timeline steps={steps} className={className} />;
  }

  const current = statusIndex(status);
  const steps: TimelineStep[] = STEPS.map((s, i) => ({
    id: s.id,
    label: s.label,
    status: i < current ? "completed" : i === current ? "current" : "upcoming",
    description:
      i === current && status === "past_due"
        ? "Payment overdue — please pay soon"
        : undefined,
  }));

  return <Timeline steps={steps} className={className} />;
}
