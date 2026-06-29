import { morrisConfig } from "@/lib/morris-config";
import { getOnboardingProgress, updateOnboardingItem } from "@/lib/db/hr";
import { requireApiPermission, requireApiProfile } from "@/lib/api/require-profile";
import { apiOk, apiError, parseJson } from "@/lib/api/route-utils";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  try {
    const { id } = await params;
    const progress = await getOnboardingProgress(morrisConfig.companyId, id);
    return apiOk({ progress });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load onboarding", 500);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  try {
    const { id: employeeId } = await params;
    const body = await parseJson<{ itemId: string; status: "complete" | "waived" | "pending"; waivedReason?: string }>(request);
    await updateOnboardingItem(morrisConfig.companyId, body.itemId, body.status, profile.id, body.waivedReason);
    const progress = await getOnboardingProgress(morrisConfig.companyId, employeeId);
    return apiOk({ progress });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to update onboarding", 500);
  }
}
