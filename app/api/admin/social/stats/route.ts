import { apiError, apiOk } from "@/lib/api/route-utils";
import { requireApiProfile } from "@/lib/api/require-profile";
import { isAdmin } from "@/lib/auth/permissions";
import { socialClickStats } from "@/lib/db/social-posts";
import { enabledSocialPlatforms, WARRENTON_JUNK_SOCIAL } from "@/lib/social/config";

export async function GET(request: Request) {
  try {
    const profile = await requireApiProfile();
    if (profile instanceof Response) return profile;
    if (!isAdmin(profile)) return apiError("Forbidden", 403);

    const { searchParams } = new URL(request.url);
    const days = searchParams.get("days") === "30" ? 30 : 7;
    const stats = await socialClickStats(days);

    return apiOk({
      brand: WARRENTON_JUNK_SOCIAL,
      platforms: enabledSocialPlatforms().map((p) => ({
        id: p.id,
        name: p.name,
        profileUrl: p.profileUrl,
        enabled: p.enabled,
      })),
      stats,
    });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load social stats");
  }
}
