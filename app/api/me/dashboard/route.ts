import { morrisConfig } from "@/lib/morris-config";
import { getEmployeeDashboard } from "@/lib/db/hr/employee-portal";
import { requireEmployeeMeContext } from "@/lib/api/require-profile";
import { apiOk, apiError } from "@/lib/api/route-utils";

export async function GET() {
  const ctx = await requireEmployeeMeContext();
  if (ctx instanceof Response) return ctx;
  try {
    const dashboard = await getEmployeeDashboard(morrisConfig.companyId, ctx.employeeId);
    if (!dashboard) return apiError("Employee record not found", 404);
    return apiOk({ dashboard });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load dashboard", 500);
  }
}
