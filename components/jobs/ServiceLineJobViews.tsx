"use client";

import type { Job } from "@/types/job";
import {
  HAULING_CARGO_LABELS,
  HAULING_SERVICE_LEVEL_LABELS,
  HAULING_TRAILER_LABELS,
} from "@/types/hauling";
import { morrisConfig } from "@/lib/morris-config";
import { HaulingEstimateReview } from "@/components/hauling/HaulingEstimateReview";
import { HaulingInternalProfitCard } from "@/components/hauling/HaulingInternalProfitCard";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { StatusChip } from "@/components/morris/StatusChip";
import { MapPin, ArrowRight, Truck } from "lucide-react";
import type { HaulingEstimateResult } from "@/lib/estimate/hauling-transport-engine";
import { junkRemovalEngine } from "@/lib/estimate/junk-removal-engine";
import { JunkEstimateReview, JunkStaffRouteCard } from "@/components/junk/JunkEstimateReview";
import { JunkInternalProfitCard } from "@/components/junk/JunkInternalProfitCard";

function jobToEstimateResult(job: Job): HaulingEstimateResult | null {
  const hd = job.haulingDetails;
  if (!hd) return null;

  const trailerType = hd.recommendedTrailerType;
  const trailerConfig = trailerType
    ? morrisConfig.haulingTrailerTypes.find((t) => t.id === trailerType)
    : undefined;

  return {
    customerLines: hd.customerPricingBreakdown ?? job.pricingBreakdown ?? [],
    internalLines: hd.internalCostBreakdown ?? [],
    lines: hd.customerPricingBreakdown ?? job.pricingBreakdown ?? [],
    total: job.estimate?.total ?? job.pricingBreakdown?.reduce((s, l) => s + l.amount, 0) ?? 0,
    recommendedTrailerType: trailerType ?? "utility_trailer",
    trailerDisplayName:
      trailerConfig?.displayName && hd.rentalRequired
        ? `Rental ${trailerConfig.displayName} — subject to availability`
        : trailerConfig?.displayName ?? (trailerType ? HAULING_TRAILER_LABELS[trailerType] : "Trailer"),
    rentalRequired: hd.rentalRequired,
    trailerOwnedOrRental: hd.trailerOwnedOrRental ?? (hd.rentalRequired ? "rental" : "owned"),
    estimatedLoadedMiles: hd.estimatedLoadedMiles ?? 0,
    estimatedDeadheadMiles: hd.estimatedEmptyMiles ?? 0,
    totalTravelMiles: hd.totalTravelMiles ?? (hd.estimatedLoadedMiles ?? 0) + (hd.estimatedEmptyMiles ?? 0),
    estimatedFuelCost: hd.estimatedFuelCost ?? 0,
    estimatedDriverHours: hd.estimatedDriverHours ?? 0,
    serviceLevel: hd.serviceLevel ?? "standard",
    internalProfit: {
      revenue: job.estimate?.total ?? 0,
      fuelCost: hd.estimatedFuelCost ?? 0,
      payrollCost: 0,
      trailerCost: 0,
      rentalCost: 0,
      overheadCost: morrisConfig.haulingPricing.overheadAllocationFlat,
      totalOperatingCost: 0,
      grossProfit: hd.estimatedProfit ?? 0,
      profitMargin: hd.estimatedMargin ?? 0,
    },
  };
}

