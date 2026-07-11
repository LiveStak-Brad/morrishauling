"use client";

import type { Job } from "@/types/job";
import type { JobStatus } from "@/types/job";
import { Button } from "@/components/ui/button";
import { mutateJobStatus } from "@/lib/api/mutations";
import { useCompany } from "@/lib/company-context";
import { canMarkJobCompleted } from "@/lib/disposal/disposal-requirements";
import { fieldFlowForDivision, JOB_STATUS_LABELS } from "@/lib/jobs/workflow";
import { serviceTypeToDivision } from "@/lib/divisions";
import { toast } from "@/lib/toast";
import { AlertTriangle } from "lucide-react";

interface JobStatusButtonsProps {
  jobId: string;
  status: JobStatus;
  job?: Job;
  onUpdate?: () => void;
}

export function JobStatusButtons({ jobId, status, job, onUpdate }: JobStatusButtonsProps) {
  const { companyId } = useCompany();
  const divisionId = job
    ? job.divisionId ?? serviceTypeToDivision(job.serviceType)
    : "junk_removal";
  const flow = fieldFlowForDivision(divisionId);
  const statusKey = status as string;
  const currentIdx = flow.findIndex((s) => s.status === statusKey);
  const legacyIdx =
    status === "scheduled"
      ? 0
      : status === "in_progress"
        ? Math.max(0, flow.findIndex((s) => s.status === "loading"))
        : status === "needs_dump"
          ? Math.max(
              0,
              flow.findIndex((s) => s.status === "disposal_required" || s.status === "in_transit")
            )
          : currentIdx;
  const activeIdx = currentIdx >= 0 ? currentIdx : legacyIdx;

  if (status === "completed" || status === "cancelled") {
    return <p className="text-sm text-muted-foreground">Job finished</p>;
  }

  const completionCheck = job ? canMarkJobCompleted(job) : { ok: true as const };
  const disposalBlocked = !completionCheck.ok;
  const completeIdx = flow.length - 1;

  const handleClick = async (index: number) => {
    const next = flow[index];
    if (!next) return;
    if (index === completeIdx && job && disposalBlocked) {
      if (!completionCheck.ok) toast.error(completionCheck.message);
      return;
    }
    try {
      // Persist granular operational status; DB column is free text.
      await mutateJobStatus(companyId, jobId, next.status as JobStatus);
      onUpdate?.();
    } catch {
      /* toast shown by mutateJobStatus */
    }
  };

  return (
    <div className="space-y-2">
      {disposalBlocked && !completionCheck.ok && (
        <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {completionCheck.message}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Status: {JOB_STATUS_LABELS[status] ?? status}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {flow.map((step, i) => (
          <Button
            key={step.status}
            size="sm"
            variant={i === activeIdx ? "default" : "outline"}
            className={i === activeIdx ? "bg-brand-primary hover:bg-brand-primary/90" : ""}
            disabled={i === completeIdx && disposalBlocked}
            onClick={() => void handleClick(i)}
          >
            {step.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
