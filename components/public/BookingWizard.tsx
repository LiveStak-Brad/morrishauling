"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { AccessDetails, JunkItem, LoadSizeTier } from "@/types/job";
import type { PaymentMethod, PaymentTiming } from "@/types/payment";
import { useCompany } from "@/lib/company-context";
import { estimateEngine } from "@/lib/estimate-engine";
import { createJob, DEMO_CUSTOMER_IDS } from "@/lib/mock-data";
import { BOOKING_CATEGORIES, getBookingCategory } from "@/lib/booking-categories";
import { AccessDetailsForm } from "@/components/estimate/AccessDetailsForm";
import { LiveEstimate } from "@/components/estimate/LiveEstimate";
import { DisclaimerAccept } from "@/components/estimate/DisclaimerAccept";
import { PaymentOptionPicker } from "@/components/payments/PaymentOptionPicker";
import { BookingCategoryCard } from "@/components/morris/BookingCategoryCard";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { StatusChip } from "@/components/morris/StatusChip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  MapPin,
  Truck,
  Clock,
  Sparkles,
  Plus,
  Trash2,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "category", label: "What to remove", icon: Sparkles },
  { id: "address", label: "Location", icon: MapPin },
  { id: "items", label: "Details", icon: Camera },
  { id: "load", label: "Load size", icon: Truck },
  { id: "access", label: "Access", icon: MapPin },
  { id: "review", label: "Review", icon: Clock },
];

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

