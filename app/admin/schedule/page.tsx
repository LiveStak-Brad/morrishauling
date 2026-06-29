"use client";

import { useCompany } from "@/lib/company-context";
import { getJobs } from "@/lib/mock-data";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { JobCard } from "@/components/customer/JobCard";

export default function AdminSchedulePage() {
  const { companyId } = useCompany();
  const jobs = getJobs(companyId).filter((j) => j.scheduledDate);

  return (
    <AdminPageShell title="Schedule">
      <div className="space-y-3">
        {jobs.map((job) => (
          <div key={job.id}>
            <p className="mb-1 text-xs text-muted-foreground">{job.scheduledDate}</p>
            <JobCard job={job} />
          </div>
        ))}
      </div>
    </AdminPageShell>
  );
}
