"use client";

import Link from "next/link";
import type { JunkRemovalEstimateResult } from "@/lib/estimate/junk-removal-engine";
import {
  CUSTOMER_DISPOSAL_HEADING,
  CUSTOMER_DISPOSAL_PROCESS,
  formatCrewLabel,
  formatOnsiteTimeRange,
} from "@/lib/estimate/junk-customer-labels";
import type { JunkEstimateMode, JunkPriorityLevel, SelectedCommonItem } from "@/types/junk-removal";
import {
  JUNK_ESTIMATE_MODE_LABELS,
  JUNK_PRIORITY_LABELS,
  JUNK_VOLUME_TIER_LABELS,
} from "@/types/junk-removal";
import { DISPOSAL_CATEGORY_LABELS } from "@/types/disposal";
import { getCommonJunkItem } from "@/lib/common-junk-items";
import { getBookingCategory } from "@/lib/booking-categories";
import { morrisConfig } from "@/lib/morris-config";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { StatusChip } from "@/components/morris/StatusChip";
import {
  Package,
  Truck,
  Users,
  Clock,
  DollarSign,
  AlertCircle,
  Recycle,
  CalendarClock,
  Route,
} from "lucide-react";
import type { LoadSizeTier } from "@/types/job";
import {
  PriceFactorsCard,
  PreliminaryEstimateConfidenceNote,
  TransportationDetailsCollapsible,
} from "@/components/junk/JunkEstimateExplainers";
import { SubmittedPhotosCard, type SubmittedPhoto } from "@/components/junk/SubmittedPhotosCard";
import {
  getCustomerDisplayLabel,
  orderCustomerPricingLines,
  splitPricingLinesForDisplay,
} from "@/lib/estimate/junk-pricing-display";

export interface JunkEstimateReviewProps {
  mode: JunkEstimateMode;
  estimate: JunkRemovalEstimateResult;
  selectedItems?: SelectedCommonItem[];
  categoryId?: string;
  loadSizeTier?: LoadSizeTier;
  priorityLevel?: JunkPriorityLevel;
  showReviewBanner?: boolean;
  /** Customer views hide operational routing; staff sees full route details. */
  audience?: "customer" | "staff";
  submittedPhotos?: SubmittedPhoto[];
  serviceAreaMessage?: string | null;
}

export function JunkStaffRouteCard({ estimate }: { estimate: JunkRemovalEstimateResult }) {
  const route = estimate.route;
  return (
    <PremiumCard className="p-5">
      <div className="mb-3 flex items-center gap-2">
        <Route className="h-5 w-5 text-brand-primary" />
        <h3 className="font-bold">Route & disposal (staff)</h3>
      </div>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Operating base</dt>
          <dd className="text-right font-medium">{route.originBaseName}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Disposal site</dt>
          <dd className="text-right">{route.selectedDisposalSiteName}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Material category</dt>
          <dd>{DISPOSAL_CATEGORY_LABELS[route.disposalCategory]}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Base → customer</dt>
          <dd>{route.dispatchMiles} mi</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Customer → disposal</dt>
          <dd>{route.customerToDisposalMiles} mi</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Disposal → base</dt>
          <dd>{route.returnMiles} mi</dd>
        </div>
        <div className="flex justify-between gap-4 border-t pt-2 font-semibold">
          <dt>Total route</dt>
          <dd className="text-brand-primary">{route.totalRouteMiles} mi</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted-foreground">Est. drive time</dt>
          <dd>~{route.estimatedDriveMinutes} min</dd>
        </div>
        {route.baseSelectionReason && (
          <div className="border-t pt-2 text-xs text-muted-foreground">
            Base selection: {route.baseSelectionReason}
          </div>
        )}
      </dl>
      {route.disposalUncertain && (
        <StatusChip label="Disposal site subject to confirmation" variant="warning" className="mt-3" />
      )}
    </PremiumCard>
  );
}

