import { apiError, apiOk, parseJson } from "@/lib/api/route-utils";
import { requireApiRole } from "@/lib/api/require-profile";
import { createFinancingRequest } from "@/lib/db";
import type { FinancingRequestInput } from "@/types/financing";

export async function POST(request: Request) {
  try {
    const profile = await requireApiRole(["customer"]);
    if (profile instanceof Response) return profile;

    const body = await parseJson<FinancingRequestInput>(request);

    if (!body.companyId || !body.jobId) {
      return apiError("companyId and jobId required", 400);
    }

    const customerId = profile.customer_id;
    if (!customerId) return apiError("Customer record not found", 403);

    const request_ = await createFinancingRequest(
      body.companyId,
      {
        ...body,
        customerId,
        status: "pending",
        riskScore: Math.floor(Math.random() * 40) + 50,
        paymentSchedule: [],
      },
      { actorProfileId: profile.id }
    );

    return apiOk({ request: request_ });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to create financing request");
  }
}
