"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { HaulingCargoCategory, HaulingServiceLevel } from "@/types/hauling";
import { serviceLevelToUrgency } from "@/types/hauling";
import { useCompany } from "@/lib/company-context";
import { morrisConfig } from "@/lib/morris-config";
import {
  haulingTransportEngine,
  type HaulingEstimateResult,
} from "@/lib/estimate/hauling-transport-engine";
import type { HaulingRouteMetrics } from "@/lib/geo/types";
import { mutateCreateHaulingJob } from "@/lib/api/mutations";
import { useAuth } from "@/components/auth/AuthProvider";
import { useEffectivePricing } from "@/hooks/useEffectivePricing";
import { HaulingEstimateReview } from "@/components/hauling/HaulingEstimateReview";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { StatusChip } from "@/components/morris/StatusChip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Camera, Truck, Sparkles, Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { VerifiedAddressField } from "@/components/geo/VerifiedAddressField";
import type { VerifiedAddress } from "@/types/address";
import { isAddressVerified } from "@/types/address";

const STEPS = [
  "Pickup",
  "Delivery",
  "Cargo",
  "Size & weight",
  "Trailer",
  "Schedule",
  "Estimate",
  "Terms",
];

type SiteExtras = {
  accessNotes: string;
  loadingDock: boolean;
  forklift: boolean;
  assistance: boolean;
};

const emptyExtras: SiteExtras = {
  accessNotes: "",
  loadingDock: false,
  forklift: false,
  assistance: false,
};

