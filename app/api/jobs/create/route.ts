import { apiError, apiOk, parseJson } from "@/lib/api/route-utils";
import { createJobFromBooking, createJobFromHauling } from "@/lib/db";
import { getCurrentProfile } from "@/lib/auth/server";
import { isBookingSubmissionAllowed } from "@/lib/public-site";
import type { Job } from "@/types";
import type { HaulingCargoCategory, HaulingDetails, HaulingServiceLevel, HaulingTrailerType, HaulingUrgency, PricingBreakdownLine, TrailerOwnership } from "@/types/hauling";

type HaulingCreateBody = {
  pickup: HaulingDetails["pickup"];
  delivery: HaulingDetails["delivery"];
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
    if (!isBookingSubmissionAllowed()) {
      return apiError(
        "Online booking is not yet live. Morris Hauling & Junk Removal is preparing for launch.",
        403
      );
    }

    const profile = await getCurrentProfile();
    if (!profile) return apiError("Authentication required", 401);

    const body = await parseJson<{
      companyId: string;
      job?: Omit<Job, "id" | "createdAt" | "updatedAt">;
      hauling?: HaulingCreateBody;
    }>(request);

    if (!body.companyId) return apiError("companyId required", 400);

    const customerId =
      profile.role === "customer"
        ? profile.customer_id
        : profile.role === "admin"
          ? body.job?.customerId
          : null;

    if (!customerId) {
      return apiError("Customer account required to create bookings", 403);
    }

    if (body.hauling) {
      const h = body.hauling;
      const haulingDetails: HaulingDetails = {
        id: "pending",
        companyId: body.companyId,
        jobId: "pending",
        pickup: h.pickup,
        delivery: h.delivery,
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
        recommendedTrailerType: h.recommendedTrailerType,
        rentalRequired: h.rentalRequired,
        trailerOwnedOrRental: h.trailerOwnedOrRental,
        estimatedLoadedMiles: h.estimatedLoadedMiles,
        estimatedEmptyMiles: h.estimatedEmptyMiles,
        totalTravelMiles: h.totalTravelMiles,
        estimatedFuelCost: h.estimatedFuelCost,
        estimatedDriverHours: h.estimatedDriverHours,
        serviceLevel: h.serviceLevel,
        customerPricingBreakdown: h.pricingBreakdown,
        internalCostBreakdown: h.internalCostBreakdown,
        estimatedProfit: h.estimatedProfit,
        estimatedMargin: h.estimatedMargin,
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
          customerId,
          haulingDetails,
          pricingBreakdown: h.pricingBreakdown,
          total: h.total,
          disclaimerAccepted: h.disclaimerAccepted,
          preferredPickupDate: h.preferredPickupDate,
        },
        { actorProfileId: profile.id }
      );
      return apiOk({ job });
    }

    if (!body.job) return apiError("job or hauling payload required", 400);

    const job = await createJobFromBooking(
      body.companyId,
      { ...body.job, customerId },
      {
        actorProfileId: profile.id,
        scheduleSlotId: body.job.selectedScheduleSlotId,
      }
    );

    return apiOk({ job });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to create job");
  }
}
