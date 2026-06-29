"use client";

import { useCompany } from "@/lib/company-context";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AdminEmployeesPage() {
  const { company } = useCompany();

  return (
    <AdminPageShell title="Employees">
      <div className="space-y-3">
        {company.employees.map((e) => (
          <Card key={e.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{e.name}</p>
                <p className="text-sm text-muted-foreground">{e.phone}</p>
              </div>
              <Badge variant="secondary" className="capitalize">{e.role}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminPageShell>
  );
}
