import { apiError, apiOk, parseJson } from "@/lib/api/route-utils";
import { getCurrentProfile } from "@/lib/auth/server";
import {
  getJobsForScheduleSlot,
  getScheduleSlotById,
  updateScheduleSlot,
} from "@/lib/db/schedule-operations";
import type { ScheduleSlotInput, ScheduleSlotStatus } from "@/types/schedule";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(_request.url);
    const companyId = searchParams.get("companyId");
    if (!companyId) return apiError("companyId required", 400);

    const [slot, jobs] = await Promise.all([
      getScheduleSlotById(companyId, id),
      getJobsForScheduleSlot(companyId, id),
    ]);
    if (!slot) return apiError("Slot not found", 404);
    return apiOk({ slot, jobs });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load slot");
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const profile = await getCurrentProfile();
    if (!profile || (profile.role !== "admin" && profile.role !== "planner")) {
      return apiError("Admin access required", 403);
    }

    const { id } = await context.params;
    const body = await parseJson<{
      companyId: string;
      updates: Partial<ScheduleSlotInput> & { status?: ScheduleSlotStatus; currentJobs?: number };
    }>(request);
    if (!body.companyId) return apiError("companyId required", 400);

    const slot = await updateScheduleSlot(body.companyId, id, body.updates ?? {});
    return apiOk({ slot });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to update slot");
  }
}
