import { apiError, apiOk, parseJson } from "@/lib/api/route-utils";
import { requireApiProfile } from "@/lib/api/require-profile";
import { updateOperationalTruck } from "@/lib/db/operations-depth";
import type { OperationalTruck } from "@/types/operations-depth";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const profile = await requireApiProfile();
    if (profile instanceof Response) return profile;
    if (profile.role !== "admin" && profile.role !== "planner") {
      return apiError("Admin access required", 403);
    }

    const { id } = await context.params;
    const body = await parseJson<{ companyId: string; updates: Partial<OperationalTruck> }>(request);
    if (!body.companyId) return apiError("companyId required", 400);

    const truck = await updateOperationalTruck(body.companyId, id, body.updates ?? {});
    return apiOk({ truck });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to update truck");
  }
}
