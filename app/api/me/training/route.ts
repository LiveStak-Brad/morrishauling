import { morrisConfig } from "@/lib/morris-config";
import { getAssignedCourses } from "@/lib/db/hr/training";
import { requireEmployeeMeContext } from "@/lib/api/require-profile";
import { apiOk, apiError } from "@/lib/api/route-utils";

export async function GET() {
  const ctx = await requireEmployeeMeContext();
  if (ctx instanceof Response) return ctx;
  try {
    const assigned = await getAssignedCourses(morrisConfig.companyId, ctx.employeeId);
    return apiOk({ assigned });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load training", 500);
  }
}
