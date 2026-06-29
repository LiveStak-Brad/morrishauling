"use client";

import { useCompany } from "@/lib/company-context";
import { getJobs } from "@/lib/mock-data";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Card, CardContent } from "@/components/ui/card";

export default function AdminEstimatesPage() {
  const { companyId } = useCompany();
  const jobs = getJobs(companyId).filter((j) => j.estimate);

  return (
    <AdminPageShell title="Estimates">
      <div className="space-y-3">
        {jobs.map((j) => (
          <Card key={j.id}>
            <CardContent className="p-4">
              <p className="font-medium">{j.address.street}</p>
              <p className="text-lg font-bold text-brand-primary">
                ${j.estimate?.total}
              </p>
              <p className="text-xs text-muted-foreground">
                Trailer {j.estimate?.trailerPercent}% · {j.status}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminPageShell>
  );
}
