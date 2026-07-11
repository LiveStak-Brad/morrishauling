import { apiOk, apiError, parseJson } from "@/lib/api/route-utils";
import { verifyPlaceId, isGooglePlacesConfigured } from "@/lib/geo/verify-place";
import { RouteCalculationError } from "@/lib/geo/types";

export async function POST(request: Request) {
  try {
    if (!isGooglePlacesConfigured()) {
      return apiError(
        "Address verification is unavailable (Google Maps API key not configured).",
        503
      );
    }

    const body = await parseJson<{
      placeId: string;
      line2?: string;
      lat?: number;
      lng?: number;
      line1?: string;
      city?: string;
      state?: string;
      zip?: string;
      formattedAddress?: string;
    }>(request);

    if (!body.placeId) return apiError("placeId required", 400);

    const { address, serviceArea } = await verifyPlaceId(body.placeId, {
      line2: body.line2,
      lat: body.lat,
      lng: body.lng,
      line1: body.line1,
      city: body.city,
      state: body.state,
      zip: body.zip,
      formattedAddress: body.formattedAddress,
    });

    return apiOk({ address, serviceArea });
  } catch (e) {
    if (e instanceof RouteCalculationError) {
      return apiError(e.message, e.code === "incomplete_address" ? 400 : 502);
    }
    return apiError(e instanceof Error ? e.message : "Verification failed", 500);
  }
}

export async function GET() {
  return apiOk({
    configured: isGooglePlacesConfigured(),
    provider: "google_places",
  });
}
