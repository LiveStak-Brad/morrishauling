"use client";

import { useCallback, useEffect, useState } from "react";
import { useCompany } from "@/lib/company-context";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminEmptyState } from "@/components/admin/AdminEmptyState";
import { AdminJobIntake } from "@/components/admin/AdminJobIntake";
import { JobCard } from "@/components/customer/JobCard";
import type { Job } from "@/types";
import { Briefcase } from "lucide-react";

export default function AdminJobsPage() {
  const { companyId } = useCompany();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/jobs")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setJobs(d.jobs ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, companyId]);

  return (
    <AdminPageShell title="Jobs" description={`${jobs.length} total — create phone/text bookings below`}>
      <AdminJobIntake onCreated={refresh} />
      <div className="space-y-3 mt-6">
        {loading && <p className="text-muted-foreground text-sm">Loading jobs…</p>}
        {!loading && jobs.length === 0 && (
          <AdminEmptyState
            icon={Briefcase}
            title="No jobs yet."
            description={"Create one manually or wait for a customer booking."}
          />
        )}
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} showInternalProfit />
        ))}
      </div>
    </AdminPageShell>
  );
}
