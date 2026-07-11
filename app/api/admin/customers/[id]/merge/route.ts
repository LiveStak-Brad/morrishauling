import { morrisConfig } from "@/lib/morris-config";
import { requireApiProfile } from "@/lib/api/require-profile";
import { apiOk, apiError, parseJson } from "@/lib/api/route-utils";
import { isAdmin } from "@/lib/auth/permissions";
import {
  mergeCustomers,
  previewCustomerMerge,
  type CustomerMergeChoices,
} from "@/lib/db/customer-merge";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, ctx: Ctx) {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  if (!isAdmin(profile)) return apiError("Owner access required", 403);

  const { id: primaryId } = await ctx.params;
  const secondaryId = new URL(request.url).searchParams.get("secondaryId");
  if (!secondaryId) return apiError("secondaryId required", 400);

  try {
    const preview = await previewCustomerMerge(morrisConfig.companyId, primaryId, secondaryId);
    return apiOk({ preview });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to preview merge", 400);
  }
}

export async function POST(request: Request, ctx: Ctx) {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  if (!isAdmin(profile)) return apiError("Owner access required", 403);

  const { id: primaryId } = await ctx.params;
  try {
    const body = await parseJson<{
      secondaryId: string;
      choices: CustomerMergeChoices;
      confirm: boolean;
    }>(request);

    if (!body.secondaryId) return apiError("secondaryId required", 400);
    if (!body.confirm) return apiError("confirm must be true", 400);
    if (!body.choices) return apiError("choices required", 400);

    const result = await mergeCustomers(
      morrisConfig.companyId,
      primaryId,
      body.secondaryId,
      body.choices,
      { actorProfileId: profile.id, confirm: true }
    );
    return apiOk(result);
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Merge failed", 400);
  }
}
