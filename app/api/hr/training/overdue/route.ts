import { morrisConfig } from "@/lib/morris-config";
import { getOverdueTraining, getExpiringTraining } from "@/lib/db/hr/training";
import { requireApiPermission } from "@/lib/api/require-profile";
import { apiOk, apiError } from "@/lib/api/route-utils";

export async function GET(request: Request) {
  const profile = await requireApiPermission("training.manage");
  if (profile instanceof Response) return profile;
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "overdue";
  try {
    if (type === "expiring") {
      const days = Number(searchParams.get("days") ?? 30);
      const expiring = await getExpiringTraining(morrisConfig.companyId, days);
      return apiOk({ expiring });
    }
    const overdue = await getOverdueTraining(morrisConfig.companyId);
    return apiOk({ overdue });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load overdue training", 500);
  }
}
