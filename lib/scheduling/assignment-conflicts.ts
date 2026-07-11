import type { Job } from "@/types/job";

const ACTIVE: Set<string> = new Set([
  "scheduled",
  "crew_assigned",
  "driver_assigned",
  "equipment_assigned",
  "en_route",
  "arrived",
  "loading",
  "disposal_required",
  "needs_dump",
  "traveling_to_disposal",
  "disposed",
  "returning",
  "traveling_to_pickup",
  "arrived_at_pickup",
  "secured",
  "in_transit",
  "arrived_at_delivery",
  "unloading",
  "delivery_proof_captured",
  "in_progress",
]);

function sameDay(a?: string, b?: string): boolean {
  if (!a || !b) return true; // if either missing date, treat as potential conflict
  return a.slice(0, 10) === b.slice(0, 10);
}

export type AssignmentConflict = {
  type: "employee" | "truck" | "trailer";
  resourceId: string;
  conflictingJobId: string;
  message: string;
};

/**
 * Prevent double-booking employees, trucks, and trailers on the same day
 * for active operational jobs.
 */
export function findAssignmentConflicts(input: {
  jobs: Job[];
  jobId: string;
  scheduledDate?: string;
  assignedEmployeeIds?: string[];
  assignedTruckId?: string | null;
  assignedTrailerId?: string | null;
}): AssignmentConflict[] {
  const conflicts: AssignmentConflict[] = [];
  const date = input.scheduledDate;
  const others = input.jobs.filter(
    (j) => j.id !== input.jobId && ACTIVE.has(j.status) && sameDay(j.scheduledDate, date)
  );

  for (const empId of input.assignedEmployeeIds ?? []) {
    for (const j of others) {
      if (j.assignedEmployeeIds?.includes(empId)) {
        conflicts.push({
          type: "employee",
          resourceId: empId,
          conflictingJobId: j.id,
          message: `Employee ${empId} is already assigned to job ${j.id} on this day.`,
        });
      }
    }
  }

  if (input.assignedTruckId) {
    for (const j of others) {
      if (j.assignedTruckId === input.assignedTruckId) {
        conflicts.push({
          type: "truck",
          resourceId: input.assignedTruckId,
          conflictingJobId: j.id,
          message: `Truck ${input.assignedTruckId} is already assigned to job ${j.id} on this day.`,
        });
      }
    }
  }

  if (input.assignedTrailerId) {
    for (const j of others) {
      if (j.assignedTrailerId === input.assignedTrailerId) {
        conflicts.push({
          type: "trailer",
          resourceId: input.assignedTrailerId,
          conflictingJobId: j.id,
          message: `Trailer ${input.assignedTrailerId} is already assigned to job ${j.id} on this day.`,
        });
      }
    }
  }

  return conflicts;
}
