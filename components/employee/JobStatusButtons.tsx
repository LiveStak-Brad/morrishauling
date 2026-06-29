"use client";

import type { Job } from "@/types/job";
import type { JobStatus } from "@/types/job";
import { Button } from "@/components/ui/button";
import { mutateJobStatus } from "@/lib/api/mutations";
import { useCompany } from "@/lib/company-context";
import { canMarkJobCompleted } from "@/lib/disposal/disposal-requirements";
import { toast } from "@/lib/toast";
import { AlertTriangle } from "lucide-react";

const BUTTON_LABELS = [
  "Start route",
  "Arrived",
  "Started loading",
  "Completed loading",
  "Needs dump run",
  "Job completed",
];

interface JobStatusButtonsProps {
  jobId: string;
  status: JobStatus;
  job?: Job;
  onUpdate?: () => void;
}

export function JobStatusButtons({ jobId, status, job, onUpdate }: JobStatusButtonsProps) {
  const { companyId } = useCompany();

  const flowIndex = {
    scheduled: 0,
    in_progress: 1,
    needs_dump: 4,
  }[status as string] ?? -1;

  if (status === "completed" || status === "cancelled") {
    return <p className="text-sm text-muted-foreground">Job finished</p>;
  }

  const nextStatuses: JobStatus[] = [
    "in_progress",
    "in_progress",
    "in_progress",
    "in_progress",
    "needs_dump",
    "completed",
  ];

  const disposalBlocked = job ? !canMarkJobCompleted(job).ok : false;

  const handleClick = async (index: number) => {
    if (index === 5 && job && disposalBlocked) {
      const check = canMarkJobCompleted(job);
      if (!check.ok) toast.error(check.message);
      return;
    }
    try {
      await mutateJobStatus(companyId, jobId, nextStatuses[index]);
      onUpdate?.();
    } catch {
      /* toast shown by mutateJobStatus */
    }
  };

  return (
    <div className="space-y-2">
      {disposalBlocked && status === "needs_dump" && (
        <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          Complete disposal below before marking this job finished.
        </p>
      )}
      <div className="grid grid-cols-2 gap-2">
        {BUTTON_LABELS.map((label, i) => (
          <Button
            key={label}
            size="sm"
            variant={i === flowIndex ? "default" : "outline"}
            className={i === flowIndex ? "bg-brand-primary hover:bg-brand-primary/90" : ""}
            disabled={i === 5 && disposalBlocked}
            onClick={() => void handleClick(i)}
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}
