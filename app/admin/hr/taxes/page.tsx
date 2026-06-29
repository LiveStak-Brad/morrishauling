"use client";

import { useEffect, useState } from "react";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { PremiumCard } from "@/components/morris/PremiumCard";
import type { Contractor1099Yearly } from "@/types/hr/payroll";

export default function TaxesPage() {
  const [summaries, setSummaries] = useState<Contractor1099Yearly[]>([]);
  const year = new Date().getFullYear();

  useEffect(() => {
    fetch(`/api/hr/taxes?year=${year}`)
      .then((r) => r.json())
      .then((d) => { if (d.ok) setSummaries(d.summaries); });
  }, [year]);

  return (
    <AdminPageShell title="Tax Tracking" description="1099 summaries and year-end totals (tracking only)">
      <p className="text-sm text-muted-foreground mb-4">
        This module tracks compensation data. Consult your CPA for tax filing compliance.
      </p>
      <div className="space-y-3">
        {summaries.length === 0 ? (
          <PremiumCard className="p-6 text-center text-muted-foreground">No 1099 records for {year}.</PremiumCard>
        ) : (
          summaries.map((s) => (
            <PremiumCard key={s.id} className="p-4 flex justify-between">
              <p className="font-medium">{s.employee?.firstName} {s.employee?.lastName}</p>
              <p>${s.totalCompensation.toLocaleString()}</p>
            </PremiumCard>
          ))
        )}
      </div>
    </AdminPageShell>
  );
}
