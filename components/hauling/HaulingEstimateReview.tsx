"use client";

import type { HaulingEstimateInput, HaulingEstimateResult } from "@/lib/estimate/hauling-transport-engine";
import type { HaulingServiceLevel } from "@/types/hauling";
import {
  HAULING_CARGO_LABELS,
  HAULING_SERVICE_LEVEL_LABELS,
} from "@/types/hauling";
import { morrisConfig } from "@/lib/morris-config";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { StatusChip } from "@/components/morris/StatusChip";
import { Checkbox } from "@/components/ui/checkbox";
import {
  MapPin,
  Package,
  Truck,
  DollarSign,
  AlertTriangle,
  Route,
  Scale,
  Ruler,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface HaulingEstimateReviewProps {
  input: HaulingEstimateInput & {
    pickup: { street?: string; city: string; state: string; zip: string };
    delivery: { street?: string; city: string; state: string; zip: string };
  };
  estimate: HaulingEstimateResult;
  serviceLevel: HaulingServiceLevel;
  onServiceLevelChange?: (level: HaulingServiceLevel) => void;
  showServiceLevelSelector?: boolean;
  disclaimerAccepted?: boolean;
  onDisclaimerChange?: (accepted: boolean) => void;
  rentalDisclaimerAccepted?: boolean;
  onRentalDisclaimerChange?: (accepted: boolean) => void;
  showDisclaimer?: boolean;
  routeMeta?: {
    pickupDisplayName?: string;
    deliveryDisplayName?: string;
    yardName?: string;
  } | null;
  /** Extended / out-of-area customer messaging */
  serviceAreaMessage?: string | null;
}

function yesNo(value?: boolean | null) {
  if (value == null) return "Not specified";
  return value ? "Yes" : "No";
}

export function HaulingEstimateReview({
  input,
  estimate,
  serviceLevel,
  onServiceLevelChange,
  showServiceLevelSelector = false,
  disclaimerAccepted,
  onDisclaimerChange,
  rentalDisclaimerAccepted,
  onRentalDisclaimerChange,
  showDisclaimer = false,
  routeMeta,
  serviceAreaMessage,
}: HaulingEstimateReviewProps) {
  const customerLines = estimate.customerLines ?? estimate.lines;

  return (
    <div className="space-y-4">
      {serviceAreaMessage && (
        <PremiumCard className="border-amber-200 bg-amber-50/60 p-4">
          <div className="flex gap-2 text-sm text-amber-950">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{serviceAreaMessage}</p>
          </div>
        </PremiumCard>
      )}
      <PremiumCard className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <Route className="h-5 w-5 text-brand-primary" />
          <h3 className="font-bold">Trip summary</h3>
        </div>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase text-muted-foreground">Pickup</dt>
            <dd className="font-medium">
              {input.pickup.street ? `${input.pickup.street}, ` : ""}
              {input.pickup.city}, {input.pickup.state} {input.pickup.zip}
            </dd>
            {routeMeta?.pickupDisplayName && (
              <dd className="mt-0.5 text-xs text-muted-foreground">{routeMeta.pickupDisplayName}</dd>
            )}
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase text-muted-foreground">Delivery</dt>
            <dd className="font-medium">
              {input.delivery.street ? `${input.delivery.street}, ` : ""}
              {input.delivery.city}, {input.delivery.state} {input.delivery.zip}
            </dd>
            {routeMeta?.deliveryDisplayName && (
              <dd className="mt-0.5 text-xs text-muted-foreground">{routeMeta.deliveryDisplayName}</dd>
            )}
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase text-muted-foreground">Loaded miles</dt>
            <dd>{estimate.estimatedLoadedMiles} mi</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase text-muted-foreground">
              Positioning / deadhead
            </dt>
            <dd>
              {estimate.estimatedDeadheadMiles} mi
              {routeMeta?.yardName ? ` (via ${routeMeta.yardName})` : ""}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase text-muted-foreground">Driver time</dt>
            <dd>{estimate.estimatedDriverHours} hrs</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase text-muted-foreground">Fuel (internal)</dt>
            <dd>${estimate.estimatedFuelCost}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold uppercase text-muted-foreground">
              Total road travel
            </dt>
            <dd className="font-semibold text-brand-primary">{estimate.totalTravelMiles} mi</dd>
          </div>
        </dl>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          Road miles from live routing
          {estimate.routeProvider ? ` (${estimate.routeProvider})` : ""} — not estimated from city
          names
        </p>
      </PremiumCard>

      <PremiumCard className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <Package className="h-5 w-5 text-brand-primary" />
          <h3 className="font-bold">Cargo summary</h3>
        </div>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Category</dt>
            <dd className="text-right font-medium">{HAULING_CARGO_LABELS[input.cargoCategory]}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Description</dt>
            <dd className="max-w-[60%] text-right">{input.cargoDescription}</dd>
          </div>
          {input.estimatedWeightLbs != null && (
            <div className="flex justify-between gap-4">
              <dt className="flex items-center gap-1 text-muted-foreground">
                <Scale className="h-3.5 w-3.5" /> Weight
              </dt>
              <dd>{input.estimatedWeightLbs.toLocaleString()} lbs</dd>
            </div>
          )}
          {(input.lengthFt || input.widthFt || input.heightFt) && (
            <div className="flex justify-between gap-4">
              <dt className="flex items-center gap-1 text-muted-foreground">
                <Ruler className="h-3.5 w-3.5" /> Dimensions
              </dt>
              <dd>
                {[input.lengthFt, input.widthFt, input.heightFt]
                  .filter(Boolean)
                  .join(" × ")}
                {input.lengthFt ? " ft" : ""}
              </dd>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Running</dt>
            <dd>{yesNo(input.isRunning)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Rolling</dt>
            <dd>{yesNo(input.isRolling)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Winch required</dt>
            <dd>{input.needsWinch ? "Yes" : "No"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Loading help</dt>
            <dd>{input.needsLoadingHelp ? "Required" : "Not needed"}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Unloading help</dt>
            <dd>{input.needsUnloadingHelp ? "Required" : "Not needed"}</dd>
          </div>
        </dl>
      </PremiumCard>

      <PremiumCard className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <Truck className="h-5 w-5 text-brand-primary" />
          <h3 className="font-bold">Equipment</h3>
        </div>
        <p className="font-semibold">{estimate.trailerDisplayName}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {estimate.trailerOwnedOrRental === "owned"
            ? "Morris-owned trailer"
            : "Rental trailer required"}
        </p>
        {estimate.rentalRequired && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Rental trailer subject to availability. Final equipment assignment confirmed by dispatch.
            </span>
          </div>
        )}
      </PremiumCard>

      {showServiceLevelSelector && onServiceLevelChange && (
        <PremiumCard className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <Clock className="h-5 w-5 text-brand-primary" />
            <h3 className="font-bold">Service level</h3>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {morrisConfig.haulingServiceLevels.map((level) => (
              <button
                key={level.id}
                type="button"
                onClick={() => onServiceLevelChange(level.id)}
                className={cn(
                  "rounded-xl border-2 p-3 text-left transition-colors",
                  serviceLevel === level.id
                    ? "border-brand-primary bg-brand-primary/5"
                    : "border-muted hover:border-brand-primary/40"
                )}
              >
                <p className="font-semibold">{level.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{level.description}</p>
              </button>
            ))}
          </div>
        </PremiumCard>
      )}

      <PremiumCard className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-brand-primary" />
          <h3 className="font-bold">Pricing breakdown</h3>
        </div>
        <div className="space-y-2">
          {customerLines
            .filter((l) => !l.internal)
            .map((line) => (
              <div key={line.id} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{line.label}</span>
                <span className={cn("font-medium", line.amount < 0 && "text-green-600")}>
                  {line.amount < 0 ? "-" : ""}${Math.abs(line.amount)}
                </span>
              </div>
            ))}
        </div>
        <div className="mt-4 flex justify-between border-t pt-3 text-lg font-bold">
          <span>Estimated total</span>
          <span className="text-brand-primary">${estimate.total}</span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Estimated based on trip details. Final amount confirmed before dispatch.
        </p>
        {!showServiceLevelSelector && serviceLevel !== "standard" && (
          <StatusChip
            label={HAULING_SERVICE_LEVEL_LABELS[serviceLevel]}
            variant="info"
            className="mt-2"
          />
        )}
      </PremiumCard>

      {showDisclaimer && (
        <PremiumCard className="space-y-4 p-5">
          <h3 className="font-bold">Terms & acceptance</h3>
          <label className="flex items-start gap-2 text-sm">
            <Checkbox
              checked={disclaimerAccepted}
              onCheckedChange={(c) => onDisclaimerChange?.(c === true)}
              className="mt-0.5"
            />
            <span>{morrisConfig.haulingEstimateDisclaimer}</span>
          </label>
          {estimate.rentalRequired && (
            <label className="flex items-start gap-2 text-sm">
              <Checkbox
                checked={rentalDisclaimerAccepted}
                onCheckedChange={(c) => onRentalDisclaimerChange?.(c === true)}
                className="mt-0.5"
              />
              <span>{morrisConfig.haulingRentalDisclaimer}</span>
            </label>
          )}
        </PremiumCard>
      )}
    </div>
  );
}