function SiteExtrasFields({
  values,
  onChange,
}: {
  values: SiteExtras;
  onChange: (patch: Partial<SiteExtras>) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Access notes</Label>
        <Input
          className="mt-1.5 h-11 rounded-xl"
          placeholder="Gate code, narrow driveway..."
          value={values.accessNotes}
          onChange={(e) => onChange({ accessNotes: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={values.loadingDock}
            onCheckedChange={(c) => onChange({ loadingDock: c === true })}
          />
          Loading dock available
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={values.forklift}
            onCheckedChange={(c) => onChange({ forklift: c === true })}
          />
          Forklift available
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={values.assistance}
            onCheckedChange={(c) => onChange({ assistance: c === true })}
          />
          Assistance available on site
        </label>
      </div>
    </div>
  );
}

export function HaulingTransportWizard({ demoMode = false }: { demoMode?: boolean }) {
  const { company, companyId } = useCompany();
  const { estimateConfig } = useEffectivePricing(companyId);
  const { customerId: authCustomerId } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [pickupAddress, setPickupAddress] = useState<VerifiedAddress | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState<VerifiedAddress | null>(null);
  const [stopAddresses, setStopAddresses] = useState<VerifiedAddress[]>([]);
  const [pickupExtras, setPickupExtras] = useState<SiteExtras>(emptyExtras);
  const [deliveryExtras, setDeliveryExtras] = useState<SiteExtras>(emptyExtras);
  const [pickupServiceMsg, setPickupServiceMsg] = useState<string | null>(null);
  const [deliveryServiceMsg, setDeliveryServiceMsg] = useState<string | null>(null);
  const [cargoCategory, setCargoCategory] = useState<HaulingCargoCategory>("other");
  const [cargoDescription, setCargoDescription] = useState("");
  const [weight, setWeight] = useState("");
  const [lengthFt, setLengthFt] = useState("");
  const [widthFt, setWidthFt] = useState("");
  const [heightFt, setHeightFt] = useState("");
  const [isRolling, setIsRolling] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [needsWinch, setNeedsWinch] = useState(false);
  const [needsLoadingHelp, setNeedsLoadingHelp] = useState(false);
  const [needsUnloadingHelp, setNeedsUnloadingHelp] = useState(false);
  const [serviceLevel, setServiceLevel] = useState<HaulingServiceLevel>("standard");
  const [pickupDate, setPickupDate] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryWindow, setDeliveryWindow] = useState("");
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [rentalDisclaimerAccepted, setRentalDisclaimerAccepted] = useState(false);

  const [route, setRoute] = useState<HaulingRouteMetrics | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [routeMeta, setRouteMeta] = useState<{
    pickupDisplayName?: string;
    deliveryDisplayName?: string;
    yardName?: string;
  } | null>(null);

  const needsLoad = needsLoadingHelp || (!pickupExtras.assistance && !pickupExtras.forklift);
  const needsUnload = needsUnloadingHelp || (!deliveryExtras.assistance && !deliveryExtras.forklift);

  const addressesReady =
    isAddressVerified(pickupAddress) &&
    isAddressVerified(deliveryAddress) &&
    stopAddresses.every((s) => isAddressVerified(s));

  const stopKey = stopAddresses.map((s) => s.placeId).join("|");

  // Recalculate road route whenever verified addresses or load/unload assumptions change
  useEffect(() => {
    if (!addressesReady || !pickupAddress || !deliveryAddress) {
      setRoute(null);
      setRouteError(null);
      setRouteMeta(null);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      setRouteLoading(true);
      setRouteError(null);
      fetch("/api/hauling/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          pickup: pickupAddress,
          delivery: deliveryAddress,
          stops: stopAddresses,
          needsLoadingHelp: needsLoad,
          needsUnloadingHelp: needsUnload,
        }),
      })
        .then(async (res) => {
          const data = await res.json();
          if (!data.ok) throw new Error(data.error ?? "Route calculation failed");
          setRoute(data.route as HaulingRouteMetrics);
          setRouteMeta({
            pickupDisplayName: data.plan?.pickupDisplayName,
            deliveryDisplayName: data.plan?.deliveryDisplayName,
            yardName: data.plan?.yardName,
          });
          const pickupOutcome = data.serviceArea?.pickup?.outcome;
          const deliveryOutcome = data.serviceArea?.delivery?.outcome;
          setPickupServiceMsg(
            pickupOutcome === "extended" || pickupOutcome === "manual_review"
              ? data.serviceArea.pickup.message
              : null
          );
          setDeliveryServiceMsg(
            deliveryOutcome === "extended" || deliveryOutcome === "manual_review"
              ? data.serviceArea.delivery.message
              : null
          );
        })
        .catch((err: unknown) => {
          if (controller.signal.aborted) return;
          setRoute(null);
          setRouteError(err instanceof Error ? err.message : "Could not calculate route");
        })
        .finally(() => {
          if (!controller.signal.aborted) setRouteLoading(false);
        });
    }, 450);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [
    addressesReady,
    pickupAddress?.placeId,
    pickupAddress?.lat,
    pickupAddress?.lng,
    deliveryAddress?.placeId,
    deliveryAddress?.lat,
    deliveryAddress?.lng,
    stopKey,
    needsLoad,
    needsUnload,
  ]);

  const estimateInput = useMemo(
    () => ({
      pickup: {
        street: pickupAddress?.line1 ?? "",
        city: pickupAddress?.city ?? "",
        state: pickupAddress?.state ?? "MO",
        zip: pickupAddress?.zip ?? "",
        location: pickupAddress
          ? { lat: pickupAddress.lat, lng: pickupAddress.lng }
          : undefined,
      },
      delivery: {
        street: deliveryAddress?.line1 ?? "",
        city: deliveryAddress?.city ?? "",
        state: deliveryAddress?.state ?? "MO",
        zip: deliveryAddress?.zip ?? "",
        location: deliveryAddress
          ? { lat: deliveryAddress.lat, lng: deliveryAddress.lng }
          : undefined,
      },
      cargoCategory,
      cargoDescription,
      estimatedWeightLbs: weight ? Number(weight) : undefined,
      lengthFt: lengthFt ? Number(lengthFt) : undefined,
      widthFt: widthFt ? Number(widthFt) : undefined,
      heightFt: heightFt ? Number(heightFt) : undefined,
      isRunning,
      isRolling,
      needsWinch,
      needsLoadingHelp: needsLoad,
      needsUnloadingHelp: needsUnload,
      serviceLevel,
      route: route ?? undefined,
    }),
    [
      pickupAddress,
      deliveryAddress,
      cargoCategory,
      cargoDescription,
      weight,
      lengthFt,
      widthFt,
      heightFt,
      isRunning,
      isRolling,
      needsWinch,
      needsLoad,
      needsUnload,
      serviceLevel,
      route,
    ]
  );

  const estimate: HaulingEstimateResult | null = useMemo(() => {
    if (!route) return null;
    try {
      return haulingTransportEngine.calculate(estimateInput, estimateConfig);
    } catch {
      return null;
    }
  }, [estimateInput, estimateConfig, route]);

  const canNext = () => {
    if (step === 0) return isAddressVerified(pickupAddress);
    if (step === 1) {
      const stopsOk =
        stopAddresses.length === 0 || stopAddresses.every((s) => isAddressVerified(s));
      return (
        isAddressVerified(deliveryAddress) &&
        stopsOk &&
        !routeLoading &&
        !routeError &&
        Boolean(route)
      );
    }
    if (step === 2) return cargoDescription.trim().length > 2;
    if (step === 4 || step === 6 || step === 7) {
      if (routeLoading) return false;
      if (routeError || !estimate) return false;
    }
    if (step === 7) {
      if (!disclaimerAccepted) return false;
      if (estimate?.rentalRequired && !rentalDisclaimerAccepted) return false;
      return true;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (demoMode) return;
    if (!authCustomerId) {
      router.push("/register?redirect=/book?division=hauling");
      return;
    }
    if (!estimate || !route || !pickupAddress || !deliveryAddress) return;
    setSubmitting(true);
    try {
      const job = await mutateCreateHaulingJob(companyId, {
        pickup: {
          address: pickupAddress.line1,
          city: pickupAddress.city,
          state: pickupAddress.state,
          zip: pickupAddress.zip,
          accessNotes: pickupExtras.accessNotes,
          loadingDock: pickupExtras.loadingDock,
          forkliftAvailable: pickupExtras.forklift,
          assistanceAvailable: pickupExtras.assistance,
          location: { lat: pickupAddress.lat, lng: pickupAddress.lng },
          line2: pickupAddress.line2,
          placeId: pickupAddress.placeId,
          formattedAddress: pickupAddress.formattedAddress,
          country: pickupAddress.country,
          verificationStatus: pickupAddress.verificationStatus,
          provider: pickupAddress.provider,
          verifiedAt: pickupAddress.verifiedAt,
        },
        delivery: {
          address: deliveryAddress.line1,
          city: deliveryAddress.city,
          state: deliveryAddress.state,
          zip: deliveryAddress.zip,
          accessNotes: deliveryExtras.accessNotes,
          loadingDock: deliveryExtras.loadingDock,
          forkliftAvailable: deliveryExtras.forklift,
          assistanceAvailable: deliveryExtras.assistance,
          location: { lat: deliveryAddress.lat, lng: deliveryAddress.lng },
          line2: deliveryAddress.line2,
          placeId: deliveryAddress.placeId,
          formattedAddress: deliveryAddress.formattedAddress,
          country: deliveryAddress.country,
          verificationStatus: deliveryAddress.verificationStatus,
          provider: deliveryAddress.provider,
          verifiedAt: deliveryAddress.verifiedAt,
        },
        stops: stopAddresses
          .filter((s) => isAddressVerified(s))
          .map((s) => ({
          address: s.line1,
          city: s.city,
          state: s.state,
          zip: s.zip,
          location: { lat: s.lat, lng: s.lng },
          line2: s.line2,
          placeId: s.placeId,
          formattedAddress: s.formattedAddress,
          country: s.country,
          verificationStatus: s.verificationStatus,
          provider: s.provider,
          verifiedAt: s.verifiedAt,
        })),
        cargoCategory,
        cargoDescription,
        estimatedWeightLbs: weight ? Number(weight) : undefined,
        lengthFt: lengthFt ? Number(lengthFt) : undefined,
        widthFt: widthFt ? Number(widthFt) : undefined,
        heightFt: heightFt ? Number(heightFt) : undefined,
        isRunning,
        isRolling,
        needsWinch,
        needsLoadingHelp: needsLoad,
        needsUnloadingHelp: needsUnload,
        serviceLevel,
        urgency: serviceLevelToUrgency(serviceLevel),
        preferredPickupDate: pickupDate || undefined,
        preferredDeliveryDate: deliveryDate || undefined,
        preferredDeliveryWindow: deliveryWindow || undefined,
        pricingBreakdown: estimate.customerLines,
        internalCostBreakdown: estimate.internalLines,
        total: estimate.total,
        recommendedTrailerType: estimate.recommendedTrailerType,
        trailerDisplayName: estimate.trailerDisplayName,
        rentalRequired: estimate.rentalRequired,
        trailerOwnedOrRental: estimate.trailerOwnedOrRental,
        estimatedLoadedMiles: estimate.estimatedLoadedMiles,
        estimatedEmptyMiles: estimate.estimatedDeadheadMiles,
        totalTravelMiles: estimate.totalTravelMiles,
        estimatedFuelCost: estimate.estimatedFuelCost,
        estimatedDriverHours: estimate.estimatedDriverHours,
        estimatedProfit: estimate.internalProfit.grossProfit,
        estimatedMargin: estimate.internalProfit.profitMargin,
        disclaimerAccepted,
        trailerAvailabilityDisclaimerAccepted: rentalDisclaimerAccepted,
      });
      router.push(`/customer/jobs/${job.id}`);
    } finally {
      setSubmitting(false);
    }
  };

  const RouteStatus = () => {
    if (!addressesReady) return null;
    if (routeLoading) {
      return (
        <PremiumCard className="flex items-center gap-3 border-brand-primary/20 bg-brand-primary/5 p-4 text-sm">
          <Loader2 className="h-5 w-5 animate-spin text-brand-primary" />
          <span>Calculating road route from your addresses…</span>
        </PremiumCard>
      );
    }
    if (routeError) {
      return (
        <PremiumCard className="flex items-start gap-3 border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Route could not be calculated</p>
            <p className="mt-1">{routeError}</p>
            <p className="mt-2 text-xs">
              We do not substitute placeholder mileage. Fix the addresses or try again.
            </p>
          </div>
        </PremiumCard>
      );
    }
    if (route) {
      return (
        <PremiumCard className="border-black/5 bg-white p-4 text-sm">
          <p className="font-semibold text-brand-primary">
            Road route · {route.loadedMiles} mi loaded · {route.deadheadMiles} mi positioning ·{" "}
            {route.totalTravelMiles} mi total
          </p>
          {routeMeta?.pickupDisplayName && (
            <p className="mt-1 text-xs text-muted-foreground">
              Via {route.provider}: {routeMeta.pickupDisplayName.split(",").slice(0, 2).join(",")} →{" "}
              {routeMeta.deliveryDisplayName?.split(",").slice(0, 2).join(",")}
            </p>
          )}
        </PremiumCard>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="sticky top-16 z-30 -mx-4 bg-background/80 px-4 py-3 backdrop-blur-lg md:top-0">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-muted"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary">
                Hauling & Transport
              </p>
              <p className="font-bold">{STEPS[step]}</p>
            </div>
          </div>
          {estimate && step >= 5 && <StatusChip label={`~$${estimate.total}`} variant="live" />}
        </div>
        <Progress value={((step + 1) / STEPS.length) * 100} className="h-2" />
      </div>

      {step >= 1 && <RouteStatus />}

      {step === 0 && (
        <PremiumCard className="space-y-4 p-6">
          <h2 className="text-xl font-bold">Pickup location</h2>
          <VerifiedAddressField
            id="hauling-pickup"
            label="Pickup address"
            value={pickupAddress}
            onChange={(addr) => {
              setPickupAddress(addr);
              setPickupServiceMsg(null);
            }}
            serviceAreaMessage={pickupServiceMsg}
          />
          <SiteExtrasFields
            values={pickupExtras}
            onChange={(p) => setPickupExtras({ ...pickupExtras, ...p })}
          />
        </PremiumCard>
      )}

      {step === 1 && (
        <PremiumCard className="space-y-4 p-6">
          <h2 className="text-xl font-bold">Delivery location</h2>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">Additional stops (optional)</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={stopAddresses.length >= 5}
                onClick={() =>
                  setStopAddresses([
                    ...stopAddresses,
                    {
                      line1: "",
                      city: "",
                      state: "MO",
                      zip: "",
                      country: "US",
                      formattedAddress: "",
                      lat: NaN,
                      lng: NaN,
                      placeId: "",
                      verificationStatus: "unverified",
                      provider: "google_places",
                      verifiedAt: "",
                    },
                  ])
                }
              >
                Add stop
              </Button>
            </div>
            {stopAddresses.map((stop, idx) => (
              <div key={`stop-slot-${idx}`} className="space-y-2 rounded-xl border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    Stop {idx + 1}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setStopAddresses(stopAddresses.filter((_, i) => i !== idx))
                    }
                  >
                    Remove
                  </Button>
                </div>
                <VerifiedAddressField
                  id={`hauling-stop-${idx}`}
                  label={`Stop ${idx + 1} address`}
                  value={isAddressVerified(stop) ? stop : null}
                  onChange={(addr) => {
                    const next = [...stopAddresses];
                    if (addr) next[idx] = addr;
                    else
                      next[idx] = {
                        line1: "",
                        city: "",
                        state: "MO",
                        zip: "",
                        country: "US",
                        formattedAddress: "",
                        lat: NaN,
                        lng: NaN,
                        placeId: "",
                        verificationStatus: "unverified",
                        provider: "google_places",
                        verifiedAt: "",
                      };
                    setStopAddresses(next);
                  }}
                />
              </div>
            ))}
          </div>

          <VerifiedAddressField
            id="hauling-delivery"
            label="Delivery address"
            value={deliveryAddress}
            onChange={(addr) => {
              setDeliveryAddress(addr);
              setDeliveryServiceMsg(null);
            }}
            serviceAreaMessage={deliveryServiceMsg}
          />
          <SiteExtrasFields
            values={deliveryExtras}
            onChange={(p) => setDeliveryExtras({ ...deliveryExtras, ...p })}
          />
        </PremiumCard>
      )}

      {step === 2 && (
        <PremiumCard className="space-y-4 p-6">
          <h2 className="text-xl font-bold">Cargo details</h2>
          <div>
            <Label>Category</Label>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {morrisConfig.haulingCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCargoCategory(cat.id as HaulingCargoCategory)}
                  className={cn(
                    "rounded-xl border-2 p-2 text-left text-xs font-medium transition-colors",
                    cargoCategory === cat.id
                      ? "border-brand-primary bg-brand-primary/5"
                      : "border-muted"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>What are we hauling?</Label>
            <Input
              className="mt-1.5 h-11 rounded-xl"
              placeholder="Describe the cargo..."
              value={cargoDescription}
              onChange={(e) => setCargoDescription(e.target.value)}
            />
          </div>
          <PremiumCard className="border-dashed p-6 text-center">
            <Camera className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">Photo upload placeholder</p>
          </PremiumCard>
        </PremiumCard>
      )}

      {step === 3 && (
        <PremiumCard className="space-y-4 p-6">
          <h2 className="text-xl font-bold">Size & weight</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Weight (lbs)</Label>
              <Input
                type="number"
                className="mt-1.5 h-11 rounded-xl"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
            </div>
            <div>
              <Label>Length (ft)</Label>
              <Input
                type="number"
                className="mt-1.5 h-11 rounded-xl"
                value={lengthFt}
                onChange={(e) => setLengthFt(e.target.value)}
              />
            </div>
            <div>
              <Label>Width (ft)</Label>
              <Input
                type="number"
                className="mt-1.5 h-11 rounded-xl"
                value={widthFt}
                onChange={(e) => setWidthFt(e.target.value)}
              />
            </div>
            <div>
              <Label>Height (ft)</Label>
              <Input
                type="number"
                className="mt-1.5 h-11 rounded-xl"
                value={heightFt}
                onChange={(e) => setHeightFt(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={isRolling} onCheckedChange={(c) => setIsRolling(c === true)} /> Is
              it rolling?
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={isRunning} onCheckedChange={(c) => setIsRunning(c === true)} /> Is
              it running?
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={needsWinch} onCheckedChange={(c) => setNeedsWinch(c === true)} />{" "}
              Needs a winch?
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={needsLoadingHelp}
                onCheckedChange={(c) => setNeedsLoadingHelp(c === true)}
              />{" "}
              Loading help needed
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={needsUnloadingHelp}
                onCheckedChange={(c) => setNeedsUnloadingHelp(c === true)}
              />{" "}
              Unloading help needed
            </label>
          </div>
        </PremiumCard>
      )}

      {step === 4 && estimate && (
        <PremiumCard className="space-y-4 p-6">
          <h2 className="text-xl font-bold">Trailer recommendation</h2>
          <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-4">
            <Truck className="h-8 w-8 text-brand-primary" />
            <div>
              <p className="font-semibold">{estimate.trailerDisplayName}</p>
              {estimate.rentalRequired && (
                <StatusChip label="Rental required" variant="warning" className="mt-1" />
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Based on cargo category, dimensions, and weight. Final trailer assignment confirmed by
            dispatch.
          </p>
        </PremiumCard>
      )}

      {step === 4 && !estimate && (
        <PremiumCard className="p-6">
          <h2 className="text-xl font-bold">Trailer recommendation</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Waiting for a successful road route before recommending equipment.
          </p>
        </PremiumCard>
      )}

      {step === 5 && (
        <PremiumCard className="space-y-4 p-6">
          <h2 className="text-xl font-bold">Schedule</h2>
          <div>
            <Label>Preferred pickup date</Label>
            <Input
              type="date"
              className="mt-1.5 h-11 rounded-xl"
              value={pickupDate}
              onChange={(e) => setPickupDate(e.target.value)}
            />
          </div>
          <div>
            <Label>Preferred delivery date</Label>
            <Input
              type="date"
              className="mt-1.5 h-11 rounded-xl"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
            />
          </div>
          <div>
            <Label>Delivery time window</Label>
            <Input
              className="mt-1.5 h-11 rounded-xl"
              placeholder="e.g. Morning, 2–4 PM"
              value={deliveryWindow}
              onChange={(e) => setDeliveryWindow(e.target.value)}
            />
          </div>
        </PremiumCard>
      )}

      {step === 6 && estimate && (
        <div className="space-y-4">
          <h2 className="px-1 text-xl font-bold">Review estimate</h2>
          <HaulingEstimateReview
            input={estimateInput}
            estimate={estimate}
            serviceLevel={serviceLevel}
            onServiceLevelChange={setServiceLevel}
            showServiceLevelSelector
            routeMeta={routeMeta}
            serviceAreaMessage={
              [pickupServiceMsg, deliveryServiceMsg].filter(Boolean).join(" ") || null
            }
          />
        </div>
      )}

      {step === 7 && estimate && (
        <div className="space-y-4">
          <h2 className="px-1 text-xl font-bold">Confirm & submit</h2>
          <HaulingEstimateReview
            input={estimateInput}
            estimate={estimate}
            serviceLevel={serviceLevel}
            showDisclaimer
            disclaimerAccepted={disclaimerAccepted}
            onDisclaimerChange={setDisclaimerAccepted}
            rentalDisclaimerAccepted={rentalDisclaimerAccepted}
            onRentalDisclaimerChange={setRentalDisclaimerAccepted}
            routeMeta={routeMeta}
            serviceAreaMessage={
              [pickupServiceMsg, deliveryServiceMsg].filter(Boolean).join(" ") || null
            }
          />
        </div>
      )}

      <div className="sticky bottom-20 flex gap-3 pb-4 md:bottom-4">
        {step < STEPS.length - 1 ? (
          <Button
            className="h-14 flex-1 rounded-2xl bg-gradient-to-r from-brand-primary to-[#C8102E] text-base font-semibold"
            disabled={!canNext()}
            onClick={() => setStep(step + 1)}
          >
            Continue <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        ) : demoMode ? (
          <div className="w-full rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-center text-sm text-amber-950">
            <p className="font-semibold">Preview only</p>
            <p className="mt-1">Call {company.phone} for questions.</p>
          </div>
        ) : (
          <Button
            className="h-14 flex-1 rounded-2xl bg-gradient-to-r from-brand-primary to-[#C8102E] text-base font-semibold"
            disabled={!canNext() || submitting}
            onClick={handleSubmit}
          >
            {submitting ? "Submitting..." : "Confirm hauling request"}{" "}
            <Sparkles className="ml-2 h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
}
