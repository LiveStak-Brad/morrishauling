import { apiError, apiOk, parseJson } from "@/lib/api/route-utils";
import { requireApiProfile } from "@/lib/api/require-profile";
import { updateCustomerCallback } from "@/lib/db/operations-depth";
import type { CallbackStatus } from "@/types/operations-depth";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const profile = await requireApiProfile();
    if (profile instanceof Response) return profile;
    if (!["admin", "planner"].includes(profile.role)) {
      return apiError("Admin or planner access required", 403);
    }

    const { id: customerId } = await context.params;
    const body = await parseJson<{
      companyId: string;
      callbackDueAt?: string | null;
      callbackNotes?: string;
      callbackStatus?: CallbackStatus;
    }>(request);

    if (!body.companyId) return apiError("companyId required", 400);

    await updateCustomerCallback(
      body.companyId,
      customerId,
      {
        callbackDueAt: body.callbackDueAt,
        callbackNotes: body.callbackNotes,
        callbackStatus: body.callbackStatus,
      },
      { actorProfileId: profile.id }
    );
    return apiOk({ ok: true });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to update callback");
  }
}
