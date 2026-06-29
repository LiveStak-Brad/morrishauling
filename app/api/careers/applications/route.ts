import { morrisConfig } from "@/lib/morris-config";
import { submitApplication } from "@/lib/db/hr";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { apiOk, apiError, parseJson } from "@/lib/api/route-utils";
import type { ApplicationSubmitPayload } from "@/types/hr/ats";

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, {
    key: "careers-applications",
    limit: 10,
    windowMs: 15 * 60_000,
  });
  if (limited) return limited;

  try {
    const payload = await parseJson<ApplicationSubmitPayload>(request);
    if (!payload.jobPostingId || !payload.firstName || !payload.lastName || !payload.email) {
      return apiError("Missing required fields", 400);
    }
    if (!payload.drugTestConsent || !payload.backgroundCheckConsent) {
      return apiError("Consent required for drug test and background check", 400);
    }
    const result = await submitApplication(morrisConfig.companyId, payload);
    return apiOk(result);
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to submit application", 500);
  }
}
