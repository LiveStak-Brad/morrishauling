import { apiError, apiOk, parseJson } from "@/lib/api/route-utils";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { isGooglePlacesConfigured, verifyPlaceId } from "@/lib/geo/verify-place";
import { isUnsupportedServiceArea } from "@/lib/geo/service-area";

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, {
    key: "scrap-check-address",
    limit: 20,
    windowMs: 60_000,
  });
  if (limited) return limited;

  try {
    const body = await parseJson<{ placeId?: string }>(request);
    if (!body.placeId) return apiError("placeId required", 400);
    if (!isGooglePlacesConfigured()) {
      return apiOk({
        eligible: "manual_review",
        message: "Your address requires manual review.",
        address: null,
      });
    }

    const { address, serviceArea } = await verifyPlaceId(body.placeId);
    const outcome = serviceArea.outcome;
    let eligible: "available" | "future" | "manual_review" | "unsupported" = "manual_review";
    let message = "Your address requires manual review.";

    if (isUnsupportedServiceArea(outcome)) {
      eligible = "unsupported";
      message =
        "Your address is outside this Friday’s active route, but you can request a future pickup.";
    } else if (outcome === "standard") {
      eligible = "available";
      message = "Free Scrap Friday is currently available at your address.";
    } else if (outcome === "extended" || outcome === "manual_review") {
      eligible = "manual_review";
      message = "Your address requires manual review.";
    } else {
      eligible = "future";
      message =
        "Your address is outside this Friday’s active route, but you can request a future pickup.";
    }

    return apiOk({
      eligible,
      message,
      address,
      serviceArea,
    });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Address check failed", 400);
  }
}
