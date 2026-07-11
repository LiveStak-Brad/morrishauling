import { apiError, apiOk, parseJson } from "@/lib/api/route-utils";
import { createJobFromBooking, createJobFromHauling } from "@/lib/db";
import { getCurrentProfile } from "@/lib/auth/server";
import {
  divisionBookingClosedMessage,
  isDivisionSubmissionAllowedAsync,
  isDivisionLiveBookingAllowedAsync,
} from "@/lib/public-site";
import { evaluateHaulingReview } from "@/lib/hauling/review-rules";
import { morrisConfig } from "@/lib/morris-config";
import { verifyPlaceId, isGooglePlacesConfigured } from "@/lib/geo/verify-place";
import {
  haulingLocationToVerifiedCandidate,
  jobAddressToVerifiedCandidate,
  verifiedToHaulingLocation,
  verifiedToJobAddress,
} from "@/lib/geo/address-from-location";
import { RouteCalculationError } from "@/lib/geo/types";
import { planHaulingRoute, toRouteMetrics } from "@/lib/hauling/plan-route";
import { haulingTransportEngine } from "@/lib/estimate/hauling-transport-engine";
import { getEffectiveMorrisConfig } from "@/lib/pricing/effective-config";
import { isExtendedServiceArea } from "@/lib/geo/service-area";
import type { Job } from "@/types";
import type {
  HaulingCargoCategory,
  HaulingDetails,
  HaulingServiceLevel,
  HaulingTrailerType,
  HaulingUrgency,
  PricingBreakdownLine,
  TrailerOwnership,
} from "@/types/hauling";

type HaulingCreateBody = {
  pickup: HaulingDetails["pickup"];
  delivery: HaulingDetails["delivery"];
  stops?: HaulingDetails["stops"];
  cargoCategory: HaulingCargoCategory;
  cargoDescription: string;
  estimatedWeightLbs?: number;
  lengthFt?: number;
  widthFt?: number;
  heightFt?: number;
  isRunning?: boolean;
  isRolling?: boolean;
  needsWinch: boolean;
  needsLoadingHelp: boolean;
  needsUnloadingHelp: boolean;
  serviceLevel: HaulingServiceLevel;
  urgency: HaulingUrgency;
  preferredPickupDate?: string;
  preferredDeliveryDate?: string;
  preferredDeliveryWindow?: string;
  pricingBreakdown: PricingBreakdownLine[];
  internalCostBreakdown?: PricingBreakdownLine[];
  total: number;
  recommendedTrailerType: HaulingTrailerType;
  trailerDisplayName?: string;
  rentalRequired: boolean;
  trailerOwnedOrRental?: TrailerOwnership;
  estimatedLoadedMiles: number;
  estimatedEmptyMiles: number;
  totalTravelMiles?: number;
  estimatedFuelCost: number;
  estimatedDriverHours: number;
  estimatedProfit?: number;
  estimatedMargin?: number;
  disclaimerAccepted: boolean;
  trailerAvailabilityDisclaimerAccepted: boolean;
};

