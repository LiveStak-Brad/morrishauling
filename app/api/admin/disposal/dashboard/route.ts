import { morrisConfig } from "@/lib/morris-config";
import { getDisposalDashboard } from "@/lib/db/disposal-dashboard";
import { requireApiProfile } from "@/lib/api/require-profile";
import { apiOk, apiError } from "@/lib/api/route-utils";

export async function GET() {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  if (!["admin", "planner"].includes(profile.role)) {
    return apiError("Admin access required", 403);
  }
  try {
    const dashboard = await getDisposalDashboard(morrisConfig.companyId);
    return apiOk(dashboard);
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load disposal dashboard", 500);
  }
}
