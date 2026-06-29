import { morrisConfig } from "@/lib/morris-config";
import { getTrainingMatrix } from "@/lib/db/hr/training";
import { requireApiPermission } from "@/lib/api/require-profile";
import { apiOk, apiError } from "@/lib/api/route-utils";

export async function GET() {
  const profile = await requireApiPermission("training.manage");
  if (profile instanceof Response) return profile;
  try {
    const matrix = await getTrainingMatrix(morrisConfig.companyId);
    return apiOk({ matrix });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load matrix", 500);
  }
}
