import { apiError, apiOk, parseJson } from "@/lib/api/route-utils";
import { getCurrentProfile } from "@/lib/auth/server";
import { createScheduleSlot } from "@/lib/db/schedule-operations";
import type { ScheduleSlotInput } from "@/types/schedule";

export async function POST(request: Request) {
  try {
    const profile = await getCurrentProfile();
    if (!profile || (profile.role !== "admin" && profile.role !== "planner")) {
      return apiError("Admin access required", 403);
    }

    const body = await parseJson<{ companyId: string; slot: ScheduleSlotInput }>(request);
    if (!body.companyId || !body.slot) return apiError("companyId and slot required", 400);

    const slot = await createScheduleSlot(body.companyId, body.slot);
    return apiOk({ slot });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to create slot");
  }
}
