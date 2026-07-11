import { apiOk, apiError, parseJson } from "@/lib/api/route-utils";
import { planHaulingRoute, toRouteMetrics } from "@/lib/hauling/plan-route";
import { RouteCalculationError } from "@/lib/geo/types";
import { haulingTransportEngine } from "@/lib/estimate/hauling-transport-engine";
import { getEffectiveMorrisConfig } from "@/lib/pricing/effective-config";
import { morrisConfig } from "@/lib/morris-config";
import type { VerifiedAddress } from "@/types/address";
import { isExtendedServiceArea, isUnsupportedServiceArea } from "@/lib/geo/service-area";
import { isGooglePlacesConfigured } from "@/lib/geo/verify-place";
import { assessServiceAreaAsync } from "@/lib/geo/service-area";
import { normalizeServiceAreaOutcome } from "@/types/address";

type Body = {
  companyId?: string;
  pickup: VerifiedAddress;
  delivery: VerifiedAddress;
  stops?: VerifiedAddress[];
  needsLoadingHelp?: boolean;
  needsUnloadingHelp?: boolean;
  includeEstimate?: boolean;
  estimateInput?: {
    cargoCategory: string;
    cargoDescription: string;
    estimatedWeightLbs?: number;
    lengthFt?: number;
    widthFt?: number;
    heightFt?: number;
    isRunning?: boolean;
    isRolling?: boolean;
    needsWinch?: boolean;
    needsLoadingHelp?: boolean;
    needsUnloadingHelp?: boolean;
    serviceLevel?: string;
  };
};

function serviceMessage(outcome: string, message: string) {
  if (isExtendedServiceArea(outcome as never) || outcome === "manual_review") return message;
  return null;
}

export async function POST(request: Request) {
  try {
    if (!isGooglePlacesConfigured()) {
      return apiError(
        "Address verification is unavailable (Google Maps API key not configured).",
        503
      );
    }

    const body = await parseJson<Body>(request);
    if (!body.pickup?.placeId || !body.delivery?.placeId) {
      return apiError("Verified pickup and delivery placeIds are required", 400);
    }
    for (const [i, stop] of (body.stops ?? []).entries()) {
      if (!stop?.placeId) {
        return apiError(`Verified placeId is required for stop ${i + 1}`, 400);
      }
    }

    const plan = await planHaulingRoute({
      pickup: body.pickup,
      delivery: body.delivery,
      stops: body.stops,
      needsLoadingHelp: body.needsLoadingHelp ?? body.estimateInput?.needsLoadingHelp,
      needsUnloadingHelp: body.needsUnloadingHelp ?? body.estimateInput?.needsUnloadingHelp,
    });

    const metrics = toRouteMetrics(plan);

    const pickupServiceAreaRaw = await assessServiceAreaAsync({
      lat: plan.pickup.location.lat,
      lng: plan.pickup.location.lng,
      zip: body.pickup.zip,
      country: body.pickup.country ?? "US",
    });
    const deliveryServiceAreaRaw = await assessServiceAreaAsync({
      lat: plan.delivery.location.lat,
      lng: plan.delivery.location.lng,
      zip: body.delivery.zip,
      country: body.delivery.country ?? "US",
    });
    const pickupServiceArea = {
      ...pickupServiceAreaRaw,
      outcome: normalizeServiceAreaOutcome(pickupServiceAreaRaw.outcome),
    };
    const deliveryServiceArea = {
      ...deliveryServiceAreaRaw,
      outcome: normalizeServiceAreaOutcome(deliveryServiceAreaRaw.outcome),
    };

    if (
      isUnsupportedServiceArea(pickupServiceArea.outcome) ||
      isUnsupportedServiceArea(deliveryServiceArea.outcome)
    ) {
      return apiError(
        pickupServiceArea.outcome === "unsupported"
          ? pickupServiceArea.message
          : deliveryServiceArea.message,
        400
      );
    }

    const stopServiceAreas = [];
    for (const stop of plan.stops ?? []) {
      const sa = await assessServiceAreaAsync({
        lat: stop.location.lat,
        lng: stop.location.lng,
        zip: body.stops?.find((s) => s.placeId === stop.placeId)?.zip ?? "",
        country: "US",
      });
      stopServiceAreas.push({
        ...sa,
        outcome: normalizeServiceAreaOutcome(sa.outcome),
      });
    }

    let estimate = null;
    if (body.includeEstimate && body.estimateInput) {
      const companyId = body.companyId ?? morrisConfig.companyId;
      const { config } = await getEffectiveMorrisConfig(companyId);
      estimate = haulingTransportEngine.calculate(
        {
          pickup: {
            street: body.pickup.line1,
            city: body.pickup.city,
            state: body.pickup.state,
            zip: body.pickup.zip,
            location: metrics.pickupLocation,
          },
          delivery: {
            street: body.delivery.line1,
            city: body.delivery.city,
            state: body.delivery.state,
            zip: body.delivery.zip,
            location: metrics.deliveryLocation,
          },
          cargoCategory: body.estimateInput.cargoCategory as never,
          cargoDescription: body.estimateInput.cargoDescription,
          estimatedWeightLbs: body.estimateInput.estimatedWeightLbs,
          lengthFt: body.estimateInput.lengthFt,
          widthFt: body.estimateInput.widthFt,
          heightFt: body.estimateInput.heightFt,
          isRunning: body.estimateInput.isRunning,
          isRolling: body.estimateInput.isRolling,
          needsWinch: Boolean(body.estimateInput.needsWinch),
          needsLoadingHelp: Boolean(
            body.needsLoadingHelp ?? body.estimateInput.needsLoadingHelp
          ),
          needsUnloadingHelp: Boolean(
            body.needsUnloadingHelp ?? body.estimateInput.needsUnloadingHelp
          ),
          serviceLevel: (body.estimateInput.serviceLevel as never) ?? "standard",
          route: metrics,
        },
        config
      );
    }

    return apiOk({
      route: metrics,
      serviceArea: {
        pickup: pickupServiceArea,
        delivery: deliveryServiceArea,
        stops: stopServiceAreas,
      },
      plan: {
        yardName: plan.yardName,
        outboundDeadheadMiles: plan.outboundDeadhead.distanceMiles,
        returnDeadheadMiles: plan.returnDeadhead.distanceMiles,
        positioningMiles: plan.positioningMiles,
        returnMiles: plan.returnMiles,
        loadedMiles: plan.loadedMiles,
        deadheadMiles: plan.deadheadMiles,
        totalTravelMiles: plan.totalTravelMiles,
        driveDurationSeconds: plan.driveDurationSeconds,
        loadUnloadMinutes: plan.loadUnloadMinutes,
        estimatedDriverHours: plan.estimatedDriverHours,
        provider: plan.provider,
        pickupDisplayName: plan.pickup.displayName,
        deliveryDisplayName: plan.delivery.displayName,
        stopCount: plan.stops?.length ?? 0,
        stopDisplayNames: (plan.stops ?? []).map((s) => s.displayName),
      },
      estimate,
      messages: {
        pickup: serviceMessage(pickupServiceArea.outcome, pickupServiceArea.message),
        delivery: serviceMessage(deliveryServiceArea.outcome, deliveryServiceArea.message),
      },
    });
  } catch (e) {
    if (e instanceof RouteCalculationError) {
      return apiError(e.message, e.code === "incomplete_address" ? 400 : 502);
    }
    return apiError(e instanceof Error ? e.message : "Failed to calculate route", 500);
  }
}
