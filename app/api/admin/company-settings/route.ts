import { morrisConfig } from "@/lib/morris-config";
import {
  getCompanySettingsMap,
  upsertCompanySetting,
  getAllEffectiveSettings,
} from "@/lib/db/company-settings";
import { requireApiProfile } from "@/lib/api/require-profile";
import { apiOk, apiError, parseJson } from "@/lib/api/route-utils";

export async function GET() {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  if (profile.role !== "admin") return apiError("Admin access required", 403);
  try {
    const [settings, effective] = await Promise.all([
      getCompanySettingsMap(morrisConfig.companyId),
      getAllEffectiveSettings(morrisConfig.companyId),
    ]);
    return apiOk({ settings, pricing: effective.pricing, effective });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load settings", 500);
  }
}

export async function PATCH(request: Request) {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  if (profile.role !== "admin") return apiError("Admin access required", 403);
  try {
    const body = await parseJson<{ key: string; value: unknown }>(request);
    if (!body.key) return apiError("key required", 400);
    await upsertCompanySetting(morrisConfig.companyId, body.key, body.value);
    return apiOk({ saved: true });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to save setting", 500);
  }
}