export function JobCardHaulingExtras({
  job,
  showInternalProfit,
}: {
  job: Job;
  showInternalProfit?: boolean;
}) {
  const hd = job.haulingDetails;
  if (!hd || job.serviceType !== "hauling_transport") return null;

  const trailerLabel = hd.recommendedTrailerType
    ? morrisConfig.haulingTrailerTypes.find((t) => t.id === hd.recommendedTrailerType)?.displayName ??
      HAULING_TRAILER_LABELS[hd.recommendedTrailerType]
    : null;

  return (
    <div className="mt-3 space-y-2 border-t pt-3 text-xs">
      <p className="flex items-center gap-1 font-medium text-foreground">
        <MapPin className="h-3.5 w-3.5 shrink-0 text-brand-primary" />
        {hd.pickup.city}, {hd.pickup.state}
        <ArrowRight className="h-3 w-3 text-muted-foreground" />
        {hd.delivery.city}, {hd.delivery.state}
      </p>
      <p className="text-muted-foreground">
        {HAULING_CARGO_LABELS[hd.cargoCategory]} · {hd.cargoDescription}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {hd.estimatedWeightLbs && (
          <StatusChip label={`${hd.estimatedWeightLbs} lbs`} variant="neutral" className="text-[10px]" />
        )}
        {trailerLabel && (
          <StatusChip label={trailerLabel} variant="info" className="text-[10px]" />
        )}
        {hd.rentalRequired && <StatusChip label="Rental required" variant="warning" className="text-[10px]" />}
        {hd.serviceLevel && hd.serviceLevel !== "standard" && (
          <StatusChip label={HAULING_SERVICE_LEVEL_LABELS[hd.serviceLevel]} variant="urgent" className="text-[10px]" />
        )}
        {hd.totalTravelMiles != null && (
          <StatusChip label={`~${hd.totalTravelMiles} mi total`} variant="neutral" className="text-[10px]" />
        )}
      </div>
      {showInternalProfit && hd.estimatedProfit != null && (
        <p className="text-[10px] text-muted-foreground">
          Est. profit ${hd.estimatedProfit} · {hd.estimatedMargin}% margin
        </p>
      )}
    </div>
  );
}

