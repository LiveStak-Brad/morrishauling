"use client";

import type { JobStatus } from "@/types/job";
import { Button } from "@/components/ui/button";
import { updateJob } from "@/lib/mock-data";
import { useCompany } from "@/lib/company-context";

const STATUS_FLOW: JobStatus[] = [
  "scheduled",
  "in_progress",
  "in_progress",
  "in_progress",
  "needs_dump",
  "completed",
];

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
  onUpdate?: () => void;
}

export function JobStatusButtons({ jobId, status, onUpdate }: JobStatusButtonsProps) {
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

  const handleClick = (index: number) => {
    updateJob(companyId, jobId, { status: nextStatuses[index] });
    onUpdate?.();
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      {BUTTON_LABELS.map((label, i) => (
        <Button
          key={label}
          size="sm"
          variant={i === flowIndex ? "default" : "outline"}
          className={i === flowIndex ? "bg-brand-primary hover:bg-brand-primary/90" : ""}
          onClick={() => handleClick(i)}
        >
          {label}
        </Button>
      ))}
    </div>
  );
}
