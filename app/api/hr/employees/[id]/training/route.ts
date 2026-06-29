import { morrisConfig } from "@/lib/morris-config";
import { getEmployeeTrainingSummary } from "@/lib/db/hr/training";
import { requireApiPermission } from "@/lib/api/require-profile";
import { apiOk, apiError } from "@/lib/api/route-utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const profile = await requireApiPermission("training.manage");
  if (profile instanceof Response) return profile;
  const { id } = await params;
  try {
    const training = await getEmployeeTrainingSummary(morrisConfig.companyId, id);
    return apiOk({ training });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load employee training", 500);
  }
}
