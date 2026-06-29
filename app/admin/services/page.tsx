"use client";

import { useCompany } from "@/lib/company-context";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminServicesPage() {
  const { company } = useCompany();

  return (
    <AdminPageShell title="Services">
      <div className="grid gap-3 sm:grid-cols-2">
        {company.services.map((s) => (
          <Card key={s.id}>
            <CardHeader>
              <CardTitle className="text-base">{s.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{s.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminPageShell>
  );
}
