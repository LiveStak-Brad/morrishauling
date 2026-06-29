"use client";

import { useCallback, useEffect, useState } from "react";
import { useCompany } from "@/lib/company-context";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { ButtonLink } from "@/components/ui/button-link";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { Card, CardContent } from "@/components/ui/card";
import type { Payment } from "@/types";
import { Plus, CreditCard } from "lucide-react";

export default function AdminPaymentsPage() {
  const { companyId } = useCompany();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/payments")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setPayments(d.payments ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, companyId]);

  return (
    <AdminPageShell
      title="Payments"
      description={`${payments.length} recorded`}
      action={
        <ButtonLink href="/admin/payments/new" size="sm">
          <Plus className="h-4 w-4 mr-1" /> Record payment
        </ButtonLink>
      }
    >
      {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!loading && payments.length === 0 && (
        <AdminEmptyState
          icon={CreditCard}
          title="No payments collected."
          description="Record a payment when you collect from a customer on site or by phone."
          action={
            <ButtonLink href="/admin/payments/new" size="sm">
              <Plus className="h-4 w-4 mr-1" /> Record payment
            </ButtonLink>
          }
        />
      )}
      <div className="space-y-3">
        {payments.map((p) => (
          <Card key={p.id}>
            <CardContent className="flex justify-between p-4 text-sm">
              <span className="capitalize">{p.method.replace(/_/g, " ")} · {p.timing}</span>
              <span className="font-medium">${p.amount} — {p.status}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminPageShell>
  );
}
