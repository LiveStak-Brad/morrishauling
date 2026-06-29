import { morrisConfig } from "@/lib/morris-config";
import { getDispatchReadyEmployees } from "@/lib/db/hr/dispatch-ready";
import { requireApiProfile } from "@/lib/api/require-profile";
import { isPlanner, isAdmin } from "@/lib/auth/permissions";
import { apiOk, apiError } from "@/lib/api/route-utils";

export async function GET() {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  if (!isAdmin(profile) && !isPlanner(profile) && profile.role !== "planner") {
    return apiError("Forbidden", 403);
  }
  try {
    const employees = await getDispatchReadyEmployees(morrisConfig.companyId);
    return apiOk({ employees });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load dispatch crew", 500);
  }
}
