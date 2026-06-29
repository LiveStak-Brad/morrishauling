import { morrisConfig } from "@/lib/morris-config";
import { activateEmployee } from "@/lib/db/hr";
import { requireApiPermission } from "@/lib/api/require-profile";
import { apiOk, apiError } from "@/lib/api/route-utils";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await requireApiPermission("hr.employees.write");
  if (profile instanceof Response) return profile;
  try {
    const { id } = await params;
    await activateEmployee(morrisConfig.companyId, id, profile.id);
    return apiOk({ activated: true });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to activate employee", 500);
  }
}
