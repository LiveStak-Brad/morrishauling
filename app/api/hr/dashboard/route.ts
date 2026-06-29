import { morrisConfig } from "@/lib/morris-config";
import { getHrDashboardStats } from "@/lib/db/hr";
import { requireApiPermission } from "@/lib/api/require-profile";
import { apiOk, apiError } from "@/lib/api/route-utils";

export async function GET() {
  const profile = await requireApiPermission("hr.employees.read");
  if (profile instanceof Response) return profile;
  try {
    const stats = await getHrDashboardStats(morrisConfig.companyId);
    return apiOk({ stats });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load dashboard", 500);
  }
}
