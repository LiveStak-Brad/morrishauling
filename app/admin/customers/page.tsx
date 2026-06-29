"use client";

import { useCompany } from "@/lib/company-context";
import { getCustomers } from "@/lib/mock-data";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminCustomersPage() {
  const { companyId } = useCompany();
  const customers = getCustomers(companyId);

  return (
    <AdminPageShell title="Customers">
      <div className="space-y-3">
        {customers.map((c) => (
          <Card key={c.id}>
            <CardContent className="p-4">
              <p className="font-medium">{c.name}</p>
              <p className="text-sm text-muted-foreground">{c.email}</p>
              {c.phone && <p className="text-sm">{c.phone}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminPageShell>
  );
}
