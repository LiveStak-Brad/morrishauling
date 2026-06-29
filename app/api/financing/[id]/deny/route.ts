import { apiError, apiOk, parseJson } from "@/lib/api/route-utils";
import { requireApiRole } from "@/lib/api/require-profile";
import { denyFinancingRequest } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const profile = await requireApiRole(["admin"]);
    if (profile instanceof Response) return profile;

    const { id } = await params;
    const body = await parseJson<{
      companyId: string;
      reason?: string;
      internalNotes?: string;
    }>(request);

    if (!body.companyId) return apiError("companyId required", 400);

    const request_ = await denyFinancingRequest(body.companyId, id, body.reason, {
      internalNotes: body.internalNotes,
      actorProfileId: profile.id,
    });
    if (!request_) return apiError("Financing request not found", 404);

    return apiOk({ request: request_ });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to deny financing");
  }
}
