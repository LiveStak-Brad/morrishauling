"use client";

import { useCompany } from "@/lib/company-context";
import { getPayments } from "@/lib/mock-data";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminPaymentsPage() {
  const { companyId } = useCompany();
  const payments = getPayments(companyId);

  return (
    <AdminPageShell title="Payments">
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
