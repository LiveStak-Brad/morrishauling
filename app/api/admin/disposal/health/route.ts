import { morrisConfig } from "@/lib/morris-config";
import { checkDisposalSchemaHealth } from "@/lib/disposal/disposal-schema-health";
import { requireApiProfile } from "@/lib/api/require-profile";
import { apiOk, apiError } from "@/lib/api/route-utils";

export async function GET() {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  if (profile.role !== "admin") return apiError("Admin access required", 403);
  try {
    const health = await checkDisposalSchemaHealth();
    return apiOk({ health, companyId: morrisConfig.companyId });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Health check failed", 500);
  }
}