export function JunkEstimateReview({
  mode,
  estimate,
  selectedItems,
  categoryId,
  loadSizeTier,
  priorityLevel,
  showReviewBanner = true,
  audience = "customer",
  submittedPhotos,
  serviceAreaMessage,
}: JunkEstimateReviewProps) {
  const category = categoryId ? getBookingCategory(categoryId) : undefined;
  const customerLines = estimate.customerLines ?? estimate.lines;
  const isStaff = audience === "staff";
  const arrivalWindow = morrisConfig.junkRemovalPricing.typicalArrivalWindow;
  const { transport, rest } = splitPricingLinesForDisplay(customerLines);
  const orderedRest = orderCustomerPricingLines(rest);
  const showPriceFactors = estimate.priceFactors.length > 0;
  const displayTotal = estimate.total;

  return (
    <div className="space-y-4">
      {showReviewBanner && (
        <JunkReviewStatusBanner
          reviewRequired={estimate.reviewRequired}
          reviewReasons={estimate.reviewReasons}
        />
      )}

      {serviceAreaMessage && (
        <PremiumCard className="border-amber-200 bg-amber-50/60 p-4">
          <div className="flex gap-2 text-sm text-amber-950">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{serviceAreaMessage}</p>
          </div>
        </PremiumCard>
      )}

      {submittedPhotos && submittedPhotos.length > 0 && (
        <SubmittedPhotosCard photos={submittedPhotos} />
      )}

      <PremiumCard className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <Package className="h-5 w-5 text-brand-primary" />
          <h3 className="font-bold">Job summary</h3>
        </div>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Type</dt>
            <dd className="font-medium">{JUNK_ESTIMATE_MODE_LABELS[mode]}</dd>
          </div>
          {mode === "cleanout" && loadSizeTier && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Load size</dt>
              <dd>{JUNK_VOLUME_TIER_LABELS[loadSizeTier]}</dd>
            </div>
          )}
          {mode === "cleanout" && category && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Category</dt>
              <dd>{category.name}</dd>
            </div>
          )}
          {mode === "single_item" && selectedItems && selectedItems.length > 0 && (
            <div>
              <dt className="text-muted-foreground">Items</dt>
              <dd className="mt-1 space-y-1">
                {selectedItems.map((sel) => {
                  const cfg = getCommonJunkItem(sel.itemId);
                  return (
                    <p key={`${sel.itemId}-${sel.quantity}`}>
                      {sel.quantity}× {cfg?.name ?? sel.customName ?? sel.itemId}
                    </p>
                  );
                })}
              </dd>
            </div>
          )}
          {priorityLevel && priorityLevel !== "standard" && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Priority</dt>
              <dd>{JUNK_PRIORITY_LABELS[priorityLevel]}</dd>
            </div>
          )}
        </dl>
      </PremiumCard>

      <PremiumCard className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-brand-primary" />
          <h3 className="font-bold">Estimated service</h3>
        </div>
        <dl className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <Users className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <dt className="text-muted-foreground">Crew</dt>
              <dd className="font-semibold">{formatCrewLabel(estimate.estimatedCrewSize)}</dd>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <dt className="text-muted-foreground">Estimated onsite time</dt>
              <dd className="font-semibold">{formatOnsiteTimeRange(estimate.estimatedLaborMinutes)}</dd>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Truck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <div>
              <dt className="text-muted-foreground">Typical arrival window</dt>
              <dd className="font-medium">{arrivalWindow}</dd>
            </div>
          </div>
        </dl>
        {mode === "cleanout" && (
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>Trailer fill estimate</span>
              <span>{estimate.trailerPercent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-primary to-[#C8102E]"
                style={{ width: `${Math.min(estimate.trailerPercent, 100)}%` }}
              />
            </div>
          </div>
        )}
      </PremiumCard>

      <PremiumCard className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <Recycle className="h-5 w-5 text-brand-primary" />
          <h3 className="font-bold">{CUSTOMER_DISPOSAL_HEADING}</h3>
        </div>
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-muted-foreground">Material category</dt>
            <dd className="mt-0.5 font-medium">
              {DISPOSAL_CATEGORY_LABELS[estimate.route.disposalCategory]}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Our process</dt>
            <dd className="mt-0.5 text-muted-foreground leading-relaxed">
              {CUSTOMER_DISPOSAL_PROCESS}
            </dd>
          </div>
        </dl>
        <Link
          href="/junk-removal/responsible-disposal"
          className="mt-3 inline-block text-sm font-semibold text-brand-primary hover:underline"
        >
          Learn more about responsible disposal →
        </Link>
        {estimate.route.disposalUncertain && (
          <StatusChip
            label="Disposal details confirmed after review"
            variant="warning"
            className="mt-3"
          />
        )}
      </PremiumCard>

      {isStaff && <JunkStaffRouteCard estimate={estimate} />}

      {showPriceFactors && (
        <PriceFactorsCard
          factors={estimate.priceFactors}
          title={
            estimate.reviewRequired
              ? "Reason this preliminary estimate may be higher than average"
              : "Factors included in this estimate"
          }
          showDetails={isStaff}
        />
      )}

      <PremiumCard className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-brand-primary" />
          <h3 className="font-bold">Pricing breakdown</h3>
        </div>
        <div className="space-y-3">
          {orderedRest
            .filter((l) => l.id === "service_call")
            .map((line) => (
              <div key={line.id} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{getCustomerDisplayLabel(line)}</span>
                <span className="font-medium">${line.amount}</span>
              </div>
            ))}
          {transport && (
            <TransportationDetailsCollapsible
              amount={transport.amount}
              breakdownSteps={
                estimate.transportationBreakdown.length > 0
                  ? estimate.transportationBreakdown
                  : [
                      "Travel to your property",
                      "On-site loading and removal",
                      "Transportation of collected items",
                      "Responsible disposal or recycling",
                      "Return travel",
                    ]
              }
            />
          )}
          {orderedRest
            .filter((l) => l.id !== "service_call")
            .map((line) => (
              <div key={line.id}>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{getCustomerDisplayLabel(line)}</span>
                  <span className={line.amount < 0 ? "font-medium text-green-700" : "font-medium"}>
                    {line.amount < 0 ? `−$${Math.abs(line.amount)}` : `$${line.amount}`}
                  </span>
                </div>
              </div>
            ))}
        </div>
        <div className="mt-4 flex justify-between border-t pt-3 text-lg font-bold">
          <span>
            {estimate.reviewRequired ? "Preliminary Project Estimate" : "Estimated Project Total"}
          </span>
          <span className="text-brand-primary">${displayTotal}</span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {estimate.reviewRequired
            ? "Our team reviews every estimate before scheduling to make sure you receive accurate pricing. If adjustments are needed, we'll contact you before any work is scheduled."
            : "Estimated based on the information you provided. Final pricing may change if on-site conditions differ from what was submitted."}
        </p>
        {estimate.reviewRequired && <PreliminaryEstimateConfidenceNote />}
      </PremiumCard>
    </div>
  );
}

