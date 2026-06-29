"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { AccessDetails, JunkItem, LoadSizeTier } from "@/types/job";
import type { JunkEstimateMode, JunkPriorityLevel, SelectedCommonItem } from "@/types/junk-removal";
import type { PaymentMethod, PaymentTiming } from "@/types/payment";
import { useCompany } from "@/lib/company-context";
import { junkRemovalEngine } from "@/lib/estimate/junk-removal-engine";
import { mutateCreateJob } from "@/lib/api/mutations";
import { uploadJobPhotos } from "@/lib/jobs/upload-photos";
import { toast } from "@/lib/toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { useEffectivePricing } from "@/hooks/useEffectivePricing";
import { BOOKING_CATEGORIES, getBookingCategory } from "@/lib/booking-categories";
import { AccessDetailsForm } from "@/components/estimate/AccessDetailsForm";
import { DisclaimerAccept } from "@/components/estimate/DisclaimerAccept";
import { PaymentOptionPicker } from "@/components/payments/PaymentOptionPicker";
import { BookingCategoryCard } from "@/components/morris/BookingCategoryCard";
import { JunkEstimateReview } from "@/components/junk/JunkEstimateReview";
import type { SubmittedPhoto } from "@/components/junk/SubmittedPhotosCard";
import { PhotoUploadSection } from "@/components/booking/PhotoUploadSection";
import { EstimatedArrivalCalendar } from "@/components/booking/EstimatedArrivalCalendar";
import type { ArrivalDayOption, ArrivalTimeSlot } from "@/lib/booking/arrival-slots";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { StatusChip } from "@/components/morris/StatusChip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Truck,
  Sparkles,
  Plus,
  Trash2,
  Package,
  Home,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";

const defaultAccess: AccessDetails = {
  stairs: false,
  elevator: false,
  longCarryFt: 0,
  basement: false,
  attic: false,
  tightAccess: false,
  heavyItems: false,
  specialDisposal: false,
};

const PRIORITY_OPTIONS: { id: JunkPriorityLevel; label: string; desc: string }[] = [
  { id: "flexible", label: "Flexible", desc: "Best price, open schedule" },
  { id: "standard", label: "Standard", desc: "Normal scheduling" },
  { id: "same_day", label: "Same day", desc: "Within 24 hours" },
  { id: "emergency", label: "Emergency", desc: "ASAP priority" },
];

const DEMO_PRIORITY_OPTIONS: { id: JunkPriorityLevel; label: string; desc: string }[] = [
  { id: "flexible", label: "Flexible", desc: "Planned scheduling window (preview)" },
  { id: "standard", label: "Standard", desc: "Typical scheduling option (preview)" },
  { id: "same_day", label: "Priority", desc: "Soonest window — preview only" },
  { id: "emergency", label: "Urgent", desc: "Highest priority — preview only" },
];

function stepsForMode(mode: JunkEstimateMode | null) {
  if (mode === "single_item") {
    return ["Mode", "Location", "Items", "Access", "Schedule", "Review"];
  }
  if (mode === "cleanout") {
    return ["Mode", "Category", "Location", "Details", "Load", "Access", "Schedule", "Review"];
  }
  return ["Mode"];
}

const BOOKING_DRAFT_KEY = "morris:booking-draft";

type BookingDraft = {
  mode: JunkEstimateMode;
  step: number;
  junkType: string;
  street: string;
  city: string;
  stateVal: string;
  zip: string;
  loadSize: LoadSizeTier;
  access: AccessDetails;
  priorityLevel: JunkPriorityLevel;
  selectedArrivalSlotId: string;
  disclaimerAccepted: boolean;
};

