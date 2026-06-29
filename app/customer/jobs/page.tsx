"use client";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { JobCard } from "@/components/customer/JobCard";
import { CustomerLoginPrompt } from "@/components/customer/CustomerLoginPrompt";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { ButtonLink } from "@/components/ui/button-link";
import { useCustomerPortal } from "@/hooks/useCustomerPortal";

export default function CustomerJobsPage() {
  const { data, loading, requiresLogin } = useCustomerPortal();
  const jobs = data?.jobs ?? [];

  if (requiresLogin) {
    return (
      <main className="mx-auto max-w-lg px-4 py-6">
        <CustomerLoginPrompt redirectPath="/customer/jobs" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-6">
      <PageHeader title="My jobs" description={`${jobs.length} total`} />
      {loading ? (
        <p className="text-muted-foreground">Loading jobs…</p>
      ) : jobs.length === 0 ? (
        <PremiumCard className="p-8 text-center text-muted-foreground">
          <p>No jobs on file yet.</p>
          <ButtonLink href="/book" className="mt-4">
            Book a pickup
          </ButtonLink>
        </PremiumCard>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} href={`/customer/jobs/${job.id}`} />
          ))}
        </div>
      )}
    </main>
  );
}
