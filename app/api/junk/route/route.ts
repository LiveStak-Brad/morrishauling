import { apiOk, apiError, parseJson } from "@/lib/api/route-utils";
import { planJunkRoute } from "@/lib/junk/plan-route";
import { verifyPlaceId, isGooglePlacesConfigured } from "@/lib/geo/verify-place";
import { RouteCalculationError } from "@/lib/geo/types";
import type { VerifiedAddress } from "@/types/address";
import type { DisposalCategory } from "@/lib/disposal/disposal-routing";
import type { ServiceAreaAssessment } from "@/types/address";
import { junkRemovalEngine } from "@/lib/estimate/junk-removal-engine";
import { getEffectiveMorrisConfig } from "@/lib/pricing/effective-config";
import { morrisConfig } from "@/lib/morris-config";

type Body = {
  companyId?: string;
  placeId?: string;
  address?: VerifiedAddress;
  line2?: string;
  materialCategories?: DisposalCategory[];
  includeEstimate?: boolean;
  estimateInput?: Record<string, unknown>;
};

export async function POST(request: Request) {
  try {
    if (!isGooglePlacesConfigured()) {
      return apiError(
        "Address verification is unavailable (Google Maps API key not configured).",
        503
      );
    }

    const body = await parseJson<Body>(request);
    const placeId = body.placeId ?? body.address?.placeId;
    if (!placeId) return apiError("A verified placeId is required", 400);

    const verified = await verifyPlaceId(placeId, {
      line2: body.line2 ?? body.address?.line2,
      lat: body.address?.lat,
      lng: body.address?.lng,
      line1: body.address?.line1,
      city: body.address?.city,
      state: body.address?.state,
      zip: body.address?.zip,
      formattedAddress: body.address?.formattedAddress,
      country: body.address?.country,
    });
    const customer = verified.address;
    const serviceArea: ServiceAreaAssessment = verified.serviceArea;

    const plan = await planJunkRoute({
      customer,
      materialCategories: body.materialCategories,
    });

    let estimate = null;
    if (body.includeEstimate && body.estimateInput) {
      const companyId = body.companyId ?? morrisConfig.companyId;
      const { config } = await getEffectiveMorrisConfig(companyId);
      estimate = junkRemovalEngine.calculate(
        {
          ...(body.estimateInput as object),
          zip: customer.zip,
          addressLocation: { lat: customer.lat, lng: customer.lng },
          routeMetrics: {
            dispatchMiles: plan.dispatchMiles,
            customerToDisposalMiles: plan.customerToDisposalMiles,
            returnMiles: plan.returnMiles,
            totalRouteMiles: plan.totalRouteMiles,
            originBaseId: plan.base.id,
            originBaseName: plan.base.name,
            selectedDisposalSiteId: plan.dump?.id,
            selectedDisposalSiteName: plan.dump?.name,
            estimatedDriverHours: plan.estimatedDriverHours,
          },
        } as never,
        config
      );
    }

    return apiOk({
      address: customer,
      serviceArea,
      route: {
        dispatchMiles: plan.dispatchMiles,
        customerToDisposalMiles: plan.customerToDisposalMiles,
        returnMiles: plan.returnMiles,
        totalRouteMiles: plan.totalRouteMiles,
        estimatedDriverHours: plan.estimatedDriverHours,
        provider: plan.provider,
        disposalPending: plan.disposalPending,
        staff: {
          baseName: plan.base.name,
          dumpName: plan.dump?.name,
          dumpId: plan.dump?.id,
        },
      },
      estimate,
    });
  } catch (e) {
    if (e instanceof RouteCalculationError) {
      return apiError(e.message, e.code === "incomplete_address" ? 400 : 502);
    }
    return apiError(e instanceof Error ? e.message : "Failed to calculate junk route", 500);
  }
}