export function BookingWizard() {
  const { company, companyId } = useCompany();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(0);

  const [junkType, setJunkType] = useState("general");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [stateVal, setStateVal] = useState("MO");
  const [zip, setZip] = useState("");
  const [items, setItems] = useState<JunkItem[]>([{ id: "1", name: "", quantity: 1 }]);
  const [loadSize, setLoadSize] = useState<LoadSizeTier>("quarter_25");
  const [access, setAccess] = useState<AccessDetails>(defaultAccess);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [paymentTiming, setPaymentTiming] = useState<PaymentTiming>("deposit");
  const [submitting, setSubmitting] = useState(false);
  const [preferredDate, setPreferredDate] = useState("");

  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat) setJunkType(cat);
  }, [searchParams]);

  const location = useMemo(
    () => ({
      lat: company.serviceArea.center.lat + (Math.random() - 0.5) * 0.05,
      lng: company.serviceArea.center.lng + (Math.random() - 0.5) * 0.05,
    }),
    [company.serviceArea, street]
  );

  const estimateInput = useMemo(
    () => ({
      loadSizeTier: loadSize,
      accessDetails: access,
      items: items.filter((i) => i.name.trim()),
      addressLocation: street ? location : undefined,
    }),
    [loadSize, access, items, street, location]
  );

  const estimate = useMemo(
    () => estimateEngine.calculate(estimateInput, company),
    [estimateInput, company]
  );

  const selectedCategory = getBookingCategory(junkType);
  const progress = ((step + 1) / STEPS.length) * 100;

  const addItem = () =>
    setItems([...items, { id: String(Date.now()), name: "", quantity: 1 }]);
  const updateItem = (id: string, patch: Partial<JunkItem>) =>
    setItems(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  const removeItem = (id: string) =>
    setItems(items.length > 1 ? items.filter((i) => i.id !== id) : items);

  const canNext = () => {
    if (step === 0) return !!junkType;
    if (step === 1) return street && city && stateVal && zip;
    if (step === 5) return disclaimerAccepted;
    return true;
  };

  const handleSubmit = async () => {
    if (!disclaimerAccepted) return;
    setSubmitting(true);
    const job = createJob(companyId, {
      companyId,
      customerId: DEMO_CUSTOMER_IDS[companyId],
      status: "submitted",
      junkType,
      items: items.filter((i) => i.name.trim()),
      loadSizeTier: loadSize,
      accessDetails: access,
      address: { street, city, state: stateVal, zip, location },
      photos: [],
      estimate: undefined,
      warnings: estimate.warnings,
      customerNotes: access.notes,
      scheduledDate: preferredDate || undefined,
    });
    job.estimate = estimateEngine.buildEstimate(estimateInput, company, job.id, true);
    setSubmitting(false);
    router.push(`/customer/jobs/${job.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Progress header */}
      <div className="sticky top-16 z-30 -mx-4 bg-background/80 px-4 py-3 backdrop-blur-lg md:top-0">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-muted transition-colors hover:bg-muted/80"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Step {step + 1} of {STEPS.length}
              </p>
              <p className="font-bold">{STEPS[step].label}</p>
            </div>
          </div>
          {estimate && step >= 2 && (
            <StatusChip label={`~$${estimate.total}`} variant="live" />
          )}
        </div>
        <Progress value={progress} className="h-2 rounded-full" />
        <div className="mt-2 flex gap-1 overflow-x-auto pb-1">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                i <= step ? "bg-brand-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>

      {/* Live estimate sidebar on larger screens */}
      {step >= 2 && estimate && (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">{renderStep()}</div>
          <div className="hidden lg:block">
            <EstimateSidebar estimate={estimate} category={selectedCategory?.name} />
          </div>
        </div>
      )}
      {!(step >= 2 && estimate) && renderStep()}

      {step < 2 && estimate && (
        <EstimateSidebar estimate={estimate} category={selectedCategory?.name} className="lg:hidden" />
      )}

      {/* Navigation */}
      <div className="sticky bottom-20 flex gap-3 pb-4 md:bottom-4">
        {step < STEPS.length - 1 ? (
          <Button
            className="h-14 flex-1 rounded-2xl bg-gradient-to-r from-brand-primary to-[#C8102E] text-base font-semibold shadow-lg"
            disabled={!canNext()}
            onClick={() => setStep(step + 1)}
          >
            Continue
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        ) : (
          <Button
            className="h-14 flex-1 rounded-2xl bg-gradient-to-r from-brand-primary to-[#C8102E] text-base font-semibold shadow-lg"
            disabled={!disclaimerAccepted || submitting}
            onClick={handleSubmit}
          >
            {submitting ? "Submitting..." : "Confirm booking"}
            <Sparkles className="ml-2 h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  );

  function renderStep() {
    switch (step) {
      case 0:
        return (
          <div className="animate-slide-up space-y-4 opacity-0" style={{ animationFillMode: "forwards" }}>
            <div>
              <h2 className="text-2xl font-bold">What can we help remove today?</h2>
              <p className="mt-1 text-muted-foreground">
                Select a category to get a tailored estimate
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {BOOKING_CATEGORIES.map((cat) => (
                <BookingCategoryCard
                  key={cat.id}
                  category={cat}
                  selected={junkType === cat.id}
                  onSelect={() => setJunkType(cat.id)}
                />
              ))}
            </div>
          </div>
        );

      case 1:
        return (
          <PremiumCard className="animate-slide-up p-6 opacity-0" style={{ animationFillMode: "forwards" }}>
            <h2 className="text-xl font-bold">Where should we pick up?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              We serve {company.serviceArea.label ?? `within ${company.serviceArea.radiusMiles} miles`}
            </p>
            <div className="mt-5 space-y-4">
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wide">Street address</Label>
                <Input
                  className="mt-1.5 h-12 rounded-xl"
                  placeholder="142 Main St"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wide">City</Label>
                  <Input className="mt-1.5 h-12 rounded-xl" value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wide">State</Label>
                  <Input className="mt-1.5 h-12 rounded-xl" value={stateVal} onChange={(e) => setStateVal(e.target.value)} />
                </div>
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wide">ZIP code</Label>
                <Input className="mt-1.5 h-12 rounded-xl" value={zip} onChange={(e) => setZip(e.target.value)} />
              </div>
            </div>
          </PremiumCard>
        );

      case 2:
        return (
          <div className="space-y-4 animate-slide-up opacity-0" style={{ animationFillMode: "forwards" }}>
            <PremiumCard className="border-2 border-dashed border-brand-primary/30 bg-brand-primary/5 p-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-primary text-white">
                <Camera className="h-8 w-8" />
              </div>
              <h3 className="font-bold">Add photos for a better estimate</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                AI photo analysis coming soon — snap a few shots of your junk
              </p>
              <Input type="file" accept="image/*" multiple className="mt-4" />
            </PremiumCard>

            <PremiumCard className="p-5">
              <h3 className="font-bold">Item list</h3>
              <p className="text-sm text-muted-foreground">Optional — helps us prepare</p>
              <div className="mt-4 space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-2">
                    <Input
                      placeholder="e.g. Old couch"
                      value={item.name}
                      onChange={(e) => updateItem(item.id, { name: e.target.value })}
                      className="h-11 flex-1 rounded-xl"
                    />
                    <Input
                      type="number"
                      min={1}
                      className="h-11 w-16 rounded-xl"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, { quantity: parseInt(e.target.value) || 1 })}
                    />
                    <Button size="icon" variant="ghost" className="rounded-xl" onClick={() => removeItem(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" className="rounded-xl" onClick={addItem}>
                  <Plus className="mr-1 h-4 w-4" /> Add item
                </Button>
              </div>
            </PremiumCard>

            <div className="flex items-start gap-3 rounded-2xl bg-morris-info/10 p-4">
              <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-morris-info" />
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Tip:</strong> Photos help our crew arrive with the right equipment and trailer space.
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-3 animate-slide-up opacity-0" style={{ animationFillMode: "forwards" }}>
            <h2 className="text-xl font-bold">How much junk?</h2>
            <p className="text-sm text-muted-foreground">Estimate your load — we&apos;ll confirm on-site</p>
            {company.pricingRules.loadTiers.map((tier) => (
              <button
                key={tier.tier}
                type="button"
                onClick={() => setLoadSize(tier.tier as LoadSizeTier)}
                className={cn(
                  "w-full rounded-2xl border-2 p-4 text-left transition-all",
                  loadSize === tier.tier
                    ? "border-brand-primary bg-brand-primary/5 shadow-md"
                    : "border-transparent morris-card-interactive"
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{tier.label}</p>
                    <p className="text-sm text-muted-foreground">~{tier.trailerPercent}% trailer</p>
                  </div>
                  <p className="text-xl font-bold text-brand-primary">from ${tier.basePrice}</p>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-primary to-[#C8102E] transition-all"
                    style={{ width: `${Math.min(tier.trailerPercent, 100)}%` }}
                  />
                </div>
              </button>
            ))}
          </div>
        );

      case 4:
        return (
          <PremiumCard className="animate-slide-up p-6 opacity-0" style={{ animationFillMode: "forwards" }}>
            <h2 className="text-xl font-bold">Access details</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Help our crew plan — affects labor estimate
            </p>
            <div className="mt-5">
              <AccessDetailsForm value={access} onChange={setAccess} />
            </div>
          </PremiumCard>
        );

      case 5:
        return (
          <div className="space-y-4 animate-slide-up opacity-0" style={{ animationFillMode: "forwards" }}>
            <PremiumCard className="p-5">
              <Label className="text-xs font-semibold uppercase tracking-wide">Preferred date</Label>
              <Input
                type="date"
                className="mt-2 h-12 rounded-xl"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
              />
            </PremiumCard>

            <LiveEstimate estimate={estimate} />

            <DisclaimerAccept accepted={disclaimerAccepted} onChange={setDisclaimerAccepted} />

            <PremiumCard className="p-5">
              <h3 className="font-bold">Payment preference</h3>
              <div className="mt-4">
                <PaymentOptionPicker
                  method={paymentMethod}
                  timing={paymentTiming}
                  onMethodChange={setPaymentMethod}
                  onTimingChange={setPaymentTiming}
                />
              </div>
            </PremiumCard>
          </div>
        );

      default:
        return null;
    }
  }
}

function EstimateSidebar({
  estimate,
  category,
  className,
}: {
  estimate: NonNullable<ReturnType<typeof estimateEngine.calculate>>;
  category?: string;
  className?: string;
}) {
  return (
    <PremiumCard className={cn("p-5", className)} glow>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Live estimate
      </p>
      <p className="mt-1 text-3xl font-bold text-brand-primary">${estimate.total}</p>
      {category && <p className="mt-1 text-sm text-muted-foreground">{category}</p>}

      <div className="mt-5 space-y-3 border-t pt-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Truck space</span>
          <span className="font-semibold">{estimate.trailerPercent}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-brand-primary transition-all"
            style={{ width: `${Math.min(estimate.trailerPercent, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Est. labor</span>
          <span className="font-semibold">1–2 hrs</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Arrival window</span>
          <span className="font-semibold">Same week</span>
        </div>
      </div>
    </PremiumCard>
  );
}
