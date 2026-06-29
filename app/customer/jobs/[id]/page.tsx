"use client";

import { useParams } from "next/navigation";
import { useCompany } from "@/lib/company-context";
import { getJobByCompany, getInvoices } from "@/lib/mock-data";
import { LiveEstimate } from "@/components/estimate/LiveEstimate";
import { PaymentPortal } from "@/components/payments/PaymentPortal";
import { FinancingRequestForm } from "@/components/financing/FinancingRequestForm";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { StatusChip } from "@/components/morris/StatusChip";
import { Timeline, type TimelineStep } from "@/components/morris/Timeline";
import { estimateEngine } from "@/lib/estimate-engine";
import { useMemo } from "react";
import { MapPin, MessageCircle, Upload, Star } from "lucide-react";
import type { JobStatus } from "@/types/job";

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
    time: i === idx && status === "scheduled" ? "Today, 10am–2pm" : undefined,
  })) as TimelineStep[];
}

export default function CustomerJobDetailPage() {
  const params = useParams();
  const jobId = params.id as string;
  const { company, companyId } = useCompany();
  const job = getJobByCompany(companyId, jobId);

  const estimateResult = useMemo(() => {
    if (!job) return null;
    return estimateEngine.calculate(
      {
        loadSizeTier: job.loadSizeTier,
        accessDetails: job.accessDetails,
        items: job.items,
        addressLocation: job.address.location,
      },
      company
    );
  }, [job, company]);

  if (!job) {
    return <main className="p-6 text-center">Job not found</main>;
  }

  const invoice = getInvoices(companyId).find((i) => i.jobId === jobId);
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
        <h1 className="text-2xl font-bold">{job.address.street}</h1>
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
          <h2 className="font-bold">Live tracking</h2>
          <div className="mt-4">
            <Timeline steps={buildTimeline(job.status)} />
          </div>
        </PremiumCard>

        {estimateResult && <LiveEstimate estimate={estimateResult} />}

        <div className="grid grid-cols-2 gap-3">
          <button type="button" className="flex flex-col items-center gap-2 rounded-2xl bg-card p-4 shadow-sm">
            <MessageCircle className="h-6 w-6 text-morris-info" />
            <span className="text-xs font-semibold">Chat</span>
          </button>
          <button type="button" className="flex flex-col items-center gap-2 rounded-2xl bg-card p-4 shadow-sm">
            <Upload className="h-6 w-6 text-brand-primary" />
            <span className="text-xs font-semibold">Add photos</span>
          </button>
        </div>

        <PaymentPortal jobId={job.id} total={total} balanceDue={balanceDue} amountPaid={amountPaid} />

        {company.financingOptions.inHouseEnabled && (
          <FinancingRequestForm jobId={job.id} totalAmount={total} />
        )}

        <PremiumCard className="flex items-center gap-3 p-4">
          <Star className="h-8 w-8 fill-yellow-400 text-yellow-400" />
          <div>
            <p className="font-semibold">Job complete? Leave a review</p>
            <p className="text-sm text-muted-foreground">Help us grow — earn $10 off next pickup</p>
          </div>
        </PremiumCard>
      </main>
    </div>
  );
}
