import { apiError, apiOk, parseJson } from "@/lib/api/route-utils";
import { recordSocialClick } from "@/lib/db/social-posts";
import { SOCIAL_PLATFORMS, type SocialPlatformId } from "@/lib/social/config";

const PLATFORM_IDS = new Set(SOCIAL_PLATFORMS.map((p) => p.id));

export async function POST(request: Request) {
  try {
    const body = await parseJson<{
      platform?: string;
      surface?: string;
      path?: string;
      device?: string;
      referrer?: string;
    }>(request);

    if (!body.platform || !PLATFORM_IDS.has(body.platform as SocialPlatformId)) {
      return apiError("Invalid platform", 400);
    }
    if (!body.surface || typeof body.surface !== "string" || body.surface.length > 64) {
      return apiError("Invalid surface", 400);
    }

    await recordSocialClick({
      platform: body.platform as SocialPlatformId,
      surface: body.surface,
      path: typeof body.path === "string" ? body.path.slice(0, 200) : undefined,
      device: body.device === "mobile" || body.device === "desktop" ? body.device : undefined,
      referrer_host:
        typeof body.referrer === "string" ? body.referrer.slice(0, 120) : undefined,
    });

    return apiOk({ recorded: true });
  } catch (e) {
    // Do not fail the user journey if analytics persistence is unavailable
    return apiOk({ recorded: false, error: e instanceof Error ? e.message : "skipped" });
  }
}
