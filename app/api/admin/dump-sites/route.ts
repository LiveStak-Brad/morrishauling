import { morrisConfig } from "@/lib/morris-config";
import { getOperationalDumpSites } from "@/lib/db/operations-depth";
import { requireApiProfile } from "@/lib/api/require-profile";
import { apiOk, apiError } from "@/lib/api/route-utils";

export async function GET() {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  if (!["admin", "planner"].includes(profile.role)) {
    return apiError("Admin access required", 403);
  }
  try {
    const sites = await getOperationalDumpSites(morrisConfig.companyId);
    return apiOk({ sites });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load dump sites", 500);
  }
}
