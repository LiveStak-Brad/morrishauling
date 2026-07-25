import { apiError, apiOk } from "@/lib/api/route-utils";
import { requireApiProfile } from "@/lib/api/require-profile";
import { isAdmin, isPlanner } from "@/lib/auth/permissions";
import { scrapAnalytics } from "@/lib/db/scrap-fridays";

export async function GET() {
  try {
    const profile = await requireApiProfile();
    if (profile instanceof Response) return profile;
    if (!isAdmin(profile) && !isPlanner(profile)) return apiError("Forbidden", 403);
    const stats = await scrapAnalytics();
    return apiOk({ stats });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load analytics");
  }
}
