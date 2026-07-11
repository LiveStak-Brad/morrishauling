"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useCompany } from "@/lib/company-context";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { ButtonLink } from "@/components/ui/button-link";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { labelPaymentStatus } from "@/lib/ui/status-labels";
import type { Payment } from "@/types";
import { Plus, CreditCard } from "lucide-react";

export default function AdminPaymentsPage() {
  const { companyId } = useCompany();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch("/api/admin/payments")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setPayments(d.payments ?? []);
        else setError(d.error ?? "Could not load payments");
      })
      .catch(() => setError("Could not load payments. Check your connection and retry."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, companyId]);

  return (
    <AdminPageShell
      title="Payments"
      description="Every payment links to a customer and invoice"
      action={
        <ButtonLink href="/admin/payments/new" size="sm">
          <Plus className="h-4 w-4 mr-1" /> Record payment
        </ButtonLink>
      }
    >
      {loading && <p className="text-sm text-muted-foreground">Loading payments…</p>}
      {!loading && error && (
        <p className="mb-4 text-sm text-amber-800">
          {error}{" "}
          <button type="button" className="underline" onClick={() => refresh()}>
            Retry
          </button>
        </p>
      )}
      {!loading && !error && payments.length === 0 && (
        <AdminEmptyState
          icon={CreditCard}
          title="No payments yet"
          description="Record a payment from a customer workspace or open invoice when you collect cash, check, or card."
          action={
            <ButtonLink href="/admin/customers" size="sm">
              Open customers
            </ButtonLink>
          }
        />
      )}
      <div className="space-y-3">
        {payments.map((p) => (
          <Card key={p.id}>
            <CardContent className="flex flex-col gap-2 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="font-medium capitalize">
                  {p.method.replace(/_/g, " ")} · ${Number(p.amount).toFixed(2)}
                </p>
                <p className="text-muted-foreground">
                  {labelPaymentStatus(p.status)}
                  {p.timing ? ` · ${p.timing}` : ""}
                </p>
                <div className="flex flex-wrap gap-3 text-xs">
                  {p.customerId && (
                    <Link href={`/admin/customers/${p.customerId}`} className="text-brand-primary underline">
                      Customer
                    </Link>
                  )}
                  {p.invoiceId && (
                    <Link href={`/admin/invoices/${p.invoiceId}`} className="text-brand-primary underline">
                      Invoice
                    </Link>
                  )}
                  {p.jobId && (
                    <Link href={`/admin/jobs/${p.jobId}`} className="text-brand-primary underline">
                      Job
                    </Link>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminPageShell>
  );
}
