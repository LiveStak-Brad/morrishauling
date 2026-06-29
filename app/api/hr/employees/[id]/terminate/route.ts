import { morrisConfig } from "@/lib/morris-config";
import { terminateEmployee } from "@/lib/db/hr";
import { requireApiPermission } from "@/lib/api/require-profile";
import { apiOk, apiError, parseJson } from "@/lib/api/route-utils";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await requireApiPermission("hr.employees.terminate");
  if (profile instanceof Response) return profile;
  try {
    const { id } = await params;
    const { reason } = await parseJson<{ reason: string }>(request);
    if (!reason) return apiError("reason required", 400);
    await terminateEmployee(morrisConfig.companyId, id, reason, profile.id);
    return apiOk({ terminated: true });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to terminate employee", 500);
  }
}
