"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { VerifiedAddressField } from "@/components/geo/VerifiedAddressField";
import type { VerifiedAddress } from "@/types/address";
import {
  DETACHMENT_PAID_NOTE,
  DETACHMENT_RULE,
  SCRAP_CATEGORIES,
  SCRAP_CATEGORY_LABELS,
  WEIGHT_BANDS,
  WEIGHT_BAND_LABELS,
  type ScrapItemType,
  type ScrapWizardItem,
  type WeightBand,
} from "@/lib/scrap-fridays/types";
import { toast } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { Loader2, Minus, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

const STEPS = [
  "Address",
  "Items",
  "Details",
  "Photos",
  "Access",
  "Friday",
  "Junk estimate",
  "Contact",
  "Review",
] as const;

function newItem(itemTypeId: string): ScrapWizardItem {
  return {
    clientKey: `${itemTypeId}-${Math.random().toString(36).slice(2, 8)}`,
    itemTypeId,
    quantity: 1,
    weightBand: "unsure",
    answers: {},
    unusuallyHeavy: false,
  };
}

export function ScrapFridayWizard() {
  const [step, setStep] = useState(0);
  const [catalog, setCatalog] = useState<ScrapItemType[]>([]);
  const [fridays, setFridays] = useState<Array<{ id: string; route_date: string; status: string }>>(
    []
  );
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [busy, setBusy] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [eligibleMsg, setEligibleMsg] = useState<string | null>(null);
  const [eligible, setEligible] = useState<string | null>(null);
  const [address, setAddress] = useState<VerifiedAddress | null>(null);
  const [items, setItems] = useState<ScrapWizardItem[]>([]);
  const [mediaCount, setMediaCount] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [summary, setSummary] = useState<{
    estimatedWeightLb: number;
    estimatedStopMinutes: number;
    routeUnits: number;
    suggestedCrewCount: number;
    suggestedEquipment: string[];
    manualReviewFlags: string[];
  } | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const [access, setAccess] = useState({
    pickupLocation: "driveway",
    carryDistance: "",
    stairs: "0",
    narrowAccess: false,
    gateAccess: false,
    groundConditions: "firm",
    mudOrSlope: false,
    vehicleAccess: "driveway",
    equipmentAccess: true,
    animals: false,
    otherConcerns: "",
    permissionConfirmed: false,
    authorityConfirmed: false,
    photosMatchConfirmed: false,
    emptyDetachedSafeConfirmed: false,
  });
  const [availability, setAvailability] = useState({
    preference: "flexible" as "morning" | "afternoon" | "flexible" | "custom",
    unavailableNotes: "",
  });
  const [fridayId, setFridayId] = useState<string>("");
  const [junkInterest, setJunkInterest] = useState<"yes" | "no" | "ask_on_arrival">("no");
  const [junkNotes, setJunkNotes] = useState("");
  const [detachedConfirmed, setDetachedConfirmed] = useState(false);
  const [contact, setContact] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
  });
  const [notes, setNotes] = useState("");

  const catalogById = useMemo(
    () => new Map(catalog.map((c) => [c.id, c])),
    [catalog]
  );

  useEffect(() => {
    fetch("/api/public/scrap-fridays/catalog")
      .then((r) => r.json())
      .then((d) => {
        if (d.items) setCatalog(d.items);
        if (d.fridays) setFridays(d.fridays);
        if (d.fridays?.[0]?.id) setFridayId(d.fridays[0].id);
      })
      .finally(() => setLoadingCatalog(false));
  }, []);

  async function checkAddress(next: VerifiedAddress | null) {
    setAddress(next);
    setEligible(null);
    setEligibleMsg(null);
    if (!next?.placeId) return;
    setBusy(true);
    try {
      const res = await fetch("/api/public/scrap-fridays/check-address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeId: next.placeId }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Address check failed");
      setEligible(json.eligible);
      setEligibleMsg(json.message);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Address check failed");
    } finally {
      setBusy(false);
    }
  }

  async function persist(action: "draft" | "save" | "submit" = "save") {
    setBusy(true);
    try {
      const res = await fetch("/api/public/scrap-fridays/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          requestId,
          firstName: contact.firstName,
          lastName: contact.lastName,
          phone: contact.phone,
          email: contact.email,
          addressLine1: address?.line1,
          addressLine2: address?.line2,
          city: address?.city,
          state: address?.state || "MO",
          zip: address?.zip,
          placeId: address?.placeId,
          latitude: address?.lat,
          longitude: address?.lng,
          serviceAreaOutcome: eligible,
          serviceAreaMessage: eligibleMsg,
          scrapFridayDateId: fridayId || null,
          items,
          access,
          availability,
          customerNotes: notes,
          junkEstimateInterest: junkInterest,
          junkEstimateNotes: junkNotes,
          detachedConfirmed,
          authorityConfirmed: access.authorityConfirmed,
          photosConfirmed: mediaCount > 0,
          mediaCount,
          draftPayload: { step },
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Save failed");
      setRequestId(json.request?.id ?? requestId);
      if (json.summary) setSummary(json.summary);
      if (action === "submit") {
        setSubmitted(true);
        toast.success(json.message || "Request submitted");
      }
      return json;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function uploadPhoto(file: File, purpose = "overview") {
    let id = requestId;
    if (!id) {
      const created = await persist("draft");
      id = created?.request?.id;
      if (!id) return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.set("requestId", id);
      form.set("purpose", purpose);
      form.set("file", file);
      const res = await fetch("/api/public/scrap-fridays/photos", {
        method: "POST",
        body: form,
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Upload failed");
      setMediaCount((n) => n + 1);
      toast.success("Photo uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function canContinue(): boolean {
    if (step === 0) return Boolean(address?.placeId && eligible && eligible !== "unsupported");
    if (step === 1) return items.length > 0;
    if (step === 2) return detachedConfirmed;
    if (step === 3) return mediaCount > 0;
    if (step === 4) {
      return (
        access.permissionConfirmed &&
        access.authorityConfirmed &&
        access.photosMatchConfirmed &&
        access.emptyDetachedSafeConfirmed
      );
    }
    if (step === 7) {
      return Boolean(contact.firstName && contact.lastName && contact.phone && contact.email);
    }
    return true;
  }

  if (loadingCatalog) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-black/5 bg-white p-8 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading Free Scrap Fridays…
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="space-y-4 rounded-2xl border border-black/5 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="font-heading text-2xl font-medium">Request received</h2>
        <p className="text-sm text-muted-foreground">
          Thanks — your Free Scrap Friday pickup request is under review. We’ll confirm by text or
          email after photos and route capacity are checked.
        </p>
        {summary ? (
          <p className="text-sm text-muted-foreground">
            Estimated planning summary (not a guarantee): ~{summary.estimatedWeightLb} lb · ~
            {summary.estimatedStopMinutes} min stop.
          </p>
        ) : null}
        <div className="rounded-xl border border-brand-primary/20 bg-brand-primary/5 p-4">
          <p className="font-semibold">While we’re already coming out…</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Since we’ll already be at your property, we can also provide a free estimate for
            furniture, household junk, garage cleanouts, yard debris, or other unwanted items.
          </p>
          <ButtonLinkLike href="/book?division=junk_removal" className="mt-3">
            Add a Junk-Removal Estimate
          </ButtonLinkLike>
        </div>
        <p className="text-xs text-muted-foreground">Request ID: {requestId}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-primary">
          Request My Free Pickup
        </p>
        <div className="mt-3 flex gap-1 overflow-x-auto pb-1">
          {STEPS.map((label, i) => (
            <div
              key={label}
              className={cn(
                "min-w-[4.5rem] rounded-full px-2 py-1 text-center text-[10px] font-medium",
                i === step
                  ? "bg-brand-primary text-white"
                  : i < step
                    ? "bg-brand-primary/15 text-brand-primary"
                    : "bg-muted text-muted-foreground"
              )}
            >
              {label}
            </div>
          ))}
        </div>
      </div>

      {step === 0 && (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold">Pickup address</h3>
          <VerifiedAddressField
            value={address}
            onChange={(v) => void checkAddress(v)}
            label="Where should we pick up?"
          />
          {busy ? <p className="text-sm text-muted-foreground">Checking eligibility…</p> : null}
          {eligibleMsg ? (
            <p
              className={cn(
                "rounded-xl px-3 py-2 text-sm",
                eligible === "available"
                  ? "bg-emerald-50 text-emerald-900"
                  : "bg-amber-50 text-amber-950"
              )}
            >
              {eligibleMsg}
            </p>
          ) : null}
        </section>
      )}

      {step === 1 && (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold">Select scrap items</h3>
          {SCRAP_CATEGORIES.map((cat) => {
            const group = catalog.filter((i) => i.category === cat);
            if (!group.length) return null;
            return (
              <div key={cat}>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {SCRAP_CATEGORY_LABELS[cat]}
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {group.map((item) => {
                    const selected = items.some((i) => i.itemTypeId === item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          if (selected) {
                            setItems((prev) => prev.filter((i) => i.itemTypeId !== item.id));
                          } else {
                            setItems((prev) => [...prev, newItem(item.id)]);
                          }
                        }}
                        className={cn(
                          "min-h-20 rounded-xl border px-3 py-3 text-left text-sm font-medium transition",
                          selected
                            ? "border-brand-primary bg-brand-primary/10 text-foreground"
                            : "border-black/10 bg-[#F7F5F2] hover:border-brand-primary/40"
                        )}
                      >
                        {item.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {step === 2 && (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold">Item details</h3>
          <div className="rounded-xl border border-amber-500/30 bg-amber-50 p-3 text-sm text-amber-950">
            <p className="font-semibold">Detachment rule</p>
            <p className="mt-1">{DETACHMENT_RULE}</p>
            <p className="mt-2 font-medium">{DETACHMENT_PAID_NOTE}</p>
            <label className="mt-3 flex items-start gap-2">
              <input
                type="checkbox"
                className="mt-1"
                checked={detachedConfirmed}
                onChange={(e) => setDetachedConfirmed(e.target.checked)}
              />
              <span>I confirm selected items are already detached and ready for removal.</span>
            </label>
          </div>
          {items.map((item) => {
            const cat = catalogById.get(item.itemTypeId);
            if (!cat) return null;
            return (
              <div key={item.clientKey} className="rounded-xl border border-black/10 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">{cat.name}</p>
                  <button
                    type="button"
                    aria-label="Remove item"
                    onClick={() =>
                      setItems((prev) => prev.filter((i) => i.clientKey !== item.clientKey))
                    }
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="h-10 w-10"
                    onClick={() =>
                      setItems((prev) =>
                        prev.map((i) =>
                          i.clientKey === item.clientKey
                            ? { ...i, quantity: Math.max(1, i.quantity - 1) }
                            : i
                        )
                      )
                    }
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center font-semibold">{item.quantity}</span>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="h-10 w-10"
                    onClick={() =>
                      setItems((prev) =>
                        prev.map((i) =>
                          i.clientKey === item.clientKey
                            ? { ...i, quantity: Math.min(50, i.quantity + 1) }
                            : i
                        )
                      )
                    }
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <label className="mt-3 block text-xs font-medium text-muted-foreground">
                  Estimated weight
                  <select
                    className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={item.weightBand}
                    onChange={(e) =>
                      setItems((prev) =>
                        prev.map((i) =>
                          i.clientKey === item.clientKey
                            ? { ...i, weightBand: e.target.value as WeightBand }
                            : i
                        )
                      )
                    }
                  >
                    {WEIGHT_BANDS.map((b) => (
                      <option key={b} value={b}>
                        {WEIGHT_BAND_LABELS[b]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="mt-2 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean(item.unusuallyHeavy)}
                    onChange={(e) =>
                      setItems((prev) =>
                        prev.map((i) =>
                          i.clientKey === item.clientKey
                            ? { ...i, unusuallyHeavy: e.target.checked }
                            : i
                        )
                      )
                    }
                  />
                  Unusually large or heavy
                </label>
                {(cat.customer_questions ?? []).map((q) => (
                  <label key={q.key} className="mt-2 block text-xs font-medium text-muted-foreground">
                    {q.label}
                    {q.type === "boolean" ? (
                      <span className="mt-1 flex gap-3 text-sm text-foreground">
                        <label className="flex items-center gap-1">
                          <input
                            type="radio"
                            name={`${item.clientKey}-${q.key}`}
                            checked={item.answers[q.key] === true}
                            onChange={() =>
                              setItems((prev) =>
                                prev.map((i) =>
                                  i.clientKey === item.clientKey
                                    ? { ...i, answers: { ...i.answers, [q.key]: true } }
                                    : i
                                )
                              )
                            }
                          />
                          Yes
                        </label>
                        <label className="flex items-center gap-1">
                          <input
                            type="radio"
                            name={`${item.clientKey}-${q.key}`}
                            checked={item.answers[q.key] === false}
                            onChange={() =>
                              setItems((prev) =>
                                prev.map((i) =>
                                  i.clientKey === item.clientKey
                                    ? { ...i, answers: { ...i.answers, [q.key]: false } }
                                    : i
                                )
                              )
                            }
                          />
                          No
                        </label>
                      </span>
                    ) : q.type === "select" ? (
                      <select
                        className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                        value={String(item.answers[q.key] ?? "")}
                        onChange={(e) =>
                          setItems((prev) =>
                            prev.map((i) =>
                              i.clientKey === item.clientKey
                                ? {
                                    ...i,
                                    answers: { ...i.answers, [q.key]: e.target.value },
                                    sizeClass:
                                      q.key === "size_class" ? e.target.value : i.sizeClass,
                                  }
                                : i
                            )
                          )
                        }
                      >
                        <option value="">Select…</option>
                        {(q.options ?? []).map((o) => (
                          <option key={o} value={o}>
                            {o.replaceAll("_", " ")}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        className="mt-1"
                        value={String(item.answers[q.key] ?? "")}
                        onChange={(e) =>
                          setItems((prev) =>
                            prev.map((i) =>
                              i.clientKey === item.clientKey
                                ? { ...i, answers: { ...i.answers, [q.key]: e.target.value } }
                                : i
                            )
                          )
                        }
                      />
                    )}
                  </label>
                ))}
              </div>
            );
          })}
        </section>
      )}

      {step === 3 && (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold">Photos</h3>
          <p className="text-sm text-muted-foreground">
            Upload at least one wide photo showing all items. Close-ups and access-path photos help
            us approve faster.
          </p>
          <Input
            type="file"
            accept="image/*"
            capture="environment"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void uploadPhoto(file, "overview");
            }}
          />
          <p className="text-sm font-medium">{mediaCount} photo(s) uploaded</p>
        </section>
      )}

      {step === 4 && (
        <section className="space-y-3">
          <h3 className="text-lg font-semibold">Access & conditions</h3>
          <label className="block text-xs font-medium text-muted-foreground">
            Pickup location
            <select
              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={access.pickupLocation}
              onChange={(e) => setAccess((a) => ({ ...a, pickupLocation: e.target.value }))}
            >
              {[
                "driveway",
                "garage",
                "inside_home",
                "basement",
                "backyard",
                "shed",
                "barn",
                "field",
                "outbuilding",
                "upstairs",
                "other",
              ].map((v) => (
                <option key={v} value={v}>
                  {v.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <Input
            placeholder="Carry distance (approx.)"
            value={access.carryDistance}
            onChange={(e) => setAccess((a) => ({ ...a, carryDistance: e.target.value }))}
          />
          <Input
            placeholder="Stairs / flights"
            value={access.stairs}
            onChange={(e) => setAccess((a) => ({ ...a, stairs: e.target.value }))}
          />
          {(
            [
              ["narrowAccess", "Narrow doors or hallways"],
              ["gateAccess", "Gate access required"],
              ["mudOrSlope", "Mud or steep slope"],
              ["equipmentAccess", "Loading equipment can get near the items"],
              ["animals", "Dogs or animals on property"],
              ["permissionConfirmed", "Crew has permission to enter the described area"],
              ["authorityConfirmed", "I own these items or have authority to dispose of them"],
              ["photosMatchConfirmed", "Photos show the exact items requested"],
              ["emptyDetachedSafeConfirmed", "Items are empty, detached, and safe to handle"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={Boolean(access[key])}
                onChange={(e) => setAccess((a) => ({ ...a, [key]: e.target.checked }))}
              />
              {label}
            </label>
          ))}
          <Textarea
            placeholder="Other access concerns"
            value={access.otherConcerns}
            onChange={(e) => setAccess((a) => ({ ...a, otherConcerns: e.target.value }))}
          />
        </section>
      )}

      {step === 5 && (
        <section className="space-y-3">
          <h3 className="text-lg font-semibold">Friday availability</h3>
          <p className="text-sm text-muted-foreground">
            Flexible availability helps us create the most efficient route and serve more local
            households. Exact times are assigned after approval.
          </p>
          {fridays.length > 0 ? (
            <label className="block text-xs font-medium text-muted-foreground">
              Preferred Friday
              <select
                className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={fridayId}
                onChange={(e) => setFridayId(e.target.value)}
              >
                {fridays.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.route_date} ({f.status})
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <p className="rounded-xl bg-muted px-3 py-2 text-sm">
              No open Friday dates are listed yet — submit anyway and we’ll place you on the next
              available route or waitlist.
            </p>
          )}
          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                ["morning", "Friday morning"],
                ["afternoon", "Friday afternoon"],
                ["flexible", "Flexible Friday"],
                ["custom", "Custom unavailable periods"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setAvailability((a) => ({ ...a, preference: value }))}
                className={cn(
                  "min-h-12 rounded-xl border px-3 py-2 text-sm font-medium",
                  availability.preference === value
                    ? "border-brand-primary bg-brand-primary/10"
                    : "border-black/10"
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <Textarea
            placeholder="Times you cannot be home"
            value={availability.unavailableNotes}
            onChange={(e) =>
              setAvailability((a) => ({ ...a, unavailableNotes: e.target.value }))
            }
          />
        </section>
      )}

      {step === 6 && (
        <section className="space-y-3">
          <h3 className="text-lg font-semibold">Non-metal junk?</h3>
          <p className="text-sm text-muted-foreground">
            Do you have any non-metal junk you would like us to look at while we are there?
          </p>
          {(
            [
              ["yes", "Yes, request a free junk-removal estimate"],
              ["no", "No, scrap pickup only"],
              ["ask_on_arrival", "Ask me when you arrive"],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className="flex items-start gap-2 text-sm">
              <input
                type="radio"
                name="junk"
                checked={junkInterest === value}
                onChange={() => setJunkInterest(value)}
              />
              {label}
            </label>
          ))}
          {junkInterest === "yes" ? (
            <Textarea
              placeholder="Describe non-metal items (furniture, bags, yard debris…)"
              value={junkNotes}
              onChange={(e) => setJunkNotes(e.target.value)}
            />
          ) : null}
        </section>
      )}

      {step === 7 && (
        <section className="space-y-3">
          <h3 className="text-lg font-semibold">Contact</h3>
          <p className="text-sm text-muted-foreground">
            We’ll match you to an existing customer profile when possible — no separate signup step
            required to submit.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              required
              placeholder="First name"
              value={contact.firstName}
              onChange={(e) => setContact((c) => ({ ...c, firstName: e.target.value }))}
            />
            <Input
              required
              placeholder="Last name"
              value={contact.lastName}
              onChange={(e) => setContact((c) => ({ ...c, lastName: e.target.value }))}
            />
          </div>
          <Input
            required
            placeholder="Mobile phone"
            value={contact.phone}
            onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))}
          />
          <Input
            required
            type="email"
            placeholder="Email"
            value={contact.email}
            onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
          />
          <Textarea
            placeholder="Notes for the crew (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </section>
      )}

      {step === 8 && (
        <section className="space-y-3">
          <h3 className="text-lg font-semibold">Review & submit</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>
              Address: {address?.line1}, {address?.city} {address?.zip}
            </li>
            <li>Items: {items.map((i) => catalogById.get(i.itemTypeId)?.name).join(", ")}</li>
            <li>Photos: {mediaCount}</li>
            <li>Availability: {availability.preference}</li>
            <li>Junk estimate: {junkInterest}</li>
          </ul>
          {summary ? (
            <p className="rounded-xl bg-muted px-3 py-2 text-sm">
              Planning estimate: ~{summary.estimatedWeightLb} lb · ~{summary.estimatedStopMinutes}{" "}
              min · {summary.suggestedCrewCount} crew (subject to review)
            </p>
          ) : null}
          {summary?.manualReviewFlags?.length ? (
            <ul className="text-sm text-amber-800">
              {summary.manualReviewFlags.map((f) => (
                <li key={f}>• {f}</li>
              ))}
            </ul>
          ) : null}
        </section>
      )}

      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-between">
        <Button
          type="button"
          variant="outline"
          disabled={step === 0 || busy}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          className="h-11 rounded-full"
        >
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button
            type="button"
            disabled={!canContinue() || busy}
            className="h-11 rounded-full"
            onClick={() => {
              void persist("save").then(() => setStep((s) => s + 1));
            }}
          >
            Continue
          </Button>
        ) : (
          <Button
            type="button"
            disabled={!canContinue() || busy}
            className="h-11 rounded-full"
            onClick={() => void persist("submit")}
          >
            {busy ? "Submitting…" : "Submit pickup request"}
          </Button>
        )}
      </div>
    </div>
  );
}

function ButtonLinkLike({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-full bg-brand-primary px-5 text-sm font-semibold text-white hover:bg-brand-primary/90",
        className
      )}
    >
      {children}
    </Link>
  );
}