export function JunkReviewStatusBanner({
  reviewRequired,
  reviewReasons,
}: {
  reviewRequired: boolean;
  reviewReasons: string[];
}) {
  if (reviewRequired) {
    return (
      <PremiumCard className="border-amber-200 bg-amber-50 p-5 dark:border-amber-900/50 dark:bg-amber-950/30">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold text-amber-900 dark:text-amber-100">
              Submitted for a quick review
            </p>
            <p className="mt-1 text-sm text-amber-800/90 dark:text-amber-200/90">
              Some jobs require a quick review so we can price them fairly and avoid surprises.
              Our team reviews every estimate before scheduling to make sure you receive accurate
              pricing. If adjustments are needed, we&apos;ll contact you before any work is scheduled.
            </p>
            <PreliminaryEstimateConfidenceNote />
            {reviewReasons.length > 0 && (
              <ul className="mt-3 space-y-1 text-xs text-amber-800 dark:text-amber-200">
                {reviewReasons.slice(0, 4).map((r) => (
                  <li key={r}>· {r}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </PremiumCard>
    );
  }

  return (
    <PremiumCard className="border-green-200 bg-green-50/80 p-4 dark:border-green-900/40 dark:bg-green-950/20">
      <div className="flex items-center gap-2">
        <StatusChip label="Estimate ready" variant="success" />
        <p className="text-sm text-green-900 dark:text-green-100">
          Your estimate is ready. Final pricing is confirmed on-site if conditions differ.
        </p>
      </div>
    </PremiumCard>
  );
}
