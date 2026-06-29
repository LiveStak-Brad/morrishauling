import { apiError, apiOk, parseJson } from "@/lib/api/route-utils";
import { requireApiProfile } from "@/lib/api/require-profile";
import { updateDisposalFacility } from "@/lib/db/disposal-facilities";
import type { DisposalFacility } from "@/types/disposal-management";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const profile = await requireApiProfile();
    if (profile instanceof Response) return profile;
    if (profile.role !== "admin" && profile.role !== "planner") {
      return apiError("Admin or planner access required", 403);
    }

    const { id } = await context.params;
    const body = await parseJson<{ companyId: string; updates: Partial<DisposalFacility> }>(request);
    if (!body.companyId) return apiError("companyId required", 400);

    const site = await updateDisposalFacility(body.companyId, id, body.updates ?? {});
    return apiOk({ site });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to update dump site");
  }
}
