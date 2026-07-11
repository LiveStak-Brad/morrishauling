"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useCompany } from "@/lib/company-context";
import { useCustomerPortal } from "@/hooks/useCustomerPortal";
import { CustomerLoginPrompt } from "@/components/customer/CustomerLoginPrompt";
import { LiveEstimate } from "@/components/estimate/LiveEstimate";
import { PaymentPortal } from "@/components/payments/PaymentPortal";
import { FinancingRequestForm } from "@/components/financing/FinancingRequestForm";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { StatusChip } from "@/components/morris/StatusChip";
import { Timeline, type TimelineStep } from "@/components/morris/Timeline";
import { junkRemovalEngine } from "@/lib/estimate/junk-removal-engine";
import { CustomerHaulingJobDetail, CustomerJunkJobDetail } from "@/components/jobs/ServiceLineJobViews";
import { JobServiceBadge } from "@/components/jobs/JobServiceBadge";
import type { Job } from "@/types/job";
import type { Invoice } from "@/types/payment";
import type { FinancingRequest } from "@/types/financing";
import type { JobStatus } from "@/types/job";
import { MapPin, Phone } from "lucide-react";

const STATUS_VARIANT: Record<JobStatus, "success" | "warning" | "info" | "urgent" | "neutral" | "live"> = {
  draft: "neutral",
  submitted: "info",
  estimated: "info",
  scheduled: "live",
  in_progress: "live",
  needs_dump: "warning",
  completed: "success",
  cancelled: "urgent",
};

function buildTimeline(status: JobStatus): TimelineStep[] {
  const steps = ["submitted", "estimated", "scheduled", "in_progress", "completed"];
  const labels = ["Request received", "Estimate confirmed", "Crew scheduled", "On site", "Complete"];
  const idx = steps.indexOf(status);
  return labels.map((label, i) => ({
    id: String(i),
    label,
    status: i < idx ? "completed" : i === idx ? "current" : "upcoming",
    time: undefined,
  })) as TimelineStep[];
}

export default function CustomerJobDetailPage() {
  const params = useParams();
  const jobId = params.id as string;
  const { company } = useCompany();
  const { requiresLogin, loading: portalLoading } = useCustomerPortal();
  const [job, setJob] = useState<Job | null>(null);
  const [invoice, setInvoice] = useState<Invoice | undefined>();
  const [financing, setFinancing] = useState<FinancingRequest | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (requiresLogin || portalLoading) return;
    setLoading(true);
    fetch(`/api/me/customer/jobs/${jobId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setJob(d.job);
          setInvoice(d.invoice);
          setFinancing(d.financing);
        } else {
          setError(d.error ?? "Job not found");
        }
      })
      .catch(() => setError("Failed to load job"))
      .finally(() => setLoading(false));
  }, [jobId, requiresLogin, portalLoading]);

  const estimateResult = useMemo(() => {
    if (!job || job.serviceType === "hauling_transport") return null;
    return junkRemovalEngine.calculate(
      {
        mode: job.junkRemovalDetails?.estimateMode ?? "cleanout",
        selectedItems: job.junkRemovalDetails?.selectedItems,
        loadSizeTier: job.loadSizeTier,
        junkCategory: job.junkType,
        accessDetails: job.accessDetails,
        items: job.items,
        addressLocation: job.address.location,
        zip: job.address.zip,
        priorityLevel: job.junkRemovalDetails?.priorityLevel,
        hasPhotos: job.photos.length > 0,
        customerNotes: job.customerNotes,
      },
      company
    );
  }, [job, company]);

  if (requiresLogin) {
    return (
      <main className="p-6">
        <CustomerLoginPrompt redirectPath={`/customer/jobs/${jobId}`} />
      </main>
    );
  }

  if (loading || portalLoading) {
    return <main className="p-6 text-muted-foreground">Loading job…</main>;
  }

  if (!job || error) {
    return (
      <main className="p-6 text-center">
        <p>{error ?? "Job not found"}</p>
        <Link href="/customer/jobs" className="mt-4 inline-block text-brand-primary underline">
          Back to jobs
        </Link>
      </main>
    );
  }

  const total = job.estimate?.total ?? estimateResult?.total ?? 0;
  const balanceDue = invoice?.balanceDue ?? total;
  const amountPaid = invoice?.amountPaid ?? 0;

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="morris-gradient-bg px-4 pb-8 pt-6 text-white">
        <StatusChip
          label={job.status.replace(/_/g, " ")}
          variant={STATUS_VARIANT[job.status]}
          pulse={job.status === "in_progress"}
          className="mb-3"
        />
        <JobServiceBadge serviceType={job.serviceType ?? "junk_removal"} />
        <h1 className="mt-2 text-2xl font-bold">
          {job.serviceType === "hauling_transport" && job.haulingDetails
            ? `${job.haulingDetails.pickup.city} → ${job.haulingDetails.delivery.city}`
            : job.address.street}
        </h1>
        <p className="mt-1 flex items-center gap-1.5 text-white/70">
          <MapPin className="h-4 w-4" />
          {job.address.city}, {job.address.state}
        </p>
        {job.estimate && (
          <p className="mt-4 text-3xl font-bold">${job.estimate.total}</p>
        )}
      </div>

      <main className="mx-auto max-w-lg px-4 -mt-4 space-y-4">
        <PremiumCard className="p-5">
          <h2 className="font-heading text-lg font-medium tracking-tight">Job progress</h2>
          <div className="mt-4">
            <Timeline steps={buildTimeline(job.status)} />
          </div>
        </PremiumCard>

        {job.serviceType === "hauling_transport" ? (
          <CustomerHaulingJobDetail job={job} />
        ) : job.junkRemovalDetails ? (
          <CustomerJunkJobDetail job={job} />
        ) : (
          estimateResult && <LiveEstimate estimate={estimateResult} />
        )}

        <a
          href={`tel:${company.phone.replace(/\D/g, "")}`}
          className="flex items-center justify-center gap-2 rounded-2xl border border-black/5 bg-white p-4 text-sm font-semibold text-brand-primary shadow-sm"
        >
          <Phone className="h-5 w-5" aria-hidden />
          Call {company.phone}
        </a>

        <PaymentPortal jobId={job.id} total={total} balanceDue={balanceDue} amountPaid={amountPaid} />

        {company.financingOptions.inHouseEnabled && (
          <FinancingRequestForm jobId={job.id} totalAmount={total} />
        )}
      </main>
    </div>
  );
}
