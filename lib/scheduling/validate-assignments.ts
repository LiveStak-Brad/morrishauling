import type { Job } from "@/types/job";
import type { HrEmployee } from "@/types/hr/employee";
import type { OperationalTruck } from "@/types/operations-depth";
import { findAssignmentConflicts, type AssignmentConflict } from "@/lib/scheduling/assignment-conflicts";
import { serviceTypeToDivision } from "@/lib/divisions";

export type AssignmentHardBlock =
  | "employee_inactive"
  | "employee_unqualified"
  | "driver_license"
  | "equipment_maintenance"
  | "equipment_unavailable"
  | "capacity"
  | "compatibility";

export type AssignmentSoftConflict = AssignmentConflict & {
  overridable: true;
};

export type AssignmentValidationResult = {
  ok: boolean;
  hardBlocks: Array<{ code: AssignmentHardBlock; message: string }>;
  softConflicts: AssignmentSoftConflict[];
};

const DRIVER_ROLES = new Set(["driver", "lead", "admin", "owner", "manager"]);
const MAINTENANCE_STATUSES = new Set(["maintenance", "out_of_service", "down", "repair"]);

function isActiveEmployee(e: HrEmployee | undefined): boolean {
  return Boolean(e && e.lifecycleStatus === "active");
}

function employeeQualifiedForJob(e: HrEmployee, job: Job): boolean {
  const role = (e.role ?? "").toLowerCase();
  // Helpers and leads can work either division; drivers can too unless role is office-only.
  if (["office", "hr", "office_admin"].includes(role)) return false;
  const division = job.divisionId ?? serviceTypeToDivision(job.serviceType);
  // If employee has managed/primary division metadata in future, enforce here.
  void division;
  return true;
}

function unitUnavailable(unit?: OperationalTruck | null): string | null {
  if (!unit) return "Equipment not found";
  const status = (unit.status ?? unit.maintenanceStatus ?? "").toLowerCase();
  if (MAINTENANCE_STATUSES.has(status) || unit.maintenanceStatus === "due_soon" || unit.maintenanceStatus === "overdue") {
    return `${unit.name} is in maintenance / unavailable (${unit.maintenanceStatus ?? unit.status})`;
  }
  if (status === "retired" || status === "sold") {
    return `${unit.name} is not available for assignment`;
  }
  return null;
}

