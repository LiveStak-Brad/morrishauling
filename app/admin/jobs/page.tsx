"use client";

import { useCompany } from "@/lib/company-context";
import { getJobs } from "@/lib/mock-data";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { JobCard } from "@/components/customer/JobCard";

export default function AdminJobsPage() {
  const { companyId } = useCompany();
  const jobs = getJobs(companyId);

  return (
    <AdminPageShell title="Jobs" description={`${jobs.length} total`}>
      <div className="space-y-3">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </AdminPageShell>
  );
}
