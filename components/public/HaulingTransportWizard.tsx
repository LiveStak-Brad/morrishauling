"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { HaulingCargoCategory, HaulingServiceLevel } from "@/types/hauling";
import { serviceLevelToUrgency } from "@/types/hauling";
import { useCompany } from "@/lib/company-context";
import { morrisConfig } from "@/lib/morris-config";
import { haulingTransportEngine } from "@/lib/estimate/hauling-transport-engine";
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
import { ArrowLeft, ArrowRight, Camera, Truck, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

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

function LocationFields({
  prefix,
  values,
  onChange,
}: {
  prefix: string;
  values: {
    street: string;
    city: string;
    state: string;
    zip: string;
    accessNotes: string;
    loadingDock: boolean;
    forklift: boolean;
    assistance: boolean;
  };
  onChange: (patch: Partial<typeof values>) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label>Street address</Label>
        <Input className="mt-1.5 h-11 rounded-xl" value={values.street} onChange={(e) => onChange({ street: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>City</Label>
          <Input className="mt-1.5 h-11 rounded-xl" value={values.city} onChange={(e) => onChange({ city: e.target.value })} />
        </div>
        <div>
          <Label>State</Label>
          <Input className="mt-1.5 h-11 rounded-xl" value={values.state} onChange={(e) => onChange({ state: e.target.value })} />
        </div>
      </div>
      <div>
        <Label>ZIP</Label>
        <Input className="mt-1.5 h-11 rounded-xl" value={values.zip} onChange={(e) => onChange({ zip: e.target.value })} />
      </div>
      <div>
        <Label>Access notes</Label>
        <Input className="mt-1.5 h-11 rounded-xl" placeholder="Gate code, narrow driveway..." value={values.accessNotes} onChange={(e) => onChange({ accessNotes: e.target.value })} />
      </div>
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={values.loadingDock} onCheckedChange={(c) => onChange({ loadingDock: c === true })} />
          Loading dock available
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={values.forklift} onCheckedChange={(c) => onChange({ forklift: c === true })} />
          Forklift available
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={values.assistance} onCheckedChange={(c) => onChange({ assistance: c === true })} />
          Assistance available on site
        </label>
      </div>
    </div>
  );
}

const emptyLoc = { street: "", city: "", state: "MO", zip: "", accessNotes: "", loadingDock: false, forklift: false, assistance: false };

export function HaulingTransportWizard({ demoMode = false }: { demoMode?: boolean }) {
  const { company, companyId } = useCompany();
  const { estimateConfig } = useEffectivePricing(companyId);
  const { customerId: authCustomerId } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [pickup, setPickup] = useState(emptyLoc);
  const [delivery, setDelivery] = useState(emptyLoc);
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

  const estimateInput = useMemo(
    () => ({
      pickup: { city: pickup.city, state: pickup.state, zip: pickup.zip },
      delivery: { city: delivery.city, state: delivery.state, zip: delivery.zip },
      cargoCategory,
      cargoDescription,
      estimatedWeightLbs: weight ? Number(weight) : undefined,
      lengthFt: lengthFt ? Number(lengthFt) : undefined,
      widthFt: widthFt ? Number(widthFt) : undefined,
      heightFt: heightFt ? Number(heightFt) : undefined,
      isRunning,
      isRolling,
      needsWinch,
      needsLoadingHelp: needsLoadingHelp || (!pickup.assistance && !pickup.forklift),
      needsUnloadingHelp: needsUnloadingHelp || (!delivery.assistance && !delivery.forklift),
      serviceLevel,
    }),
    [pickup, delivery, cargoCategory, cargoDescription, weight, lengthFt, widthFt, heightFt, isRunning, isRolling, needsWinch, needsLoadingHelp, needsUnloadingHelp, serviceLevel]
  );

  const estimate = useMemo(
    () => (pickup.zip && delivery.zip ? haulingTransportEngine.calculate(estimateInput, estimateConfig) : null),
    [estimateInput, pickup.zip, delivery.zip, estimateConfig]
  );

  const canNext = () => {
    if (step === 0) return pickup.street && pickup.city && pickup.zip;
    if (step === 1) return delivery.street && delivery.city && delivery.zip;
    if (step === 2) return cargoDescription.trim().length > 2;
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
      router.push("/register?redirect=/book");
      return;
    }
    if (!estimate) return;
    setSubmitting(true);
    try {
      const job = await mutateCreateHaulingJob(companyId, {
        pickup: {
          address: pickup.street,
          city: pickup.city,
          state: pickup.state,
          zip: pickup.zip,
          accessNotes: pickup.accessNotes,
          loadingDock: pickup.loadingDock,
          forkliftAvailable: pickup.forklift,
          assistanceAvailable: pickup.assistance,
        },
        delivery: {
          address: delivery.street,
          city: delivery.city,
          state: delivery.state,
          zip: delivery.zip,
          accessNotes: delivery.accessNotes,
          loadingDock: delivery.loadingDock,
          forkliftAvailable: delivery.forklift,
          assistanceAvailable: delivery.assistance,
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
        needsLoadingHelp: estimateInput.needsLoadingHelp,
        needsUnloadingHelp: estimateInput.needsUnloadingHelp,
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

  return (
    <div className="space-y-6">
      <div className="sticky top-16 z-30 -mx-4 bg-background/80 px-4 py-3 backdrop-blur-lg md:top-0">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button type="button" onClick={() => setStep(step - 1)} className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary">Hauling & Transport</p>
              <p className="font-bold">{STEPS[step]}</p>
            </div>
          </div>
          {estimate && step >= 5 && <StatusChip label={`~$${estimate.total}`} variant="live" />}
        </div>
        <Progress value={((step + 1) / STEPS.length) * 100} className="h-2" />
      </div>

      {step === 0 && (
        <PremiumCard className="p-6">
          <h2 className="text-xl font-bold">Pickup location</h2>
          <div className="mt-4"><LocationFields prefix="pickup" values={pickup} onChange={(p) => setPickup({ ...pickup, ...p })} /></div>
        </PremiumCard>
      )}

      {step === 1 && (
        <PremiumCard className="p-6">
          <h2 className="text-xl font-bold">Delivery location</h2>
          <div className="mt-4"><LocationFields prefix="delivery" values={delivery} onChange={(p) => setDelivery({ ...delivery, ...p })} /></div>
        </PremiumCard>
      )}

      {step === 2 && (
        <PremiumCard className="p-6 space-y-4">
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
                    cargoCategory === cat.id ? "border-brand-primary bg-brand-primary/5" : "border-muted"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>What are we hauling?</Label>
            <Input className="mt-1.5 h-11 rounded-xl" placeholder="Describe the cargo..." value={cargoDescription} onChange={(e) => setCargoDescription(e.target.value)} />
          </div>
          <PremiumCard className="border-dashed p-6 text-center">
            <Camera className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">Photo upload placeholder</p>
          </PremiumCard>
        </PremiumCard>
      )}

      {step === 3 && (
        <PremiumCard className="p-6 space-y-4">
          <h2 className="text-xl font-bold">Size & weight</h2>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Weight (lbs)</Label><Input type="number" className="mt-1.5 h-11 rounded-xl" value={weight} onChange={(e) => setWeight(e.target.value)} /></div>
            <div><Label>Length (ft)</Label><Input type="number" className="mt-1.5 h-11 rounded-xl" value={lengthFt} onChange={(e) => setLengthFt(e.target.value)} /></div>
            <div><Label>Width (ft)</Label><Input type="number" className="mt-1.5 h-11 rounded-xl" value={widthFt} onChange={(e) => setWidthFt(e.target.value)} /></div>
            <div><Label>Height (ft)</Label><Input type="number" className="mt-1.5 h-11 rounded-xl" value={heightFt} onChange={(e) => setHeightFt(e.target.value)} /></div>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={isRolling} onCheckedChange={(c) => setIsRolling(c === true)} /> Is it rolling?</label>
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={isRunning} onCheckedChange={(c) => setIsRunning(c === true)} /> Is it running?</label>
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={needsWinch} onCheckedChange={(c) => setNeedsWinch(c === true)} /> Needs a winch?</label>
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={needsLoadingHelp} onCheckedChange={(c) => setNeedsLoadingHelp(c === true)} /> Loading help needed</label>
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={needsUnloadingHelp} onCheckedChange={(c) => setNeedsUnloadingHelp(c === true)} /> Unloading help needed</label>
          </div>
        </PremiumCard>
      )}

      {step === 4 && estimate && (
        <PremiumCard className="p-6 space-y-4">
          <h2 className="text-xl font-bold">Trailer recommendation</h2>
          <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-4">
            <Truck className="h-8 w-8 text-brand-primary" />
            <div>
              <p className="font-semibold">{estimate.trailerDisplayName}</p>
              {estimate.rentalRequired && <StatusChip label="Rental required" variant="warning" className="mt-1" />}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">Based on cargo category, dimensions, and weight. Final trailer assignment confirmed by dispatch.</p>
        </PremiumCard>
      )}

      {step === 5 && (
        <PremiumCard className="p-6 space-y-4">
          <h2 className="text-xl font-bold">Schedule</h2>
          <div><Label>Preferred pickup date</Label><Input type="date" className="mt-1.5 h-11 rounded-xl" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} /></div>
          <div><Label>Preferred delivery date</Label><Input type="date" className="mt-1.5 h-11 rounded-xl" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} /></div>
          <div><Label>Delivery time window</Label><Input className="mt-1.5 h-11 rounded-xl" placeholder="e.g. Morning, 2–4 PM" value={deliveryWindow} onChange={(e) => setDeliveryWindow(e.target.value)} /></div>
        </PremiumCard>
      )}

      {step === 6 && estimate && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold px-1">Review estimate</h2>
          <HaulingEstimateReview
            input={estimateInput}
            estimate={estimate}
            serviceLevel={serviceLevel}
            onServiceLevelChange={setServiceLevel}
            showServiceLevelSelector
          />
        </div>
      )}

      {step === 7 && estimate && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold px-1">Confirm & submit</h2>
          <HaulingEstimateReview
            input={estimateInput}
            estimate={estimate}
            serviceLevel={serviceLevel}
            showDisclaimer
            disclaimerAccepted={disclaimerAccepted}
            onDisclaimerChange={setDisclaimerAccepted}
            rentalDisclaimerAccepted={rentalDisclaimerAccepted}
            onRentalDisclaimerChange={setRentalDisclaimerAccepted}
          />
        </div>
      )}

      <div className="sticky bottom-20 flex gap-3 pb-4 md:bottom-4">
        {step < STEPS.length - 1 ? (
          <Button className="h-14 flex-1 rounded-2xl bg-gradient-to-r from-brand-primary to-[#C8102E] text-base font-semibold" disabled={!canNext()} onClick={() => setStep(step + 1)}>
            Continue <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        ) : demoMode ? (
          <div className="w-full rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-center text-sm text-amber-950">
            <p className="font-semibold">Preview only — booking not yet live</p>
            <p className="mt-1">
              Booking will open when we launch. Call {company.phone} for questions.
            </p>
          </div>
        ) : (
          <Button className="h-14 flex-1 rounded-2xl bg-gradient-to-r from-brand-primary to-[#C8102E] text-base font-semibold" disabled={!canNext() || submitting} onClick={handleSubmit}>
            {submitting ? "Submitting..." : "Confirm hauling request"} <Sparkles className="ml-2 h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );
}
