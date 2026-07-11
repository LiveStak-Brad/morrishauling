"use client";

import { useState } from "react";
import type { Invoice } from "@/types/payment";
import { OnlinePaymentsDisabledNotice } from "./OnlinePaymentsDisabledNotice";
import { Button } from "@/components/ui/button";
import { MORRIS_COMPANY_ID } from "@/lib/morris-config";

interface PaymentCheckoutProps {
  invoice: Invoice;
  onlineEnabled?: boolean;
  onComplete?: () => void;
}

/**
 * Customer checkout — redirects to Stripe Checkout when enabled.
 * Payment is finalized only by webhook, not by return URL.
 */
export function PaymentCheckout({ invoice, onlineEnabled = false }: PaymentCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (invoice.balanceDue <= 0) {
    return null;
  }

  if (!onlineEnabled) {
    return <OnlinePaymentsDisabledNotice />;
  }

  async function startCheckout(amount?: number) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: invoice.companyId || MORRIS_COMPANY_ID,
          invoiceId: invoice.id,
          amount: amount ?? invoice.balanceDue,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.url) {
        throw new Error(data?.error || "Could not start checkout");
      }
      window.location.href = data.url as string;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">
        Pay securely with card. Your invoice balance updates after Stripe confirms the payment —
        returning to this page alone does not mark you paid.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button disabled={loading} onClick={() => startCheckout()} className="min-h-11">
          {loading ? "Starting checkout…" : `Pay balance $${invoice.balanceDue.toFixed(2)}`}
        </Button>
        {invoice.depositAmount > 0 && invoice.depositPaid < invoice.depositAmount && (
          <Button
            variant="outline"
            disabled={loading}
            onClick={() =>
              startCheckout(Math.min(invoice.depositAmount - invoice.depositPaid, invoice.balanceDue))
            }
            className="min-h-11"
          >
            Pay deposit
          </Button>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
