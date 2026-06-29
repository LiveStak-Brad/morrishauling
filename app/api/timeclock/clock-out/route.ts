import { apiError, apiOk, parseJson } from "@/lib/api/route-utils";
import { requireApiProfile } from "@/lib/api/require-profile";
import { resolveTimeclockTarget } from "@/lib/auth/timeclock-auth";
import { logActivity } from "@/lib/db/activity";
import { clockOut } from "@/lib/db/operations-depth";

export async function POST(request: Request) {
  try {
    const profile = await requireApiProfile();
    if (profile instanceof Response) return profile;

    const body = await parseJson<{ companyId: string; employeeId?: string }>(request);
    if (!body.companyId) return apiError("companyId required", 400);

    const target = resolveTimeclockTarget(profile, body.employeeId);
    if (!target.allowed || !target.employeeId) {
      return apiError(target.error ?? "Forbidden", target.allowed ? 400 : 403);
    }

    const entry = await clockOut(
      body.companyId,
      { employeeId: target.employeeId, profileId: profile.id },
      { actorProfileId: profile.id }
    );

    if (target.onBehalf) {
      await logActivity({
        companyId: body.companyId,
        actorProfileId: profile.id,
        entityType: "employee",
        entityId: target.employeeId,
        action: "timeclock_clock_out_on_behalf",
        message: `Clock-out recorded on behalf of employee ${target.employeeId}`,
      });
    }

    return apiOk({ entry });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Clock out failed");
  }
}