/** Soft day conflicts are overridable; hard safety/availability blocks are not. */
export function validateJobAssignments(input: {
  job: Job;
  allJobs: Job[];
  employees: HrEmployee[];
  trucks: OperationalTruck[];
  trailers: OperationalTruck[];
  assignedEmployeeIds: string[];
  driverEmployeeId?: string | null;
  assignedTruckId?: string | null;
  assignedTrailerId?: string | null;
  scheduledDate?: string;
}): AssignmentValidationResult {
  const hardBlocks: AssignmentValidationResult["hardBlocks"] = [];
  const empById = new Map(input.employees.map((e) => [e.id, e]));
  const truckById = new Map(input.trucks.map((t) => [t.id, t]));
  const trailerById = new Map(input.trailers.map((t) => [t.id, t]));

  for (const id of input.assignedEmployeeIds) {
    const emp = empById.get(id);
    if (!isActiveEmployee(emp)) {
      hardBlocks.push({
        code: "employee_inactive",
        message: `Employee ${emp ? `${emp.firstName} ${emp.lastName}` : id} is not active.`,
      });
      continue;
    }
    if (!employeeQualifiedForJob(emp!, input.job)) {
      hardBlocks.push({
        code: "employee_unqualified",
        message: `${emp!.firstName} ${emp!.lastName} is not qualified for this job type.`,
      });
    }
  }

  if (input.driverEmployeeId) {
    const driver = empById.get(input.driverEmployeeId);
    if (!isActiveEmployee(driver)) {
      hardBlocks.push({
        code: "employee_inactive",
        message: "Selected driver is not an active employee.",
      });
    } else {
      const role = (driver!.role ?? "").toLowerCase();
      if (!DRIVER_ROLES.has(role) && !input.assignedEmployeeIds.includes(driver!.id)) {
        // Allow any active crew member marked as driver, but warn via soft path if not driver role
      }
      if (["office", "hr", "office_admin"].includes(role)) {
        hardBlocks.push({
          code: "driver_license",
          message: `${driver!.firstName} ${driver!.lastName} cannot be assigned as driver.`,
        });
      }
      // Prefer driver/lead roles for hauling
      const division = input.job.divisionId ?? serviceTypeToDivision(input.job.serviceType);
      if (division === "hauling" && !DRIVER_ROLES.has(role)) {
        hardBlocks.push({
          code: "driver_license",
          message: `Hauling jobs require a driver/lead. ${driver!.firstName} ${driver!.lastName} role is "${driver!.role}".`,
        });
      }
    }
  }

  if (input.assignedTruckId) {
    const truck = truckById.get(input.assignedTruckId);
    const reason = unitUnavailable(truck);
    if (reason) {
      hardBlocks.push({ code: "equipment_maintenance", message: reason });
    }
  }

  if (input.assignedTrailerId) {
    const trailer = trailerById.get(input.assignedTrailerId);
    const reason = unitUnavailable(trailer);
    if (reason) {
      hardBlocks.push({ code: "equipment_maintenance", message: reason });
    }
  }

  // Basic compatibility: both assigned and neither in maintenance already checked.
  // Capacity: if hauling and trailer capacity string looks insufficient vs notes — soft only for now.
  if (input.assignedTruckId && input.assignedTrailerId) {
    const truck = truckById.get(input.assignedTruckId);
    const trailer = trailerById.get(input.assignedTrailerId);
    if (truck && trailer) {
      const truckStatus = (truck.status ?? "").toLowerCase();
      const trailerStatus = (trailer.status ?? "").toLowerCase();
      if (truckStatus === "incompatible" || trailerStatus === "incompatible") {
        hardBlocks.push({
          code: "compatibility",
          message: "Selected truck and trailer are marked incompatible.",
        });
      }
    }
  }

  // Capacity: if trailer capacity is numeric and job load exceeds it — hard block.
  if (input.assignedTrailerId) {
    const trailer = trailerById.get(input.assignedTrailerId);
    const capRaw = trailer?.capacity?.replace(/[^\d.]/g, "");
    const cap = capRaw ? Number(capRaw) : NaN;
    const loadPct =
      input.job.estimate?.trailerPercent ??
      ({ min_10: 10, quarter_25: 25, half_50: 50, three_quarter_75: 75, full_100: 100, multi_150: 150 }[
        input.job.loadSizeTier
      ] ?? 25);
    // Capacity strings like "100%" or "14" — only enforce when clearly a percent capacity.
    if (trailer?.capacity?.includes("%") && Number.isFinite(cap) && loadPct > cap) {
      hardBlocks.push({
        code: "capacity",
        message: `Load (${loadPct}%) exceeds trailer capacity (${trailer.capacity}).`,
      });
    }
  }

  // Hauling: require trailer when truck assigned for transport jobs.
  const division = input.job.divisionId ?? serviceTypeToDivision(input.job.serviceType);
  if (division === "hauling" && input.assignedTruckId && !input.assignedTrailerId) {
    // Soft guidance only — some hauling may be truck-only; leave as soft via message in UI.
  }

  const dayConflicts = findAssignmentConflicts({
    jobs: input.allJobs,
    jobId: input.job.id,
    scheduledDate: input.scheduledDate ?? input.job.scheduledDate,
    assignedEmployeeIds: input.assignedEmployeeIds,
    assignedTruckId: input.assignedTruckId,
    assignedTrailerId: input.assignedTrailerId,
  }).map((c) => ({ ...c, overridable: true as const }));

  return {
    ok: hardBlocks.length === 0 && dayConflicts.length === 0,
    hardBlocks,
    softConflicts: dayConflicts,
  };
}

export function nextJobAction(
  job: Job,
  hasInvoice: boolean,
  invoiceUnpaid?: boolean,
  missingPhotos?: string[]
): string {
  if (["cancelled", "canceled"].includes(job.status)) return "Job canceled";
  if (!job.scheduledDate) return "Waiting for schedule";
  if (!(job.assignedEmployeeIds?.length)) return "Crew not assigned";
  if (!job.assignedTruckId) return "Truck not assigned";
  if (!job.assignedTrailerId) return "Trailer not assigned";
  if (job.status === "completed") {
    if (!hasInvoice) return "Ready to invoice";
    if (invoiceUnpaid) return "Invoice unpaid";
    return "Complete";
  }
  if (missingPhotos?.length) {
    return `Completion photos missing: ${missingPhotos.join(", ")}`;
  }
  if (["submitted", "estimated", "scheduled"].includes(job.status)) return "Start / dispatch job";
  return "Complete with required proof";
}
