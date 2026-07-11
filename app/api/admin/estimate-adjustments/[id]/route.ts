import { morrisConfig } from "@/lib/morris-config";
import { requireApiProfile } from "@/lib/api/require-profile";
import { apiOk, apiError, parseJson } from "@/lib/api/route-utils";
import { approveOnSiteAdjustment } from "@/lib/db/billing-operations";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  if (!["admin", "planner", "employee"].includes(profile.role)) {
    return apiError("Staff access required", 403);
  }
  const { id } = await ctx.params;
  try {
    const body = await parseJson<{
      decision: "approved" | "declined";
      method: string;
      approvedBy: string;
      note?: string;
    }>(request);
    if (!body.decision || !body.method || !body.approvedBy) {
      return apiError("decision, method, and approvedBy are required", 400);
    }
    const result = await approveOnSiteAdjustment(morrisConfig.companyId, id, body, {
      actorProfileId: profile.id,
      actorRole: profile.role,
    });
    return apiOk(result);
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to update adjustment", 500);
  }
}
