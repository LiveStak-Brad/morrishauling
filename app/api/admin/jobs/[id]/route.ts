import { morrisConfig } from "@/lib/morris-config";
import { requireApiProfile } from "@/lib/api/require-profile";
import { apiOk, apiError, parseJson } from "@/lib/api/route-utils";
import { getJobById, updateJob, getInvoices, getJobs } from "@/lib/db/operations";
import { listEstimates } from "@/lib/db/billing-operations";
import { getHrEmployees } from "@/lib/db/hr/employees";
import { getOperationalTrucks, getOperationalTrailers } from "@/lib/db/operations-depth";
import { getScheduleSlots } from "@/lib/db/schedule-operations";
import { canMarkJobCompleted } from "@/lib/disposal/disposal-requirements";
import { missingRequiredPhotos, requiredPhotoStagesForCompletion } from "@/lib/jobs/workflow";
import { serviceTypeToDivision } from "@/lib/divisions";
import { nextJobAction, validateJobAssignments } from "@/lib/scheduling/validate-assignments";
import { businessDateString } from "@/lib/datetime/business-timezone";
import type { Job } from "@/types/job";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  if (!["admin", "planner"].includes(profile.role)) {
    return apiError("Admin access required", 403);
  }
  const { id } = await ctx.params;
  try {
    const companyId = morrisConfig.companyId;
    const [job, estimates, invoices, employees, trucks, trailerRows, slots] = await Promise.all([
      getJobById(companyId, id),
      listEstimates(companyId),
      getInvoices(companyId),
      getHrEmployees(companyId, { lifecycleStatus: "active" }).catch(() => []),
      getOperationalTrucks(companyId).catch(() => []),
      getOperationalTrailers(companyId).catch(() => []),
      getScheduleSlots(companyId, {
        fromDate: businessDateString(),
      }).catch(() => []),
    ]);
    if (!job) return apiError("Job not found", 404);

    const trailers = (
      trailerRows as Array<{
        id: string;
        name: string;
        status?: string;
        licensePlate?: string;
      }>
    ).map((t) => ({
      id: t.id,
      companyId,
      name: t.name,
      licensePlate: t.licensePlate,
      maintenanceStatus:
        t.status === "maintenance" || t.status === "out_of_service"
          ? ("out_of_service" as const)
          : ("good" as const),
      status: t.status,
    }));

    const estimate = estimates.find((e) => e.jobId === id) ?? null;
    const invoice =
      invoices.find((i) => i.jobId === id && i.status !== "void") ?? null;
    const divisionId = job.divisionId ?? serviceTypeToDivision(job.serviceType);
    const proof = canMarkJobCompleted(job);
    const missingPhotos = missingRequiredPhotos(job, divisionId);
    const nextAction = nextJobAction(
      job,
      Boolean(invoice),
      Boolean(invoice && invoice.balanceDue > 0),
      missingPhotos
    );

    const preview = validateJobAssignments({
      job,
      allJobs: await getJobs(companyId),
      employees,
      trucks,
      trailers,
      assignedEmployeeIds: job.assignedEmployeeIds ?? [],
      driverEmployeeId: job.driverEmployeeId,
      assignedTruckId: job.assignedTruckId,
      assignedTrailerId: job.assignedTrailerId,
      scheduledDate: job.scheduledDate,
    });

    return apiOk({
      job,
      estimate,
      invoice,
      employees,
      trucks,
      trailers,
      scheduleSlots: slots,
      proof,
      missingPhotos,
      requiredPhotoStages: requiredPhotoStagesForCompletion(divisionId),
      nextAction,
      assignmentPreview: preview,
    });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load job", 500);
  }
}

export async function PATCH(request: Request, ctx: Ctx) {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  if (!["admin", "planner"].includes(profile.role)) {
    return apiError("Admin access required", 403);
  }
  const { id } = await ctx.params;
  try {
    const body = await parseJson<{
      status?: Job["status"];
      scheduledDate?: string | null;
      scheduledWindowLabel?: string | null;
      selectedScheduleSlotId?: string | null;
      estimatedDurationMinutes?: number | null;
      assignedEmployeeIds?: string[];
      driverEmployeeId?: string | null;
      assignedTruckId?: string | null;
      assignedTrailerId?: string | null;
      assignmentOverrideReason?: string;
      completionOverrideReason?: string;
      flexibleDiscountAmount?: number;
    }>(request);

    const updates: Partial<Job> = {};
    if (body.status !== undefined) updates.status = body.status;
    if (body.scheduledDate !== undefined) updates.scheduledDate = body.scheduledDate ?? undefined;
    if (body.scheduledWindowLabel !== undefined) {
      updates.scheduledWindowLabel = body.scheduledWindowLabel ?? undefined;
    }
    if (body.selectedScheduleSlotId !== undefined) {
      updates.selectedScheduleSlotId = body.selectedScheduleSlotId ?? undefined;
    }
    if (body.estimatedDurationMinutes !== undefined) {
      updates.estimatedDurationMinutes = body.estimatedDurationMinutes ?? undefined;
    }
    if (body.assignedEmployeeIds !== undefined) {
      updates.assignedEmployeeIds = body.assignedEmployeeIds;
    }
    if (body.driverEmployeeId !== undefined) {
      updates.driverEmployeeId = body.driverEmployeeId ?? undefined;
    }
    if (body.assignedTruckId !== undefined) {
      updates.assignedTruckId = body.assignedTruckId ?? undefined;
    }
    if (body.assignedTrailerId !== undefined) {
      updates.assignedTrailerId = body.assignedTrailerId ?? undefined;
    }
    if (body.flexibleDiscountAmount !== undefined) {
      updates.flexibleDiscountAmount = body.flexibleDiscountAmount;
    }
    if (body.completionOverrideReason !== undefined) {
      updates.completionOverrideReason = body.completionOverrideReason;
      updates.completionOverrideBy = profile.id;
      updates.completionOverrideAt = new Date().toISOString();
    }

    // Completing via this route still goes through status API proof rules when status set.
    if (body.status === "completed") {
      const existing = await getJobById(morrisConfig.companyId, id);
      if (!existing) return apiError("Job not found", 404);
      const check = canMarkJobCompleted(existing, {
        managerOverride: Boolean(body.completionOverrideReason?.trim()),
        overrideReason: body.completionOverrideReason,
      });
      if (!check.ok) {
        return apiError(check.message, 409);
      }
    }

    const job = await updateJob(morrisConfig.companyId, id, updates, {
      actorProfileId: profile.id,
      actorRole: profile.role,
      assignmentOverrideReason: body.assignmentOverrideReason,
    });
    if (!job) return apiError("Job not found", 404);
    return apiOk({ job });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to update job", 400);
  }
}
