import { morrisConfig } from "@/lib/morris-config";
import { getDisposalReportingSummary } from "@/lib/db/disposal-facilities";
import { requireApiProfile } from "@/lib/api/require-profile";
import { apiOk, apiError } from "@/lib/api/route-utils";

export async function GET() {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  if (!["admin", "planner"].includes(profile.role)) {
    return apiError("Admin access required", 403);
  }
  try {
    const summary = await getDisposalReportingSummary(morrisConfig.companyId);
    return apiOk({ summary });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load disposal reports", 500);
  }
}
