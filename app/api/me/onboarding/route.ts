import { morrisConfig } from "@/lib/morris-config";
import { getOnboardingProgress, updateOnboardingItem } from "@/lib/db/hr";
import { requireEmployeeMeContext } from "@/lib/api/require-profile";
import { apiOk, apiError, parseJson } from "@/lib/api/route-utils";

export async function GET() {
  const ctx = await requireEmployeeMeContext();
  if (ctx instanceof Response) return ctx;
  try {
    const progress = await getOnboardingProgress(morrisConfig.companyId, ctx.employeeId);
    return apiOk({ progress });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load onboarding", 500);
  }
}

export async function PATCH(request: Request) {
  const ctx = await requireEmployeeMeContext();
  if (ctx instanceof Response) return ctx;
  try {
    const body = await parseJson<{ itemId: string; status: "complete" | "waived" | "pending" }>(request);
    await updateOnboardingItem(morrisConfig.companyId, body.itemId, body.status, ctx.profile.id);
    const progress = await getOnboardingProgress(morrisConfig.companyId, ctx.employeeId);
    return apiOk({ progress });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to update onboarding", 500);
  }
}
