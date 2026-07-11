"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { InvoiceCustomerView } from "@/components/billing/InvoiceCustomerView";
import { Button } from "@/components/ui/button";
import type { Invoice, Payment } from "@/types/payment";
import { toast } from "@/lib/toast";

export default function PublicInvoicePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const token = params.token as string;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [onlineEnabled, setOnlineEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (searchParams.get("paid") === "1") {
      toast.success("Payment submitted — balance updates after Stripe confirms.");
    }
    if (searchParams.get("canceled") === "1") {
      toast.info("Checkout canceled — no charge was made.");
    }
  }, [searchParams]);

  useEffect(() => {
    fetch(`/api/public/invoices/${token}`)
      .then(async (r) => {
        const d = await r.json();
        if (d.ok) {
          setInvoice(d.invoice);
          setPayments(d.payments ?? []);
          setCustomerName(d.customer?.name ?? null);
          setOnlineEnabled(Boolean(d.onlinePaymentsEnabled));
        } else if (r.status === 410) {
          setLinkError(d.error || "This invoice link has expired or been revoked.");
        } else {
          setLinkError(d.error || "This link may be invalid or expired.");
        }
      })
      .finally(() => setLoading(false));
  }, [token]);

  async function pay() {
    if (!invoice) return;
    setPaying(true);
    try {
      const res = await fetch(`/api/public/invoices/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: invoice.balanceDue }),
      });
      const json = await res.json();
      if (!res.ok || !json.url) throw new Error(json.error || "Checkout failed");
      window.location.href = json.url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Checkout failed");
      setPaying(false);
    }
  }

  if (loading) return <main className="mx-auto max-w-2xl p-6 text-muted-foreground">Loading invoice…</main>;
  if (!invoice) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <p className="font-semibold">Invoice link unavailable</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {linkError || "This link may be invalid, expired, or revoked."}
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          Please contact Morris Services for a new secure invoice link.
        </p>
      </main>
    );
  }

  return (
    <main className="p-6">
      <InvoiceCustomerView invoice={invoice} payments={payments} customerName={customerName}>
        {invoice.balanceDue > 0 && onlineEnabled ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Pay securely with card. Your balance updates only after Stripe confirms the payment —
              returning to this page alone does not mark you paid.
            </p>
            <Button disabled={paying} onClick={() => void pay()} className="min-h-11">
              {paying ? "Starting checkout…" : `Pay $${invoice.balanceDue.toFixed(2)}`}
            </Button>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            {onlineEnabled
              ? "This invoice is paid in full."
              : "Online card payment is not enabled yet. Pay by cash, check, bank transfer, or in-person card with Morris Services."}{" "}
            {invoice.terms}
          </p>
        )}
      </InvoiceCustomerView>
    </main>
  );
}
