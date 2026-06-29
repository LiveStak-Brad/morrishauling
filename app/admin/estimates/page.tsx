"use client";

import { useEffect, useState } from "react";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { JobCard } from "@/components/customer/JobCard";
import { HaulingInternalProfitCard } from "@/components/hauling/HaulingInternalProfitCard";
import { JobServiceBadge } from "@/components/jobs/JobServiceBadge";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { FileSpreadsheet } from "lucide-react";
import type { Job } from "@/types/job";

export default function AdminEstimatesPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/jobs")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setJobs(
            (d.jobs as Job[]).filter((j) => j.estimate || j.pricingBreakdown?.length)
          );
        }
      })
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminPageShell title="Estimates" description={`${jobs.length} estimates on file`}>
      {loading ? (
        <p className="text-muted-foreground">Loading estimates…</p>
      ) : jobs.length === 0 ? (
        <AdminEmptyState
          icon={FileSpreadsheet}
          title="No estimates available."
          description="Create a job or intake an estimate to get started."
        />
      ) : (
        <div className="space-y-6">
          {jobs.map((j) => (
            <div key={j.id} className="space-y-3">
              <div className="flex items-center gap-2">
                <JobServiceBadge serviceType={j.serviceType ?? "junk_removal"} />
                <span className="text-xs text-muted-foreground">{j.status.replace(/_/g, " ")}</span>
              </div>
              <JobCard job={j} showInternalProfit />
              {j.serviceType === "hauling_transport" && <HaulingInternalProfitCard job={j} />}
            </div>
          ))}
        </div>
      )}
    </AdminPageShell>
  );
}