export function JobCardJunkExtras({
  job,
  showInternalProfit,
}: {
  job: Job;
  showInternalProfit?: boolean;
}) {
  if (job.serviceType === "hauling_transport") return null;

  const jrd = job.junkRemovalDetails;

  return (
    <>
      {job.estimate && (
        <div className="mt-3">
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>{jrd?.estimateMode === "single_item" ? "Single item" : "Volume load"}</span>
            <span>{job.estimate.trailerPercent}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-primary to-[#C8102E]"
              style={{ width: `${Math.min(job.estimate.trailerPercent, 100)}%` }}
            />
          </div>
        </div>
      )}
      <div className="mt-2 flex flex-wrap gap-1">
        {jrd?.selectedDisposalSiteName && (
          <StatusChip label={jrd.selectedDisposalSiteName.split("—")[0].trim()} variant="info" className="text-[10px]" />
        )}
        {jrd?.estimatedTotalRouteMiles != null && (
          <StatusChip label={`${jrd.estimatedTotalRouteMiles} mi route`} variant="neutral" className="text-[10px]" />
        )}
        {jrd?.dumpFeeEstimate != null && (
          <StatusChip label={`Dump ~$${jrd.dumpFeeEstimate}`} variant="neutral" className="text-[10px]" />
        )}
        {jrd?.reviewRequired && (
          <StatusChip label="Needs review" variant="warning" className="text-[10px]" />
        )}
        {jrd?.estimatedCrewSize && (
          <StatusChip label={`${jrd.estimatedCrewSize} crew`} variant="neutral" className="text-[10px]" />
        )}
        {job.accessDetails.heavyItems && <StatusChip label="Heavy" variant="warning" className="text-[10px]" />}
        {job.accessDetails.stairs && <StatusChip label="Stairs" variant="neutral" className="text-[10px]" />}
        {job.accessDetails.specialDisposal && <StatusChip label="Special disposal" variant="urgent" className="text-[10px]" />}
        {["scheduled", "in_progress", "needs_dump"].includes(job.status) && (
          <StatusChip label="Dump likely" variant="info" className="text-[10px]" />
        )}
      </div>
      {showInternalProfit && jrd?.estimatedProfit != null && (
        <p className="mt-1 text-[10px] text-muted-foreground">
          Est. profit ${jrd.estimatedProfit} · {jrd.estimatedMargin}% margin
        </p>
      )}
    </>
  );
}

export function CustomerHaulingJobDetail({ job }: { job: Job }) {
  const hd = job.haulingDetails;
  if (!hd) return null;

  const estimate = jobToEstimateResult(job);
  if (!estimate) return null;

  return (
    <HaulingEstimateReview
      input={{
        pickup: { city: hd.pickup.city, state: hd.pickup.state, zip: hd.pickup.zip },
        delivery: { city: hd.delivery.city, state: hd.delivery.state, zip: hd.delivery.zip },
        cargoCategory: hd.cargoCategory,
        cargoDescription: hd.cargoDescription,
        estimatedWeightLbs: hd.estimatedWeightLbs,
        lengthFt: hd.lengthFt,
        widthFt: hd.widthFt,
        heightFt: hd.heightFt,
        isRunning: hd.isRunning ?? undefined,
        isRolling: hd.isRolling ?? undefined,
        needsWinch: hd.needsWinch,
        needsLoadingHelp: hd.needsLoadingHelp,
        needsUnloadingHelp: hd.needsUnloadingHelp,
        serviceLevel: hd.serviceLevel ?? "standard",
      }}
      estimate={estimate}
      serviceLevel={hd.serviceLevel ?? "standard"}
    />
  );
}

export function EmployeeHaulingJobDetail({ job }: { job: Job }) {
  const hd = job.haulingDetails;
  if (!hd) return null;
  return (
    <div className="space-y-4">
      <PremiumCard className="space-y-2 p-5 text-sm">
        <h3 className="font-bold">Pickup → Delivery</h3>
        <p className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 text-brand-primary" />
          {hd.pickup.address}, {hd.pickup.city}
        </p>
        <p className="flex items-start gap-2">
          <MapPin className="mt-0.5 h-4 w-4 text-brand-primary" />
          {hd.delivery.address}, {hd.delivery.city}
        </p>
      </PremiumCard>
      <PremiumCard className="space-y-2 p-5 text-sm">
        <h3 className="font-bold">Field instructions</h3>
        <p className="flex items-center gap-2">
          <Truck className="h-4 w-4" /> Trailer:{" "}
          {hd.recommendedTrailerType ? HAULING_TRAILER_LABELS[hd.recommendedTrailerType] : "TBD"}
          {hd.rentalRequired ? " (rental)" : ""}
        </p>
        {hd.needsWinch && <p>Winch required at pickup</p>}
        <p>Loading notes: {hd.pickup.accessNotes || "None"}</p>
        <p>Delivery notes: {hd.delivery.accessNotes || "None"}</p>
      </PremiumCard>
      <HaulingInternalProfitCard job={job} />
    </div>
  );
}

export function AdminPlannerHaulingJobDetail({ job }: { job: Job }) {
  if (job.serviceType !== "hauling_transport") return null;
  return (
    <div className="space-y-4">
      <CustomerHaulingJobDetail job={job} />
      <HaulingInternalProfitCard job={job} />
    </div>
  );
}

export function CustomerJunkJobDetail({ job }: { job: Job }) {
  const jrd = job.junkRemovalDetails;
  if (!jrd || job.serviceType !== "junk_removal") return null;

  const estimate = junkRemovalEngine.calculate(
    {
      mode: jrd.estimateMode,
      selectedItems: jrd.selectedItems,
      loadSizeTier: job.loadSizeTier,
      junkCategory: jrd.selectedCategory ?? job.junkType,
      accessDetails: job.accessDetails,
      items: job.items,
      addressLocation: job.address.location,
      zip: job.address.zip,
      priorityLevel: jrd.priorityLevel,
      hasPhotos: job.photos.length > 0,
      customerNotes: job.customerNotes,
    },
    morrisConfig
  );

  return (
    <JunkEstimateReview
      mode={jrd.estimateMode}
      estimate={estimate}
      selectedItems={jrd.selectedItems}
      categoryId={jrd.selectedCategory ?? job.junkType}
      loadSizeTier={job.loadSizeTier}
      priorityLevel={jrd.priorityLevel}
      audience="customer"
      submittedPhotos={job.photos.map((p) => ({
        id: p.id,
        url: p.url,
        label: p.caption,
      }))}
    />
  );
}

export function EmployeeJunkJobDetail({ job }: { job: Job }) {
  const jrd = job.junkRemovalDetails;
  if (!jrd || job.serviceType !== "junk_removal") return null;

  const staffEstimate = junkRemovalEngine.calculate(
    {
      mode: jrd.estimateMode,
      selectedItems: jrd.selectedItems,
      loadSizeTier: job.loadSizeTier,
      junkCategory: jrd.selectedCategory ?? job.junkType,
      accessDetails: job.accessDetails,
      items: job.items,
      addressLocation: job.address.location,
      zip: job.address.zip,
      priorityLevel: jrd.priorityLevel,
      hasPhotos: job.photos.length > 0,
      customerNotes: job.customerNotes,
    },
    morrisConfig
  );

  return (
    <div className="space-y-4">
      <CustomerJunkJobDetail job={job} />
      <JunkStaffRouteCard estimate={staffEstimate} />
      <JunkInternalProfitCard job={job} />
    </div>
  );
}
