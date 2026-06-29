"use client";

import { useCompany } from "@/lib/company-context";
import { getJobs, DEMO_CUSTOMER_IDS } from "@/lib/mock-data";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { JobCard } from "@/components/customer/JobCard";

export default function CustomerJobsPage() {
  const { companyId } = useCompany();
  const customerId = DEMO_CUSTOMER_IDS[companyId];
  const jobs = getJobs(companyId).filter((j) => j.customerId === customerId);

  return (
    <main className="mx-auto max-w-lg px-4 py-6">
      <PageHeader title="My jobs" description={`${jobs.length} total`} />
      <div className="space-y-3">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} href={`/customer/jobs/${job.id}`} />
        ))}
      </div>
    </main>
  );
}
