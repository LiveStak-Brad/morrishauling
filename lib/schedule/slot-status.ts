import type { ScheduleSlotStatus } from "@/types/schedule";

/** Recompute slot status from capacity (unless manually closed). */
export function computeSlotStatus(
  currentJobs: number,
  maxJobs: number,
  forcedStatus?: ScheduleSlotStatus
): ScheduleSlotStatus {
  if (forcedStatus === "closed") return "closed";
  if (currentJobs >= maxJobs) return "full";
  const remaining = maxJobs - currentJobs;
  const fillRatio = currentJobs / maxJobs;
  if (fillRatio >= 0.85) return "almost_full";
  if (remaining <= 2) return "limited";
  return "available";
}

export function slotStatusLabel(status: ScheduleSlotStatus, currentJobs: number, maxJobs: number): string {
  switch (status) {
    case "available":
      return "Available";
    case "limited":
      return `Only ${Math.max(1, maxJobs - currentJobs)} spots left`;
    case "almost_full":
      return "Almost full";
    case "full":
      return "Full";
    case "closed":
      return "Closed";
  }
}
