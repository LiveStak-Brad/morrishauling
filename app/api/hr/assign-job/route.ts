import { morrisConfig } from "@/lib/morris-config";
import { assignJobToEmployee } from "@/lib/db/operations";
import { requireApiPermission } from "@/lib/api/require-profile";
import { apiOk, apiError, parseJson } from "@/lib/api/route-utils";

export async function POST(request: Request) {
  const profile = await requireApiPermission("schedule.manage");
  if (profile instanceof Response) return profile;
  try {
    const body = await parseJson<{ jobId: string; employeeId: string; role?: string }>(request);
    if (!body.jobId || !body.employeeId) return apiError("jobId and employeeId required", 400);
    await assignJobToEmployee(morrisConfig.companyId, body.jobId, body.employeeId, (body.role as "driver" | "helper" | "lead") ?? "helper");
    return apiOk({ assigned: true });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Assignment failed", 500);
  }
}
