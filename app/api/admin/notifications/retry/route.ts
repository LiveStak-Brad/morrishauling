import { apiError, apiOk } from "@/lib/api/route-utils";
import { requireApiProfile } from "@/lib/api/require-profile";
import { processEmailRetries } from "@/lib/notifications/enqueue";
import { enforceRateLimit } from "@/lib/api/rate-limit";

/**
 * Process pending/failed email retries.
 * Call from cron or admin. Also accepts CRON_SECRET bearer for automation.
 */
export async function POST(request: Request) {
  const limited = enforceRateLimit(request, {
    key: "email-retries",
    limit: 30,
    windowMs: 60_000,
  });
  if (limited) return limited;

  const cronSecret = process.env.CRON_SECRET?.trim();
  const auth = request.headers.get("authorization");
  const isCron = Boolean(cronSecret && auth === `Bearer ${cronSecret}`);

  if (!isCron) {
    const profile = await requireApiProfile();
    if (profile instanceof Response) return profile;
    if (!["admin", "planner"].includes(profile.role)) {
      return apiError("Admin access required", 403);
    }
  }

  try {
    const result = await processEmailRetries(25);
    return apiOk(result);
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Retry processing failed", 500);
  }
}
