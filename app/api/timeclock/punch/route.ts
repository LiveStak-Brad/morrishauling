import { morrisConfig } from "@/lib/morris-config";
import { recordPunch } from "@/lib/db/hr";
import { logActivity } from "@/lib/db/activity";
import { requireApiProfile } from "@/lib/api/require-profile";
import { resolveTimeclockTarget } from "@/lib/auth/timeclock-auth";
import { apiOk, apiError, parseJson } from "@/lib/api/route-utils";
import type { PunchPayload } from "@/types/hr/time";

export async function POST(request: Request) {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  try {
    const body = await parseJson<PunchPayload>(request);
    const target = resolveTimeclockTarget(profile, body.employeeId);
    if (!target.allowed || !target.employeeId) {
      return apiError(target.error ?? "Forbidden", target.allowed ? 400 : 403);
    }

    const punchId = await recordPunch(morrisConfig.companyId, {
      ...body,
      employeeId: target.employeeId,
    });

    if (target.onBehalf) {
      await logActivity({
        companyId: morrisConfig.companyId,
        actorProfileId: profile.id,
        entityType: "employee",
        entityId: target.employeeId,
        action: "timeclock_punch_on_behalf",
        message: `Timeclock punch recorded on behalf of employee ${target.employeeId}`,
        metadata: { punchId, punchType: body.punchType },
      });
    }

    return apiOk({ punchId });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Punch failed", 500);
  }
}
