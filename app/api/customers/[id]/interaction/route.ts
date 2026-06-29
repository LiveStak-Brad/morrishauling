import { apiError, apiOk, parseJson } from "@/lib/api/route-utils";
import { requireApiProfile } from "@/lib/api/require-profile";
import { createCustomerInteraction } from "@/lib/db/operations-depth";
import type { CustomerInteraction } from "@/types/operations-depth";

export async function POST(
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
      interactionType: CustomerInteraction["interactionType"];
      direction?: CustomerInteraction["direction"];
      subject?: string;
      body?: string;
      followUpAt?: string;
    }>(request);

    if (!body.companyId || !body.interactionType) {
      return apiError("companyId and interactionType required", 400);
    }

    const interaction = await createCustomerInteraction(
      body.companyId,
      {
        customerId,
        profileId: profile.id,
        interactionType: body.interactionType,
        direction: body.direction ?? "outbound",
        subject: body.subject,
        body: body.body,
        followUpAt: body.followUpAt,
      },
      { actorProfileId: profile.id }
    );
    return apiOk({ interaction });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to create interaction");
  }
}
