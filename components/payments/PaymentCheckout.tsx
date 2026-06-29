"use client";

import { useState } from "react";
import type { Invoice, PaymentMethod, PaymentTiming } from "@/types/payment";
import { useCompany } from "@/lib/company-context";
import { mockPaymentProvider } from "@/lib/payment-provider";
import {
  computeDepositAmount,
  getPaymentMethodOptions,
} from "@/lib/payment-utils";
import { PaymentMethodSelector } from "./PaymentMethodSelector";
import { TrustBadgeRow } from "./payment-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { formatCurrency } from "./payment-ui";
import { ButtonLink } from "@/components/ui/button-link";
import { CheckCircle2, Download, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaymentCheckoutProps {
  invoice: Invoice;
  onComplete?: () => void;
}

export function PaymentCheckout({ invoice, onComplete }: PaymentCheckoutProps) {
  const { company, companyId } = useCompany();
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [timing, setTiming] = useState<PaymentTiming>(
    invoice.depositPaid < invoice.depositAmount ? "deposit" : "full"
  );
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const depositAmount = computeDepositAmount(invoice.total, company);
  const depositRemaining = Math.max(0, invoice.depositAmount - invoice.depositPaid);
  const options = getPaymentMethodOptions(company);

  const payAmount =
    timing === "deposit"
      ? depositRemaining || depositAmount
      : timing === "full"
        ? invoice.balanceDue
        : 0;

  const timings: { id: PaymentTiming; label: string; amount: number; show: boolean }[] = [
    {
      id: "deposit",
      label: "Pay deposit",
      amount: depositRemaining || depositAmount,
      show: invoice.depositAmount > 0 && invoice.depositPaid < invoice.depositAmount,
    },
    {
      id: "full",
      label: invoice.balanceDue < invoice.total ? "Pay balance" : "Pay in full",
      amount: invoice.balanceDue,
      show: invoice.balanceDue > 0,
    },
    {
      id: "after_completion",
      label: "Pay after job",
      amount: 0,
      show: invoice.balanceDue > 0,
    },
  ];

  const handlePay = async () => {
    if (method === "financing") return;
    if (payAmount <= 0) return;
    setLoading(true);
    try {
      const result = await mockPaymentProvider.processPayment(
        {
          companyId,
          jobId: invoice.jobId,
          invoiceId: invoice.id,
          amount: payAmount,
          method,
          timing,
        },
        company
      );
      setSuccess(
        `Payment received — ${formatCurrency(result.amount)}. Receipt ${result.receiptNumber}.`
      );
      onComplete?.();
    } finally {
      setLoading(false);
    }
  };

  if (invoice.balanceDue <= 0) {
    return (
      <PremiumCard className="border-emerald-200 bg-emerald-50/50 p-6 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
        <p className="mt-3 text-lg font-bold text-emerald-800">Paid in full</p>
        <p className="mt-1 text-sm text-emerald-700">Thank you for your payment.</p>
        <Button variant="outline" className="mt-4" disabled title="PDF coming soon">
          <Download className="mr-2 h-4 w-4" />
          Download receipt
        </Button>
      </PremiumCard>
    );
  }

  if (method === "financing") {
    return (
      <PremiumCard className="p-6 text-center">
        <p className="font-semibold">Request in-house financing</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Spread {formatCurrency(invoice.balanceDue)} over weekly or monthly payments.
        </p>
        <ButtonLink
          href={`/customer/financing?job=${invoice.jobId}&invoice=${invoice.id}`}
          className="mt-4 bg-brand-primary hover:bg-brand-primary/90"
        >
          Start financing request
        </ButtonLink>
      </PremiumCard>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Payment amount
        </Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {timings
            .filter((t) => t.show)
            .map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTiming(t.id)}
                className={cn(
                  "rounded-xl border px-4 py-2.5 text-left text-sm transition-all",
                  timing === t.id
                    ? "border-brand-primary bg-brand-primary/5 ring-2 ring-brand-primary/20"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <span className="font-semibold">{t.label}</span>
                {t.amount > 0 && (
                  <span className="ml-2 text-brand-primary">{formatCurrency(t.amount)}</span>
                )}
              </button>
            ))}
        </div>
      </div>

      <div>
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Payment method
        </Label>
        <div className="mt-2">
          <PaymentMethodSelector
            options={options}
            selected={method}
            onSelect={(m) => {
              setMethod(m);
              if (m === "financing") return;
            }}
          />
        </div>
      </div>

      {method === "card" && timing !== "after_completion" && (
        <PremiumCard className="space-y-3 p-4">
          <Label>Card details</Label>
          <Input placeholder="4242 4242 4242 4242" className="font-mono" />
          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="MM / YY" />
            <Input placeholder="CVC" />
          </div>
        </PremiumCard>
      )}

      {timing === "after_completion" ? (
        <PremiumCard className="border-orange-200 bg-orange-50/50 p-4 text-sm text-orange-800">
          Your balance of {formatCurrency(invoice.balanceDue)} will be collected when the crew
          finishes the job. You can pay online anytime before then.
        </PremiumCard>
      ) : (
        <Button
          onClick={handlePay}
          disabled={loading || payAmount <= 0 || (method !== "card" && method !== "cash_on_arrival" && method !== "invoice")}
          className="h-12 w-full bg-brand-primary text-base font-semibold hover:bg-brand-primary/90"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Pay {formatCurrency(payAmount)}
        </Button>
      )}

      <TrustBadgeRow />

      {success && (
        <p className="rounded-lg bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
          {success}
        </p>
      )}
    </div>
  );
}
