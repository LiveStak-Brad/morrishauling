import { morrisConfig } from "@/lib/morris-config";
import { getEmployeeDispatchStats, refreshEmployeeKpi } from "@/lib/db/hr";
import { requireApiPermission } from "@/lib/api/require-profile";
import { apiOk, apiError } from "@/lib/api/route-utils";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await requireApiPermission("hr.employees.read");
  if (profile instanceof Response) return profile;
  try {
    const { id } = await params;
    await refreshEmployeeKpi(morrisConfig.companyId, id);
    const stats = await getEmployeeDispatchStats(morrisConfig.companyId, id);
    return apiOk({ stats });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load dispatch stats", 500);
  }
}
