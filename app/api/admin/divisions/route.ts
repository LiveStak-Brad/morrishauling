import { apiError, apiOk, parseJson } from "@/lib/api/route-utils";
import { requireApiProfile } from "@/lib/api/require-profile";
import { isAdmin } from "@/lib/auth/permissions";
import { listDivisions, updateDivisionLaunchStatus, isValidLaunchStatus } from "@/lib/db/divisions";
import { MORRIS_COMPANY_ID } from "@/lib/morris-config";
import type { DivisionId, DivisionLaunchStatus } from "@/lib/divisions";
import { DIVISION_LAUNCH_LABELS } from "@/lib/divisions";

export async function GET() {
  try {
    const profile = await requireApiProfile();
    if (profile instanceof Response) return profile;
    if (!isAdmin(profile) && profile.role !== "planner") {
      return apiError("Forbidden", 403);
    }
    const divisions = await listDivisions(MORRIS_COMPANY_ID);
    return apiOk({
      divisions,
      labels: DIVISION_LAUNCH_LABELS,
      warning:
        "Setting a division to accepting_bookings enables live appointment booking for that division when global booking flags allow it.",
    });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load divisions");
  }
}

export async function PATCH(request: Request) {
  try {
    const profile = await requireApiProfile();
    if (profile instanceof Response) return profile;
    if (!isAdmin(profile)) return apiError("Only the owner can change launch status", 403);

    const body = await parseJson<{
      divisionId: DivisionId;
      launchStatus: DivisionLaunchStatus;
      confirmLiveBookings?: boolean;
    }>(request);

    if (!body.divisionId || !body.launchStatus) {
      return apiError("divisionId and launchStatus required", 400);
    }
    if (!isValidLaunchStatus(body.launchStatus)) {
      return apiError("Invalid launch status", 400);
    }
    if (body.launchStatus === "accepting_bookings" && !body.confirmLiveBookings) {
      return apiError(
        "Confirm live bookings by setting confirmLiveBookings=true. This opens real appointment booking for the division.",
        400
      );
    }

    const updated = await updateDivisionLaunchStatus({
      companyId: MORRIS_COMPANY_ID,
      divisionId: body.divisionId,
      launchStatus: body.launchStatus,
      actorProfileId: profile.id,
    });

    if (!updated) return apiError("Division not found", 404);
    return apiOk({ division: updated });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to update launch status");
  }
}
