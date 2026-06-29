"use client";

import { PremiumCard } from "@/components/morris/PremiumCard";
import { StatusChip } from "@/components/morris/StatusChip";
import type { AccountPaymentStatus } from "@/types/payment";
import {
  getPaymentStatusLabel,
  getPaymentStatusVariant,
} from "@/lib/payment-utils";
import { formatCurrency } from "./payment-ui";
import { Sparkles } from "lucide-react";

interface PaymentSummaryCardProps {
  balanceDue: number;
  total: number;
  amountPaid: number;
  status: AccountPaymentStatus;
  invoiceNumber?: string;
}

export function PaymentSummaryCard({
  balanceDue,
  total,
  amountPaid,
  status,
  invoiceNumber,
}: PaymentSummaryCardProps) {
  const progress = total > 0 ? Math.min(100, Math.round((amountPaid / total) * 100)) : 0;

  return (
    <div className="relative overflow-hidden rounded-2xl morris-gradient-bg p-6 text-white shadow-xl animate-fade-in">
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-black/20 blur-3xl" />

      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-medium text-white/70">
              <Sparkles className="h-3.5 w-3.5" />
              {invoiceNumber ? `Invoice ${invoiceNumber}` : "Account balance"}
            </p>
            <p className="mt-2 text-4xl font-bold tracking-tight">
              {formatCurrency(balanceDue)}
            </p>
            <p className="mt-1 text-sm text-white/60">
              {balanceDue > 0 ? "Balance due" : "Nothing owed — you're all set"}
            </p>
          </div>
          <StatusChip
            label={getPaymentStatusLabel(status)}
            variant={getPaymentStatusVariant(status)}
            pulse={status === "financing_requested"}
            className="bg-white/15 text-white ring-white/30"
          />
        </div>

        <div className="mt-6">
          <div className="mb-2 flex justify-between text-xs font-medium text-white/70">
            <span>{formatCurrency(amountPaid)} paid</span>
            <span>{formatCurrency(total)} total</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-emerald-400 transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function BalanceHero({
  label,
  amount,
  sublabel,
}: {
  label: string;
  amount: number;
  sublabel?: string;
}) {
  return (
    <PremiumCard className="border-0 bg-gradient-to-br from-gray-900 to-black p-6 text-white">
      <p className="text-sm font-medium text-white/60">{label}</p>
      <p className="mt-1 text-3xl font-bold">{formatCurrency(amount)}</p>
      {sublabel && <p className="mt-2 text-sm text-white/50">{sublabel}</p>}
    </PremiumCard>
  );
}
