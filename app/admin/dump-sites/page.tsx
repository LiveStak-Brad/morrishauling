"use client";

import { useCompany } from "@/lib/company-context";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminDumpSitesPage() {
  const { company } = useCompany();

  return (
    <AdminPageShell title="Dump sites">
      <div className="space-y-3">
        {company.dumpSites.map((d) => (
          <Card key={d.id}>
            <CardContent className="p-4">
              <p className="font-medium">{d.name}</p>
              <p className="text-sm text-muted-foreground">{d.address}</p>
              {d.feePerLoad && (
                <p className="text-sm">Fee: ${d.feePerLoad}/load</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminPageShell>
  );
}
