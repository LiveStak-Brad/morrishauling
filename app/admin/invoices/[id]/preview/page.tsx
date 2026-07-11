"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { InvoiceCustomerView } from "@/components/billing/InvoiceCustomerView";
import type { Invoice, Payment } from "@/types/payment";
import type { Customer } from "@/types/user";
import { ArrowLeft } from "lucide-react";

export default function AdminInvoicePreviewPage() {
  const params = useParams();
  const id = params.id as string;
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [customer, setCustomer] = useState<Customer | undefined>();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/invoices/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setInvoice(d.invoice);
          setCustomer(d.customer);
          setPayments(d.payments ?? []);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <AdminPageShell
      title="Preview as Customer"
      description="Exact same layout as the customer invoice link"
      action={
        <Link href={`/admin/invoices/${id}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
      }
    >
      {loading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : !invoice ? (
        <p className="text-muted-foreground">Invoice not found.</p>
      ) : (
        <InvoiceCustomerView
          invoice={invoice}
          payments={payments}
          customerName={customer?.name}
        />
      )}
    </AdminPageShell>
  );
}
