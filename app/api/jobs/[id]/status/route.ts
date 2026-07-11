import { apiError, apiOk, parseJson } from "@/lib/api/route-utils";
import { requireApiProfile } from "@/lib/api/require-profile";
import { canAccessJob } from "@/lib/auth/permissions";
import { getJobById, updateJob, updateJobStatus } from "@/lib/db";
import { canMarkJobCompleted } from "@/lib/disposal/disposal-requirements";
import type { Job } from "@/types";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const profile = await requireApiProfile();
    if (profile instanceof Response) return profile;

    const { id } = await params;
    const body = await parseJson<{
      companyId: string;
      status?: Job["status"];
      updates?: Partial<Job>;
    }>(request);

    if (!body.companyId) return apiError("companyId required", 400);

    const job = await getJobById(body.companyId, id);
    if (!job) return apiError("Job not found", 404);

    if (!canAccessJob(profile, job, job.assignedEmployeeIds)) {
      return apiError("Forbidden", 403);
    }

    if (profile.role === "employee") {
      const allowedFields = new Set([
        "status",
        "photos",
        "notes",
        "paymentStatus",
        "collectedAmount",
      ]);
      if (body.updates) {
        const keys = Object.keys(body.updates);
        if (keys.some((k) => !allowedFields.has(k))) {
          return apiError("Employees can only update status, photos, notes, and payment fields", 403);
        }
      }
    }

    let updated: Job | undefined;
    if (body.status) {
      if (body.status === "completed") {
        const overrideReason =
          typeof body.updates?.completionOverrideReason === "string"
            ? body.updates.completionOverrideReason
            : undefined;
        const managerOverride =
          (profile.role === "admin" || profile.role === "planner") && Boolean(overrideReason?.trim());
        const completionCheck = canMarkJobCompleted(job, {
          managerOverride,
          overrideReason,
        });
        if (!completionCheck.ok) {
          return apiError(completionCheck.message, 409);
        }
        if (managerOverride && overrideReason) {
          body.updates = {
            ...body.updates,
            completionOverrideReason: overrideReason,
            completionOverrideBy: profile.id,
            completionOverrideAt: new Date().toISOString(),
          };
        }
      }
      updated = await updateJobStatus(body.companyId, id, body.status, {
        actorProfileId: profile.id,
        updates: body.updates,
      });
    } else if (body.updates) {
      const overrideReason =
        typeof (body as { assignmentOverrideReason?: string }).assignmentOverrideReason === "string"
          ? (body as { assignmentOverrideReason?: string }).assignmentOverrideReason
          : undefined;
      updated = await updateJob(body.companyId, id, body.updates, {
        actorProfileId: profile.id,
        actorRole: profile.role,
        assignmentOverrideReason: overrideReason,
      });
    } else {
      return apiError("status or updates required", 400);
    }

    if (!updated) return apiError("Job not found", 404);
    return apiOk({ job: updated });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to update job");
  }
}