export async function POST(request: Request) {
  try {
    const profile = await getCurrentProfile();
    if (!profile) return apiError("Authentication required", 401);

    const body = await parseJson<{
      companyId: string;
      job?: Omit<Job, "id" | "createdAt" | "updatedAt">;
      hauling?: HaulingCreateBody;
    }>(request);

    if (!body.companyId) return apiError("companyId required", 400);

    if (!isGooglePlacesConfigured()) {
      return apiError(
        "Address verification is unavailable (Google Maps API key not configured).",
        503
      );
    }

    const customerId =
      profile.role === "customer"
        ? profile.customer_id
        : profile.role === "admin"
          ? body.job?.customerId
          : null;

    if (!customerId && profile.role === "customer") {
      return apiError("Customer account required to create bookings", 403);
    }

    if (body.hauling) {
      if (!(await isDivisionSubmissionAllowedAsync("hauling"))) {
        return apiError(divisionBookingClosedMessage("hauling"), 403);
      }
      const liveBooking = await isDivisionLiveBookingAllowedAsync("hauling");

      const h = body.hauling;
      const pickupCandidate = haulingLocationToVerifiedCandidate(h.pickup);
      const deliveryCandidate = haulingLocationToVerifiedCandidate(h.delivery);
      if (!pickupCandidate || !deliveryCandidate) {
        return apiError(
          "Verified pickup and delivery addresses with placeIds and coordinates are required.",
          400
        );
      }

      const pickupVerified = await verifyPlaceId(pickupCandidate.placeId, {
        line2: pickupCandidate.line2,
        lat: pickupCandidate.lat,
        lng: pickupCandidate.lng,
      });
      const deliveryVerified = await verifyPlaceId(deliveryCandidate.placeId, {
        line2: deliveryCandidate.line2,
        lat: deliveryCandidate.lat,
        lng: deliveryCandidate.lng,
      });

      const verifiedStops = [];
      for (const [i, s] of (h.stops ?? []).entries()) {
        const c = haulingLocationToVerifiedCandidate(s);
        if (!c) {
          return apiError(`Stop ${i + 1} must be a verified address with placeId.`, 400);
        }
        const v = await verifyPlaceId(c.placeId, {
          line2: c.line2,
          lat: c.lat,
          lng: c.lng,
        });
        verifiedStops.push(verifiedToHaulingLocation(v.address, { line2: c.line2 }));
      }

      const stopAddresses = verifiedStops.map((s) => ({
        line1: s.address,
        line2: s.line2,
        city: s.city,
        state: s.state,
        zip: s.zip,
        country: s.country ?? "US",
        formattedAddress: s.formattedAddress ?? s.address,
        lat: s.location!.lat,
        lng: s.location!.lng,
        placeId: s.placeId!,
        verificationStatus: s.verificationStatus ?? "verified",
        provider: s.provider ?? "google_places",
        verifiedAt: s.verifiedAt ?? new Date().toISOString(),
      }));

      const plan = await planHaulingRoute({
        pickup: pickupVerified.address,
        delivery: deliveryVerified.address,
        stops: stopAddresses,
        needsLoadingHelp: h.needsLoadingHelp,
        needsUnloadingHelp: h.needsUnloadingHelp,
        reverify: false,
      });
      const metrics = toRouteMetrics(plan);

      const canonicalPickup = verifiedToHaulingLocation(pickupVerified.address, {
        accessNotes: h.pickup.accessNotes,
        loadingDock: h.pickup.loadingDock,
        forkliftAvailable: h.pickup.forkliftAvailable,
        assistanceAvailable: h.pickup.assistanceAvailable,
      });
      const canonicalDelivery = verifiedToHaulingLocation(deliveryVerified.address, {
        accessNotes: h.delivery.accessNotes,
        loadingDock: h.delivery.loadingDock,
        forkliftAvailable: h.delivery.forkliftAvailable,
        assistanceAvailable: h.delivery.assistanceAvailable,
      });

      const { config } = await getEffectiveMorrisConfig(body.companyId);
      const serverEstimate = haulingTransportEngine.calculate(
        {
          pickup: {
            street: canonicalPickup.address,
            city: canonicalPickup.city,
            state: canonicalPickup.state,
            zip: canonicalPickup.zip,
            location: metrics.pickupLocation,
          },
          delivery: {
            street: canonicalDelivery.address,
            city: canonicalDelivery.city,
            state: canonicalDelivery.state,
            zip: canonicalDelivery.zip,
            location: metrics.deliveryLocation,
          },
          cargoCategory: h.cargoCategory,
          cargoDescription: h.cargoDescription,
          estimatedWeightLbs: h.estimatedWeightLbs,
          lengthFt: h.lengthFt,
          widthFt: h.widthFt,
          heightFt: h.heightFt,
          isRunning: h.isRunning,
          isRolling: h.isRolling,
          needsWinch: h.needsWinch,
          needsLoadingHelp: h.needsLoadingHelp,
          needsUnloadingHelp: h.needsUnloadingHelp,
          serviceLevel: h.serviceLevel,
          route: metrics,
        },
        config
      );

      if (
        h.totalTravelMiles != null &&
        Math.abs(h.totalTravelMiles - metrics.totalTravelMiles) > 1.5
      ) {
        return apiError(
          "Route changed since your estimate. Please recalculate and submit again.",
          409
        );
      }

      const outsideServiceArea =
        isExtendedServiceArea(pickupVerified.serviceArea.outcome) ||
        isExtendedServiceArea(deliveryVerified.serviceArea.outcome) ||
        pickupVerified.serviceArea.outcome === "manual_review" ||
        deliveryVerified.serviceArea.outcome === "manual_review";

      const review = evaluateHaulingReview(
        {
          pickup: canonicalPickup,
          delivery: canonicalDelivery,
          cargoCategory: h.cargoCategory,
          cargoDescription: h.cargoDescription,
          estimatedWeightLbs: h.estimatedWeightLbs,
          lengthFt: h.lengthFt,
          widthFt: h.widthFt,
          heightFt: h.heightFt,
          isRunning: h.isRunning,
          isRolling: h.isRolling,
          needsWinch: h.needsWinch,
          needsLoadingHelp: h.needsLoadingHelp,
          needsUnloadingHelp: h.needsUnloadingHelp,
          serviceLevel: h.serviceLevel,
          totalTravelMiles: metrics.totalTravelMiles,
          pickupState: canonicalPickup.state,
          deliveryState: canonicalDelivery.state,
          accessNotes: canonicalPickup.accessNotes,
          outsideServiceArea,
        },
        morrisConfig
      );

      const haulingCustomerId =
        profile.role === "customer" ? profile.customer_id : customerId;
      if (!haulingCustomerId) {
        return apiError("Customer account required to create bookings", 403);
      }

      const haulingDetails: HaulingDetails = {
        id: "pending",
        companyId: body.companyId,
        jobId: "pending",
        pickup: canonicalPickup,
        delivery: canonicalDelivery,
        stops: verifiedStops,
        cargoCategory: h.cargoCategory,
        cargoDescription: h.cargoDescription,
        estimatedWeightLbs: h.estimatedWeightLbs,
        lengthFt: h.lengthFt,
        widthFt: h.widthFt,
        heightFt: h.heightFt,
        isRunning: h.isRunning ?? null,
        isRolling: h.isRolling ?? null,
        needsWinch: h.needsWinch,
        needsLoadingHelp: h.needsLoadingHelp,
        needsUnloadingHelp: h.needsUnloadingHelp,
        recommendedTrailerType: serverEstimate.recommendedTrailerType,
        rentalRequired: serverEstimate.rentalRequired,
        trailerOwnedOrRental: serverEstimate.trailerOwnedOrRental,
        estimatedLoadedMiles: serverEstimate.estimatedLoadedMiles,
        estimatedEmptyMiles: serverEstimate.estimatedDeadheadMiles,
        totalTravelMiles: serverEstimate.totalTravelMiles,
        estimatedFuelCost: serverEstimate.estimatedFuelCost,
        estimatedDriverHours: serverEstimate.estimatedDriverHours,
        serviceLevel: h.serviceLevel,
        customerPricingBreakdown: serverEstimate.customerLines,
        internalCostBreakdown: serverEstimate.internalLines,
        estimatedProfit: serverEstimate.internalProfit.grossProfit,
        estimatedMargin: serverEstimate.internalProfit.profitMargin,
        urgency: h.urgency,
        trailerAvailabilityDisclaimerAccepted: h.trailerAvailabilityDisclaimerAccepted,
        preferredPickupDate: h.preferredPickupDate,
        preferredDeliveryDate: h.preferredDeliveryDate,
        preferredDeliveryWindow: h.preferredDeliveryWindow,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const job = await createJobFromHauling(
        body.companyId,
        {
          customerId: haulingCustomerId,
          haulingDetails,
          pricingBreakdown: serverEstimate.customerLines,
          total: serverEstimate.total,
          disclaimerAccepted: h.disclaimerAccepted,
          preferredPickupDate: h.preferredPickupDate,
          reviewRequired: review.reviewRequired,
          reviewReasons: (review.reasons ?? []) as string[],
        },
        { actorProfileId: profile.id }
      );

      const confirmed = liveBooking && !review.reviewRequired;
      return apiOk({
        job,
        review,
        mode: "booking",
        serviceArea: {
          pickup: pickupVerified.serviceArea,
          delivery: deliveryVerified.serviceArea,
        },
        route: metrics,
        message: confirmed
          ? "Booking received. We'll confirm your window shortly."
          : "Request received. We'll review pricing and send your estimate for approval — then schedule automatically.",
      });
    }

    if (!(await isDivisionSubmissionAllowedAsync("junk_removal"))) {
      return apiError(divisionBookingClosedMessage("junk_removal"), 403);
    }

    if (!body.job) return apiError("job or hauling payload required", 400);

    const junkCustomerId =
      profile.role === "customer" ? profile.customer_id : body.job.customerId;
    if (!junkCustomerId) {
      return apiError("Customer account required to create bookings", 403);
    }

    const addressCandidate = jobAddressToVerifiedCandidate(body.job.address);
    if (!addressCandidate) {
      return apiError(
        "A verified service address with placeId and coordinates is required.",
        400
      );
    }

    const verified = await verifyPlaceId(addressCandidate.placeId, {
      line2: addressCandidate.line2,
      lat: addressCandidate.lat,
      lng: addressCandidate.lng,
    });
    const canonicalAddress = verifiedToJobAddress(verified.address);

    const liveJunk = await isDivisionLiveBookingAllowedAsync("junk_removal");
    const scheduleSlotId = body.job.selectedScheduleSlotId;

    const warnings = [...(body.job.warnings ?? [])];
    if (
      verified.serviceArea.outcome === "extended" &&
      !warnings.includes("outside_service_area")
    ) {
      warnings.push("outside_service_area");
    }

    const job = await createJobFromBooking(
      body.companyId,
      {
        ...body.job,
        customerId: junkCustomerId,
        address: canonicalAddress,
        warnings,
        divisionId: "junk_removal",
        serviceType: "junk_removal",
        status: body.job.status,
        selectedScheduleSlotId: scheduleSlotId,
        junkRemovalDetails: body.job.junkRemovalDetails
          ? {
              ...body.job.junkRemovalDetails,
              reviewRequired:
                body.job.junkRemovalDetails.reviewRequired ||
                verified.serviceArea.requiresReview,
              reviewReasons: [
                ...(body.job.junkRemovalDetails.reviewReasons ?? []),
                ...(verified.serviceArea.requiresReview ? ["outside_service_area"] : []),
              ],
            }
          : body.job.junkRemovalDetails,
      },
      {
        actorProfileId: profile.id,
        scheduleSlotId: liveJunk ? scheduleSlotId : scheduleSlotId,
      }
    );

    const needsReview = Boolean(job.junkRemovalDetails?.reviewRequired);
    return apiOk({
      job,
      mode: "booking",
      serviceArea: verified.serviceArea,
      message: needsReview
        ? "Request received. We'll review and send your estimate for approval — then schedule your window."
        : liveJunk && scheduleSlotId
          ? "Booking confirmed. Check your account for scheduling details."
          : "Booking received. We'll confirm your appointment shortly.",
    });
  } catch (e) {
    if (e instanceof RouteCalculationError) {
      return apiError(e.message, e.code === "incomplete_address" ? 400 : 502);
    }
    return apiError(e instanceof Error ? e.message : "Failed to create job");
  }
}
