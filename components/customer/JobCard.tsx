"use client";

import type { Job, JobStatus } from "@/types/job";
import Link from "next/link";
import { ChevronRight, MapPin, Calendar } from "lucide-react";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { StatusChip } from "@/components/morris/StatusChip";
import { JobServiceBadge } from "@/components/jobs/JobServiceBadge";
import { JobCardHaulingExtras, JobCardJunkExtras } from "@/components/jobs/ServiceLineJobViews";

const STATUS_CONFIG: Record<
  JobStatus,
  { label: string; variant: "success" | "warning" | "info" | "urgent" | "neutral" | "live" }
> = {
  draft: { label: "Draft", variant: "neutral" },
  submitted: { label: "Submitted", variant: "info" },
  estimated: { label: "Estimated", variant: "info" },
  scheduled: { label: "Scheduled", variant: "live" },
  in_progress: { label: "In progress", variant: "live" },
  needs_dump: { label: "Dump run", variant: "warning" },
  completed: { label: "Completed", variant: "success" },
  cancelled: { label: "Cancelled", variant: "urgent" },
};

interface JobCardProps {
  job: Job;
  href?: string;
  showInternalProfit?: boolean;
}

export function JobCard({ job, href, showInternalProfit }: JobCardProps) {
  const status = STATUS_CONFIG[job.status];

  const content = (
    <PremiumCard interactive className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <JobServiceBadge serviceType={job.serviceType ?? "junk_removal"} />
            <StatusChip label={status.label} variant={status.variant} pulse={job.status === "in_progress"} />
            {(job.estimate || job.pricingBreakdown) && (
              <span className="text-lg font-bold text-brand-primary">
                ${job.estimate?.total ?? job.pricingBreakdown?.reduce((s, l) => s + l.amount, 0)}
              </span>
            )}
          </div>
          <p className="mt-2 flex items-center gap-1.5 font-semibold">
            <MapPin className="h-4 w-4 shrink-0 text-brand-primary" />
            <span className="truncate">
              {job.serviceType === "hauling_transport" && job.haulingDetails
                ? `${job.haulingDetails.pickup.city} → ${job.haulingDetails.delivery.city}`
                : job.address.street}
            </span>
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {job.address.city}, {job.address.state}
          </p>
          {job.scheduledDate && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              {job.scheduledDate}
            </p>
          )}
        </div>
        <ChevronRight className="mt-2 h-5 w-5 shrink-0 text-muted-foreground" />
      </div>
      <JobCardHaulingExtras job={job} showInternalProfit={showInternalProfit} />
      <JobCardJunkExtras job={job} showInternalProfit={showInternalProfit} />
    </PremiumCard>
  );

  if (href) return <Link href={href}>{content}</Link>;
  return content;
}
