"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { InvoiceCustomerView } from "@/components/billing/InvoiceCustomerView";
import type { Invoice, Payment } from "@/types/payment";

export default function PublicInvoicePage() {
  const params = useParams();
  const token = params.token as string;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/public/invoices/${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setInvoice(d.invoice);
          setPayments(d.payments ?? []);
          setCustomerName(d.customer?.name ?? null);
        }
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <main className="mx-auto max-w-2xl p-6 text-muted-foreground">Loading invoice…</main>;
  if (!invoice) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <p className="font-semibold">Invoice unavailable</p>
        <p className="text-sm text-muted-foreground">This link may be invalid or expired.</p>
      </main>
    );
  }

  return (
    <main className="p-6">
      <InvoiceCustomerView invoice={invoice} payments={payments} customerName={customerName}>
        <p className="text-xs text-muted-foreground">
          Online card payment is not enabled yet. Pay by cash, check, bank transfer, or in-person card
          with Morris Services. {invoice.terms}
        </p>
      </InvoiceCustomerView>
    </main>
  );
}