export function BookingWizard({ demoMode = false }: { demoMode?: boolean }) {
  const { company, companyId } = useCompany();
  const { estimateConfig, loading: pricingLoading } = useEffectivePricing(companyId);
  const { customerId: authCustomerId } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<JunkEstimateMode | null>(null);
  const [step, setStep] = useState(0);

  const [junkType, setJunkType] = useState("general");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [stateVal, setStateVal] = useState("MO");
  const [zip, setZip] = useState("");
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [items, setItems] = useState<JunkItem[]>([{ id: "1", name: "", quantity: 1 }]);
  const [loadSize, setLoadSize] = useState<LoadSizeTier>("quarter_25");
  const [access, setAccess] = useState<AccessDetails>(defaultAccess);
  const [priorityLevel, setPriorityLevel] = useState<JunkPriorityLevel>("standard");
  const [submittedPhotos, setSubmittedPhotos] = useState<SubmittedPhoto[]>([]);
  const [selectedArrivalSlotId, setSelectedArrivalSlotId] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<{
    id: string;
    date: string;
    label: string;
    discountAmount: number;
    discountReason?: string;
  } | null>(null);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [paymentTiming, setPaymentTiming] = useState<PaymentTiming>("deposit");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat) {
      setJunkType(cat);
      setMode("cleanout");
      setStep(1);
    }
  }, [searchParams]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(BOOKING_DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw) as BookingDraft;
      setMode(draft.mode);
      setStep(draft.step);
      setJunkType(draft.junkType);
      setStreet(draft.street);
      setCity(draft.city);
      setStateVal(draft.stateVal);
      setZip(draft.zip);
      setLoadSize(draft.loadSize);
      setAccess(draft.access);
      setPriorityLevel(draft.priorityLevel);
      setSelectedArrivalSlotId(draft.selectedArrivalSlotId);
      setDisclaimerAccepted(draft.disclaimerAccepted);
      sessionStorage.removeItem(BOOKING_DRAFT_KEY);
    } catch {
      sessionStorage.removeItem(BOOKING_DRAFT_KEY);
    }
  }, []);

  const STEPS = stepsForMode(mode);
  const progress = ((step + 1) / STEPS.length) * 100;

  const location = useMemo(
    () => ({
      lat: company.serviceArea.center.lat + (Math.random() - 0.5) * 0.05,
      lng: company.serviceArea.center.lng + (Math.random() - 0.5) * 0.05,
    }),
    [company.serviceArea, street]
  );

  const selectedCommonItems: SelectedCommonItem[] = useMemo(
    () =>
      Object.entries(selectedItems)
        .filter(([, qty]) => qty > 0)
        .map(([itemId, quantity]) => ({ itemId, quantity })),
    [selectedItems]
  );

  const hasPhotos = submittedPhotos.length > 0;

  const estimateInput = useMemo(
    () => ({
      mode: mode ?? "cleanout",
      selectedItems: mode === "single_item" ? selectedCommonItems : undefined,
      loadSizeTier: mode === "cleanout" ? loadSize : undefined,
      junkCategory: junkType,
      accessDetails: access,
      items: items.filter((i) => i.name.trim()),
      addressLocation: street ? location : undefined,
      zip,
      priorityLevel,
      hasPhotos,
      customerNotes: access.notes,
      scheduleSlot: selectedSlot
        ? {
            id: selectedSlot.id,
            windowLabel: selectedSlot.label,
            discountAmount: selectedSlot.discountAmount,
            discountReason: selectedSlot.discountReason,
          }
        : undefined,
    }),
    [mode, selectedCommonItems, loadSize, junkType, access, items, street, location, zip, priorityLevel, submittedPhotos, selectedSlot]
  );

  const estimate = useMemo(
    () => (mode && (street || step === 0) ? junkRemovalEngine.calculate(estimateInput, estimateConfig) : null),
    [estimateInput, mode, street, step, estimateConfig]
  );

  const selectedCategory = getBookingCategory(junkType);

  const setItemQty = (itemId: string, delta: number) => {
    setSelectedItems((prev) => {
      const next = { ...prev, [itemId]: Math.max(0, (prev[itemId] ?? 0) + delta) };
      if (next[itemId] === 0) delete next[itemId];
      return next;
    });
  };

  const addItem = () => setItems([...items, { id: String(Date.now()), name: "", quantity: 1 }]);
  const updateItem = (id: string, patch: Partial<JunkItem>) =>
    setItems(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  const removeItem = (id: string) =>
    setItems(items.length > 1 ? items.filter((i) => i.id !== id) : items);

  const canNext = () => {
    const label = STEPS[step];
    if (label === "Mode") return !!mode;
    if (label === "Category") return !!junkType;
    if (label === "Location") return street && city && stateVal && zip;
    if (label === "Items") return selectedCommonItems.length > 0;
    if (label === "Schedule") return !!selectedArrivalSlotId;
    if (label === "Review") return disclaimerAccepted;
    return true;
  };

  const handleSubmit = async () => {
    if (demoMode) return;
    if (!disclaimerAccepted || !mode || !estimate) return;
    if (!authCustomerId) {
      const draft: BookingDraft = {
        mode,
        step,
        junkType,
        street,
        city,
        stateVal,
        zip,
        loadSize,
        access,
        priorityLevel,
        selectedArrivalSlotId,
        disclaimerAccepted,
      };
      sessionStorage.setItem(BOOKING_DRAFT_KEY, JSON.stringify(draft));
      toast.info("Create a free account to submit your booking — your form details are saved.");
      router.push("/register?redirect=/book");
      return;
    }
    setSubmitting(true);
    try {
      const customerId = authCustomerId;
      if (!customerId) return;
      const flexLine = estimate.customerLines.find((l) => l.id === "flexible_scheduling");
      const flexibleDiscount = flexLine ? Math.abs(flexLine.amount) : 0;

      const jrd = {
        id: "pending",
        companyId,
        jobId: "pending",
        estimateMode: mode,
        selectedItems: mode === "single_item" ? selectedCommonItems : undefined,
        selectedCategory: junkType,
        loadPercentage: estimate.trailerPercent,
        estimatedLaborMinutes: estimate.estimatedLaborMinutes,
        estimatedCrewSize: estimate.estimatedCrewSize,
        stairsFlights: access.stairFlights ?? (access.stairs ? 1 : 0),
        elevatorAvailable: access.elevator,
        basement: access.basement,
        attic: access.attic,
        longCarryDistanceFt: access.longCarryFt,
        heavyItems: access.heavyItems,
        specialDisposal: access.specialDisposal,
        dumpFeeEstimate: estimate.dumpFeeEstimate,
        mileageEstimate: estimate.mileageEstimate,
        fuelAdjustment: estimate.fuelAdjustment,
        priorityLevel,
        reviewRequired: estimate.reviewRequired,
        reviewReasons: estimate.reviewReasons,
        reviewStatus: estimate.reviewStatus,
        customerPricingBreakdown: estimate.customerLines,
        internalCostBreakdown: estimate.internalLines,
        estimatedProfit: estimate.internalProfit.grossProfit,
        estimatedMargin: estimate.internalProfit.profitMargin,
        originBaseId: estimate.route.originBaseId,
        originBaseName: estimate.route.originBaseName,
        disposalSelectionReason: estimate.route.disposalSelectionReason,
        selectedDisposalSiteId: estimate.route.selectedDisposalSiteId,
        selectedDisposalSiteName: estimate.route.selectedDisposalSiteName,
        disposalCategory: estimate.route.disposalCategory,
        estimatedDispatchMiles: estimate.route.dispatchMiles,
        estimatedCustomerToDisposalMiles: estimate.route.customerToDisposalMiles,
        estimatedReturnMiles: estimate.route.returnMiles,
        estimatedTotalRouteMiles: estimate.route.totalRouteMiles,
        estimatedDriveMinutes: estimate.route.estimatedDriveMinutes,
        minimumsApplied: estimate.route.minimumsApplied,
        disposalUncertain: estimate.route.disposalUncertain,
        selectedScheduleSlotId: selectedSlot?.id,
        scheduledWindowLabel: selectedSlot?.label,
        flexibleDiscountAmount: flexibleDiscount,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const estimateBuilt = junkRemovalEngine.buildEstimate(estimateInput, estimateConfig, "pending", true);

      const job = await mutateCreateJob(companyId, {
        companyId,
        customerId,
        serviceType: "junk_removal",
        status: estimate.reviewRequired ? "submitted" : "estimated",
        junkType,
        items: items.filter((i) => i.name.trim()),
        loadSizeTier: loadSize,
        accessDetails: access,
        address: { street, city, state: stateVal, zip, location },
        photos: [],
        estimate: estimateBuilt,
        estimateType: "junk_removal",
        pricingBreakdown: estimate.customerLines,
        disclaimerAccepted: true,
        junkRemovalDetails: jrd,
        reviewStatus: estimate.reviewStatus,
        warnings: estimate.warnings,
        customerNotes: access.notes,
        scheduledDate: selectedSlot?.date,
        selectedScheduleSlotId: selectedSlot?.id,
        scheduledWindowLabel: selectedSlot?.label,
        flexibleDiscountAmount: flexibleDiscount,
      });
      const files = submittedPhotos.map((p) => p.file).filter((f): f is File => !!f);
      if (files.length > 0) {
        try {
          await uploadJobPhotos(job.id, files, "customer_upload");
        } catch {
          toast.info("Booking saved, but some photos failed to upload. You can add them from your job page.");
        }
      }
      router.push(`/customer/jobs/${job.id}`);
    } finally {
      setSubmitting(false);
    }
  };

  const goBack = () => {
    if (step === 0) return;
    if (step === 1 && mode) {
      setMode(null);
      setStep(0);
      return;
    }
    setStep(step - 1);
  };

  return (
    <div className="space-y-6">
      <div className="sticky top-16 z-30 -mx-4 bg-background/80 px-4 py-3 backdrop-blur-lg md:top-0">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button type="button" onClick={goBack} className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary">Junk Removal</p>
              <p className="font-bold">{STEPS[step]}</p>
            </div>
          </div>
          {estimate && step > 0 && <StatusChip label={`~$${estimate.total}`} variant="live" />}
        </div>
        <Progress value={progress} className="h-2 rounded-full" />
      </div>

      {renderStep()}

      {STEPS[step] === "Review" && !authCustomerId && !demoMode && (
        <PremiumCard className="border-brand-primary/30 bg-brand-primary/5 p-4 text-sm">
          <p className="font-semibold">Account required to submit</p>
          <p className="mt-1 text-muted-foreground">
            A free Morris customer account lets you track your job, receive updates, pay invoices, and view photos.
            Your booking details are saved if you sign in or register now.
          </p>
        </PremiumCard>
      )}

      <div className="sticky bottom-20 flex gap-3 pb-4 md:bottom-4">
        {STEPS[step] !== "Review" ? (
          <Button
            className="h-14 flex-1 rounded-2xl bg-gradient-to-r from-brand-primary to-[#C8102E] text-base font-semibold shadow-lg"
            disabled={!canNext()}
            onClick={() => setStep(step + 1)}
          >
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
          <Button
            className="h-14 flex-1 rounded-2xl bg-gradient-to-r from-brand-primary to-[#C8102E] text-base font-semibold shadow-lg"
            disabled={!disclaimerAccepted || submitting}
            onClick={handleSubmit}
          >
            {submitting ? "Submitting..." : estimate?.reviewRequired ? "Submit for review" : "Confirm booking"}
            <Sparkles className="ml-2 h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );

  function renderStep() {
    const label = STEPS[step];

    if (label === "Mode") {
      return (
        <div className="space-y-4 animate-slide-up">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-primary">Step 1</p>
            <h2 className="text-2xl font-bold">What are we removing?</h2>
            <p className="mt-1 text-muted-foreground">Choose the type of junk removal you need</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => { setMode("single_item"); setStep(1); }}
              className="rounded-2xl border-2 border-muted p-6 text-left transition-all hover:border-brand-primary hover:bg-brand-primary/5"
            >
              <Package className="mb-3 h-8 w-8 text-brand-primary" />
              <p className="text-lg font-bold">Single item pickup</p>
              <p className="mt-1 text-sm text-muted-foreground">Couch, mattress, appliance, piano — priced per item</p>
            </button>
            <button
              type="button"
              onClick={() => { setMode("cleanout"); setStep(1); }}
              className="rounded-2xl border-2 border-muted p-6 text-left transition-all hover:border-brand-primary hover:bg-brand-primary/5"
            >
              <Home className="mb-3 h-8 w-8 text-brand-primary" />
              <p className="text-lg font-bold">Volume / trailer pickup</p>
              <p className="mt-1 text-sm text-muted-foreground">Small pickup through multiple loads — garage, estate, construction, and more</p>
            </button>
          </div>
        </div>
      );
    }

    if (label === "Category") {
      return (
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold">What are we hauling?</h2>
            <p className="mt-1 text-sm text-muted-foreground">Choose a category — you&apos;ll pick trailer size next</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {BOOKING_CATEGORIES.map((cat) => (
              <BookingCategoryCard key={cat.id} category={cat} selected={junkType === cat.id} onSelect={() => setJunkType(cat.id)} />
            ))}
          </div>
        </div>
      );
    }

    if (label === "Location") {
      return (
        <PremiumCard className="p-6">
          <h2 className="text-xl font-bold">Where should we pick up?</h2>
          <p className="mt-1 text-sm text-muted-foreground">{company.serviceArea.label}</p>
          <div className="mt-5 space-y-4">
            <div>
              <Label>Street address</Label>
              <Input className="mt-1.5 h-12 rounded-xl" value={street} onChange={(e) => setStreet(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>City</Label><Input className="mt-1.5 h-12 rounded-xl" value={city} onChange={(e) => setCity(e.target.value)} /></div>
              <div><Label>State</Label><Input className="mt-1.5 h-12 rounded-xl" value={stateVal} onChange={(e) => setStateVal(e.target.value)} /></div>
            </div>
            <div><Label>ZIP</Label><Input className="mt-1.5 h-12 rounded-xl" value={zip} onChange={(e) => setZip(e.target.value)} /></div>
          </div>
        </PremiumCard>
      );
    }

    if (label === "Items") {
      return (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold">Select items</h2>
            <p className="text-sm text-muted-foreground">Tap + to add items — estimate updates live</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {estimateConfig.commonJunkItems.map((item) => {
              const qty = selectedItems[item.id] ?? 0;
              return (
                <PremiumCard key={item.id} className={cn("p-3", qty > 0 && "border-brand-primary bg-brand-primary/5")}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">from ${item.basePrice}</p>
                      {item.heavy && <StatusChip label="Heavy" variant="warning" className="mt-1 text-[10px]" />}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="outline" className="h-8 w-8 rounded-lg" onClick={() => setItemQty(item.id, -1)} disabled={qty === 0}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center font-bold">{qty}</span>
                      <Button size="icon" variant="outline" className="h-8 w-8 rounded-lg" onClick={() => setItemQty(item.id, 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </PremiumCard>
              );
            })}
          </div>
          <PhotoUploadSection
            photos={submittedPhotos}
            onPhotosChange={setSubmittedPhotos}
          />
        </div>
      );
    }

    if (label === "Details") {
      return (
        <div className="space-y-4">
          <PhotoUploadSection
            photos={submittedPhotos}
            onPhotosChange={setSubmittedPhotos}
            title="Add photos (recommended)"
            description="Photos help our team review the job and confirm pricing. Complex loads are reviewed by a person — not AI."
          />
          <PremiumCard className="p-5">
            <h3 className="font-bold">Item list</h3>
            <div className="mt-4 space-y-2">
              {items.map((item) => (
                <div key={item.id} className="flex gap-2">
                  <Input placeholder="Describe item..." value={item.name} onChange={(e) => updateItem(item.id, { name: e.target.value })} className="h-11 flex-1 rounded-xl" />
                  <Input type="number" min={1} className="h-11 w-16 rounded-xl" value={item.quantity} onChange={(e) => updateItem(item.id, { quantity: parseInt(e.target.value) || 1 })} />
                  <Button size="icon" variant="ghost" onClick={() => removeItem(item.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
              <Button variant="outline" size="sm" className="rounded-xl" onClick={addItem}><Plus className="mr-1 h-4 w-4" /> Add item</Button>
            </div>
          </PremiumCard>
        </div>
      );
    }

    if (label === "Load") {
      return (
        <div className="space-y-3">
          <div>
            <h2 className="text-xl font-bold">How much junk?</h2>
            <p className="text-sm text-muted-foreground">Choose a trailer volume — you can list individual items on the next steps</p>
          </div>
          {estimateConfig.pricingRules.loadTiers.map((tier) => (
            <button
              key={tier.tier}
              type="button"
              onClick={() => setLoadSize(tier.tier as LoadSizeTier)}
              className={cn("w-full rounded-2xl border-2 p-4 text-left", loadSize === tier.tier ? "border-brand-primary bg-brand-primary/5" : "border-transparent morris-card-interactive")}
            >
              <div className="flex justify-between">
                <div>
                  <p className="font-semibold">{tier.label}</p>
                  <p className="text-sm text-muted-foreground">~{tier.trailerPercent}% trailer</p>
                </div>
                <p className="text-xl font-bold text-brand-primary">from ${tier.basePrice}</p>
              </div>
            </button>
          ))}
        </div>
      );
    }

    if (label === "Access") {
      return (
        <PremiumCard className="p-6">
          <h2 className="text-xl font-bold">Access details</h2>
          <div className="mt-5"><AccessDetailsForm value={access} onChange={setAccess} /></div>
        </PremiumCard>
      );
    }

    if (label === "Schedule") {
      return (
        <div className="space-y-4">
          <EstimatedArrivalCalendar
            companyId={companyId}
            selectedSlotId={selectedArrivalSlotId}
            previewMode={demoMode}
            onSelect={(slotId, day: ArrivalDayOption, slot: ArrivalTimeSlot) => {
              setSelectedArrivalSlotId(slotId);
              setSelectedSlot({
                id: slotId,
                date: day.date,
                label: slot.label,
                discountAmount: slot.discountAmount ?? 0,
                discountReason: slot.discountLabel,
              });
              if (slot.window === "flexible") {
                setPriorityLevel("flexible");
              }
            }}
          />
          <PremiumCard className="p-5">
            <h3 className="font-bold">Service priority</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {demoMode
                ? "Preview how priority choices may affect an estimate — not a live scheduling promise."
                : "Need it sooner? Priority options may affect your estimate."}
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {(demoMode ? DEMO_PRIORITY_OPTIONS : PRIORITY_OPTIONS).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPriorityLevel(p.id)}
                  className={cn("rounded-xl border-2 p-3 text-left", priorityLevel === p.id ? "border-brand-primary bg-brand-primary/5" : "border-muted")}
                >
                  <p className="font-semibold">{p.label}</p>
                  <p className="text-xs text-muted-foreground">{p.desc}</p>
                </button>
              ))}
            </div>
          </PremiumCard>
        </div>
      );
    }

    if (label === "Review" && estimate && mode) {
      return (
        <div className="space-y-4">
          <JunkEstimateReview
            mode={mode}
            estimate={estimate}
            selectedItems={selectedCommonItems}
            categoryId={junkType}
            loadSizeTier={loadSize}
            priorityLevel={priorityLevel}
            audience="customer"
            submittedPhotos={submittedPhotos}
          />
          <DisclaimerAccept accepted={disclaimerAccepted} onChange={setDisclaimerAccepted} />
          <PremiumCard className="p-5">
            <h3 className="font-bold">Payment preference</h3>
            <div className="mt-4">
              <PaymentOptionPicker method={paymentMethod} timing={paymentTiming} onMethodChange={setPaymentMethod} onTimingChange={setPaymentTiming} />
            </div>
          </PremiumCard>
        </div>
      );
    }

    return null;
  }
}
