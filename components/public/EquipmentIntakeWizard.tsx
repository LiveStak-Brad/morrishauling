"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/lib/toast";
import { trackMarketingEvent } from "@/lib/seo/analytics";
import { BookingSocialUpsell } from "@/components/social/BookingSocialUpsell";
import { EQUIPMENT_LEGAL_POINTS, EQUIPMENT_PRELAUNCH_NOTE } from "@/lib/equipment/legal";
import {
  ACCESS_FLAG_OPTIONS,
  DESIRED_RESULT_OPTIONS,
  DIAMETER_OPTIONS,
  DENSITY_OPTIONS,
  MATERIAL_TYPE_OPTIONS,
  SCHEDULING_OPTIONS,
  SITE_WORK_TYPES,
  TERRAIN_OPTIONS,
  VEGETATION_OPTIONS,
} from "@/lib/equipment/intake-options";
import { publicCatalogServices } from "@/lib/equipment/catalog";
import type { DivisionId } from "@/lib/divisions";
import { getDivision, isEquipmentDivision } from "@/lib/divisions";
import {
  KEEP_VEGETATION_OPTIONS,
  LAND_CLEARING_PROJECT_GOALS,
  PROPERTY_END_USE_OPTIONS,
  goalLabel,
  parseProjectGoal,
  serviceSlugForGoal,
} from "@/lib/land-clearing/intents";
import type { WorkArea } from "@/lib/land-clearing/acreage";
import { MAP_ACREAGE_DISCLAIMER } from "@/lib/land-clearing/acreage";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const WorkAreaMapStep = dynamic(
  () => import("@/components/public/WorkAreaMapStep").then((m) => m.WorkAreaMapStep),
  { ssr: false, loading: () => <p className="text-xs text-muted-foreground">Loading map option…</p> }
);

type AccessFlags = Record<(typeof ACCESS_FLAG_OPTIONS)[number]["id"], boolean>;

const emptyAccess = (): AccessFlags =>
  ACCESS_FLAG_OPTIONS.reduce((acc, o) => {
    acc[o.id] = false;
    return acc;
  }, {} as AccessFlags);

function toggleInList(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

function ChipGroup({
  options,
  value,
  onChange,
  multiple,
  name,
}: {
  options: readonly { id: string; label: string }[];
  value: string | string[];
  onChange: (next: string | string[]) => void;
  multiple?: boolean;
  name: string;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={name}>
      {options.map((opt) => {
        const selected = multiple
          ? (value as string[]).includes(opt.id)
          : value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            aria-pressed={selected}
            onClick={() => {
              if (multiple) onChange(toggleInList(value as string[], opt.id));
              else onChange(opt.id);
            }}
            className={cn(
              "min-h-11 rounded-full border px-3 py-2 text-left text-sm font-medium",
              selected
                ? "border-brand-primary bg-brand-primary text-white"
                : "border-black/10 bg-white hover:border-brand-primary/30"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function EquipmentIntakeWizard({
  division: divisionProp,
}: {
  division: DivisionId;
}) {
  const searchParams = useSearchParams();
  const division = isEquipmentDivision(divisionProp) ? divisionProp : "land_clearing";
  const config = getDivision(division);
  const services = publicCatalogServices(division);
  const presetGoal = parseProjectGoal(searchParams.get("goal"));
  const presetService = searchParams.get("service") ?? "";
  const startedRef = useRef(false);
  const mediaTrackedRef = useRef(false);

  const steps = useMemo(() => {
    if (division === "land_clearing") {
      return ["Contact", "Property", "Vegetation", "Access", "Media", "Review"];
    }
    if (division === "site_work") {
      return ["Contact", "Work", "Site", "Access", "Media", "Review"];
    }
    return ["Contact", "Job", "Access", "Media", "Review"];
  }, [division]);

  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ customerUrl: string; estimateId: string; message?: string } | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [accepted, setAccepted] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    serviceSlug: services.some((s) => s.slug === presetService)
      ? presetService
      : presetGoal
        ? serviceSlugForGoal(presetGoal)
        : services[0]?.slug ?? "",
    projectGoal: presetGoal ?? "",
    keepVegetation: "",
    keepVegetationNotes: "",
    propertyEndUse: "",
    workAreas: [] as WorkArea[],
    calculatedAcres: 0,
    acreageSource: "",
    address: "",
    city: "",
    county: "",
    zip: "",
    acreage: "",
    squareFootage: "",
    vegetation: [] as string[],
    diameterRange: "",
    density: "",
    desiredResult: "",
    desiredResultNotes: "",
    terrain: "",
    workTypes: [] as string[],
    materialType: "",
    materialQuantity: "",
    gradingObjective: "",
    drivewayLengthFt: "",
    drivewayWidthFt: "",
    slopeNotes: "",
    drainageConcerns: "",
    desiredFinishedCondition: "",
    goal: "",
    materials: "",
    sizeQuantity: "",
    gateWidthFt: "",
    drivewayNotes: "",
    otherObstacles: "",
    accessFlags: emptyAccess(),
    scheduling: "estimate_only",
    preferredDate: "",
    preferredDateEnd: "",
  });

  function patch<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const onWorkAreasChange = useCallback((areas: WorkArea[], acres: number) => {
    setForm((f) => ({
      ...f,
      workAreas: areas,
      calculatedAcres: acres,
      acreageSource: acres > 0 ? "map_calculated" : f.acreageSource,
      acreage: acres > 0 ? acres.toFixed(2) : f.acreage,
    }));
  }, []);

  function markEstimateStarted() {
    if (startedRef.current || division !== "land_clearing") return;
    startedRef.current = true;
    trackMarketingEvent("land_clearing_estimate_started", {
      division,
      label: form.projectGoal || form.serviceSlug,
    });
  }

  const progress = ((step + 1) / steps.length) * 100;

  async function submit() {
    if (!accepted) {
      toast.error("Please acknowledge the site-condition notes.");
      return;
    }
    setBusy(true);
    try {
      const intake: Record<string, unknown> = {
        address: form.address,
        city: form.city,
        county: form.county,
        zip: form.zip,
        acreage: form.acreage,
        scheduling: form.scheduling,
        preferredDate: form.preferredDate,
        preferredDateEnd: form.preferredDateEnd,
        access: {
          gateWidthFt: form.gateWidthFt,
          drivewayNotes: form.drivewayNotes,
          otherObstacles: form.otherObstacles,
          ...form.accessFlags,
        },
      };
      if (division === "land_clearing") {
        Object.assign(intake, {
          vegetation: form.vegetation,
          diameterRange: form.diameterRange,
          density: form.density,
          desiredResult: form.desiredResult,
          desiredResultNotes: form.desiredResultNotes,
          terrain: form.terrain,
          projectGoal: form.projectGoal || undefined,
          keepVegetation: form.keepVegetation || undefined,
          keepVegetationNotes: form.keepVegetationNotes || undefined,
          propertyEndUse: form.propertyEndUse || undefined,
          workAreas: form.workAreas,
          calculatedAcres: form.calculatedAcres || undefined,
          acreageSource: form.acreageSource || (form.acreage ? "customer_entered" : undefined),
          mediaCount: files.length,
        });
      } else if (division === "site_work") {
        Object.assign(intake, {
          workTypes: form.workTypes,
          squareFootage: form.squareFootage,
          materialType: form.materialType,
          materialQuantity: form.materialQuantity,
          gradingObjective: form.gradingObjective,
          drivewayLengthFt: form.drivewayLengthFt,
          drivewayWidthFt: form.drivewayWidthFt,
          slopeNotes: form.slopeNotes,
          drainageConcerns: form.drainageConcerns,
          desiredFinishedCondition: form.desiredFinishedCondition,
        });
      } else {
        Object.assign(intake, {
          goal: form.goal,
          materials: form.materials,
          sizeQuantity: form.sizeQuantity,
        });
      }

      const res = await fetch("/api/public/equipment-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          divisionId: division,
          serviceSlug: form.serviceSlug,
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          intake,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Request failed");

      const estimateId = json.estimateId as string;
      for (const file of files) {
        const fd = new FormData();
        fd.set("estimateId", estimateId);
        fd.set("file", file);
        await fetch("/api/public/intake-media", { method: "POST", body: fd });
      }

      setResult({
        customerUrl: json.customerUrl,
        estimateId,
        message: json.message,
      });
      trackMarketingEvent("estimate_complete", { division, label: "equipment_intake" });
      if (division === "land_clearing") {
        trackMarketingEvent("land_clearing_estimate_submitted", {
          division,
          label: form.projectGoal || form.serviceSlug,
        });
      }
      toast.success(json.message || "Request submitted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <div className="space-y-4 rounded-xl border border-border bg-card p-5">
        <h3 className="text-lg font-semibold">Thank you</h3>
        <p className="text-sm text-muted-foreground">
          Your upcoming project estimate request has been received. This is not an instant price.
        </p>
        <Input readOnly value={result.customerUrl} className="font-mono text-xs" aria-label="Secure estimate link" />
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            void navigator.clipboard.writeText(result.customerUrl);
            toast.success("Link copied");
          }}
        >
          Copy customer link
        </Button>
        <BookingSocialUpsell />
      </div>
    );
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (step < steps.length - 1) {
          markEstimateStarted();
          setStep((s) => s + 1);
        }
        else void submit();
      }}
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-primary">
          {config.name}
        </p>
        <h3 className="mt-1 font-heading text-2xl font-medium">{steps[step]}</h3>
        <Progress value={progress} className="mt-3" />
      </div>

      {step === 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {division !== "land_clearing" ? (
            <div className="sm:col-span-2">
              <Label htmlFor="eq-service">Service</Label>
              <select
                id="eq-service"
                className="mt-1 h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-sm"
                value={form.serviceSlug}
                onChange={(e) => patch("serviceSlug", e.target.value)}
              >
                {services.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <p className="sm:col-span-2 text-sm text-muted-foreground">
              {form.projectGoal
                ? `We’ll start from “${goalLabel(form.projectGoal)}.” You can change that on the next screens.`
                : "Tell us who you are. Next we’ll ask what you want the property to become — not which machine to use."}
            </p>
          )}
          <div>
            <Label htmlFor="eq-first">First name</Label>
            <Input id="eq-first" required value={form.firstName} onChange={(e) => patch("firstName", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="eq-last">Last name</Label>
            <Input id="eq-last" required value={form.lastName} onChange={(e) => patch("lastName", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="eq-email">Email</Label>
            <Input id="eq-email" type="email" required value={form.email} onChange={(e) => patch("email", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="eq-phone">Phone</Label>
            <Input id="eq-phone" type="tel" required value={form.phone} onChange={(e) => patch("phone", e.target.value)} />
          </div>
        </div>
      )}

      {division === "land_clearing" && step === 1 && (
        <div className="space-y-5">
          <div>
            <Label>What are you trying to accomplish?</Label>
            <p className="mt-1 text-xs text-muted-foreground">
              Pick the closest goal. You can change this.
            </p>
            <div className="mt-2">
              <ChipGroup
                name="Project goal"
                options={LAND_CLEARING_PROJECT_GOALS}
                value={form.projectGoal}
                onChange={(v) => {
                  const goal = parseProjectGoal(v as string);
                  setForm((f) => ({
                    ...f,
                    projectGoal: (v as string) ?? "",
                    serviceSlug: goal ? serviceSlugForGoal(goal) : f.serviceSlug,
                  }));
                }}
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="eq-address">Property address</Label>
              <Input id="eq-address" value={form.address} onChange={(e) => patch("address", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="eq-city">City</Label>
              <Input id="eq-city" value={form.city} onChange={(e) => patch("city", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="eq-county">County</Label>
              <Input id="eq-county" value={form.county} onChange={(e) => patch("county", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="eq-zip">ZIP</Label>
              <Input id="eq-zip" value={form.zip} onChange={(e) => patch("zip", e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="eq-acres">About how many acres need work?</Label>
              <Input
                id="eq-acres"
                inputMode="decimal"
                value={form.acreage}
                onChange={(e) =>
                  setForm((f) => ({ ...f, acreage: e.target.value, acreageSource: "customer_entered" }))
                }
              />
              <p className="mt-1 text-xs text-muted-foreground">
                A guess is fine. {MAP_ACREAGE_DISCLAIMER}
              </p>
            </div>
          </div>
          <WorkAreaMapStep address={form.address} onAreasChange={onWorkAreasChange} />
        </div>
      )}

      {division === "land_clearing" && step === 2 && (
        <div className="space-y-5">
          <div>
            <Label>Are there trees or vegetation you want to keep?</Label>
            <div className="mt-2">
              <ChipGroup
                name="Keep or remove"
                options={KEEP_VEGETATION_OPTIONS}
                value={form.keepVegetation}
                onChange={(v) => patch("keepVegetation", v as string)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="eq-keep-notes">Tell us what you want to preserve</Label>
            <Textarea
              id="eq-keep-notes"
              value={form.keepVegetationNotes}
              onChange={(e) => patch("keepVegetationNotes", e.target.value)}
              placeholder="Mature oaks along the drive, the fence, a marked walnut…"
            />
          </div>
          <div>
            <Label>What do you want to use the property for afterward?</Label>
            <div className="mt-2">
              <ChipGroup
                name="Property end use"
                options={PROPERTY_END_USE_OPTIONS}
                value={form.propertyEndUse}
                onChange={(v) => patch("propertyEndUse", v as string)}
              />
            </div>
          </div>
          <div>
            <Label>What is growing there?</Label>
            <div className="mt-2">
              <ChipGroup
                name="Vegetation"
                multiple
                options={VEGETATION_OPTIONS}
                value={form.vegetation}
                onChange={(v) => patch("vegetation", v as string[])}
              />
            </div>
          </div>
          <div>
            <Label>How thick is the largest typical growth?</Label>
            <div className="mt-2">
              <ChipGroup name="Stem size" options={DIAMETER_OPTIONS} value={form.diameterRange} onChange={(v) => patch("diameterRange", v as string)} />
            </div>
          </div>
          <div>
            <Label>How thick is the stand?</Label>
            <div className="mt-2">
              <ChipGroup name="Density" options={DENSITY_OPTIONS} value={form.density} onChange={(v) => patch("density", v as string)} />
            </div>
          </div>
          <div>
            <Label>Preferred finish, if you already know</Label>
            <div className="mt-2">
              <ChipGroup name="Desired result" options={DESIRED_RESULT_OPTIONS} value={form.desiredResult} onChange={(v) => patch("desiredResult", v as string)} />
            </div>
          </div>
          <div>
            <Label>What is the ground like?</Label>
            <div className="mt-2">
              <ChipGroup name="Terrain" options={TERRAIN_OPTIONS} value={form.terrain} onChange={(v) => patch("terrain", v as string)} />
            </div>
          </div>
          <div>
            <Label htmlFor="eq-result-notes">Anything else about the finish you want?</Label>
            <Textarea id="eq-result-notes" value={form.desiredResultNotes} onChange={(e) => patch("desiredResultNotes", e.target.value)} />
          </div>
        </div>
      )}

      {division === "site_work" && step === 1 && (
        <div className="space-y-5">
          <div>
            <Label>Work type</Label>
            <div className="mt-2">
              <ChipGroup name="Work type" multiple options={SITE_WORK_TYPES} value={form.workTypes} onChange={(v) => patch("workTypes", v as string[])} />
            </div>
          </div>
          <div>
            <Label htmlFor="eq-obj">Grading / finish objective</Label>
            <Textarea id="eq-obj" value={form.gradingObjective} onChange={(e) => patch("gradingObjective", e.target.value)} />
          </div>
          <div>
            <Label>Material type</Label>
            <div className="mt-2">
              <ChipGroup name="Material" options={MATERIAL_TYPE_OPTIONS} value={form.materialType} onChange={(v) => patch("materialType", v as string)} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="eq-qty">Approximate material quantity</Label>
              <Input id="eq-qty" value={form.materialQuantity} onChange={(e) => patch("materialQuantity", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="eq-finish">Desired finished condition</Label>
              <Input id="eq-finish" value={form.desiredFinishedCondition} onChange={(e) => patch("desiredFinishedCondition", e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {division === "site_work" && step === 2 && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="eq-sw-address">Jobsite address</Label>
            <Input id="eq-sw-address" value={form.address} onChange={(e) => patch("address", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="eq-sw-city">City</Label>
            <Input id="eq-sw-city" value={form.city} onChange={(e) => patch("city", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="eq-sw-zip">ZIP</Label>
            <Input id="eq-sw-zip" value={form.zip} onChange={(e) => patch("zip", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="eq-sf">Square footage (if known)</Label>
            <Input id="eq-sf" value={form.squareFootage} onChange={(e) => patch("squareFootage", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="eq-acres2">Acreage (if known)</Label>
            <Input id="eq-acres2" value={form.acreage} onChange={(e) => patch("acreage", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="eq-dl">Driveway length (ft)</Label>
            <Input id="eq-dl" value={form.drivewayLengthFt} onChange={(e) => patch("drivewayLengthFt", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="eq-dw">Driveway width (ft)</Label>
            <Input id="eq-dw" value={form.drivewayWidthFt} onChange={(e) => patch("drivewayWidthFt", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="eq-slope">Slope notes</Label>
            <Textarea id="eq-slope" value={form.slopeNotes} onChange={(e) => patch("slopeNotes", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="eq-drain">Drainage concerns</Label>
            <Textarea id="eq-drain" value={form.drainageConcerns} onChange={(e) => patch("drainageConcerns", e.target.value)} />
          </div>
        </div>
      )}

      {division === "equipment_services" && step === 1 && (
        <div className="space-y-3">
          <div>
            <Label htmlFor="eq-goal">What do you need accomplished?</Label>
            <Textarea id="eq-goal" required value={form.goal} onChange={(e) => patch("goal", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="eq-mats">Which materials are involved?</Label>
            <Textarea id="eq-mats" value={form.materials} onChange={(e) => patch("materials", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="eq-size">Approximate size or quantity</Label>
            <Input id="eq-size" value={form.sizeQuantity} onChange={(e) => patch("sizeQuantity", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="eq-es-address">Property / jobsite location</Label>
            <Input id="eq-es-address" value={form.address} onChange={(e) => patch("address", e.target.value)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="eq-es-city">City</Label>
              <Input id="eq-es-city" value={form.city} onChange={(e) => patch("city", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="eq-es-zip">ZIP</Label>
              <Input id="eq-es-zip" value={form.zip} onChange={(e) => patch("zip", e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {((division === "land_clearing" && step === 3) ||
        (division === "site_work" && step === 3) ||
        (division === "equipment_services" && step === 2)) && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="eq-gate">Gate width (if applicable)</Label>
              <Input id="eq-gate" value={form.gateWidthFt} onChange={(e) => patch("gateWidthFt", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="eq-drive">Driveway / access-road notes</Label>
              <Input id="eq-drive" value={form.drivewayNotes} onChange={(e) => patch("drivewayNotes", e.target.value)} />
            </div>
          </div>
          <fieldset>
            <legend className="text-sm font-medium">Obstacles and utilities</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {ACCESS_FLAG_OPTIONS.map((opt) => (
                <label key={opt.id} className="flex min-h-11 items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.accessFlags[opt.id]}
                    onChange={(e) =>
                      patch("accessFlags", { ...form.accessFlags, [opt.id]: e.target.checked })
                    }
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <Label htmlFor="eq-other">Other obstacles</Label>
            <Textarea id="eq-other" value={form.otherObstacles} onChange={(e) => patch("otherObstacles", e.target.value)} />
          </div>
        </div>
      )}

      {((division === "land_clearing" && step === 4) ||
        (division === "site_work" && step === 4) ||
        (division === "equipment_services" && step === 3)) && (
        <div className="space-y-4">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Photos that help us estimate faster:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>wide view of the area</li>
              <li>thickest vegetation</li>
              <li>largest material</li>
              <li>property access, gates, and slopes</li>
              <li>obstacles such as wire, trash, or structures</li>
            </ul>
            <p>
              For video: walk the edge of the area and show us what you want cleared. A phone video is
              enough.
            </p>
          </div>
          <div>
            <Label htmlFor="eq-files">Photos or video</Label>
            <Input
              id="eq-files"
              type="file"
              multiple
              accept="image/*,video/mp4,video/quicktime,video/webm"
              className="mt-1"
              onChange={(e) => {
                const next = Array.from(e.target.files ?? []);
                setFiles(next);
                if (next.length > 0 && division === "land_clearing" && !mediaTrackedRef.current) {
                  mediaTrackedRef.current = true;
                  trackMarketingEvent("land_clearing_media_uploaded", { division });
                }
              }}
            />
            {files.length > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">{files.length} file(s) selected</p>
            )}
          </div>
          <div>
            <Label>Timing</Label>
            <div className="mt-2">
              <ChipGroup
                name="Scheduling"
                options={SCHEDULING_OPTIONS}
                value={form.scheduling}
                onChange={(v) => patch("scheduling", v as string)}
              />
            </div>
          </div>
          {(form.scheduling === "date_range" || form.scheduling === "flexible") && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="eq-d1">Preferred start</Label>
                <Input id="eq-d1" type="date" value={form.preferredDate} onChange={(e) => patch("preferredDate", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="eq-d2">Preferred end</Label>
                <Input id="eq-d2" type="date" value={form.preferredDateEnd} onChange={(e) => patch("preferredDateEnd", e.target.value)} />
              </div>
            </div>
          )}
        </div>
      )}

      {step === steps.length - 1 && (
        <div className="space-y-4">
          {division === "land_clearing" && form.projectGoal ? (
            <p className="text-sm">
              Goal: <span className="font-medium">{goalLabel(form.projectGoal)}</span>
            </p>
          ) : null}
          <p className="text-sm text-muted-foreground">{EQUIPMENT_PRELAUNCH_NOTE}</p>
          <p className="text-sm text-muted-foreground">
            We will not give an instant guaranteed price for forestry mulching or equipment work.
            Larger or complex jobs may need an onsite assessment.
          </p>
          <ul className="space-y-2 text-xs text-muted-foreground">
            {EQUIPMENT_LEGAL_POINTS.slice(0, 4).map((p) => (
              <li key={p.slice(0, 32)}>• {p}</li>
            ))}
          </ul>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              required
            />
            I understand pricing depends on actual site conditions, and I will disclose septic systems,
            utilities, and known hazards.
          </label>
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
        <Button
          type="button"
          variant="outline"
          className="h-11 rounded-full"
          disabled={step === 0 || busy}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button type="submit" className="h-11 rounded-full" disabled={busy}>
          {busy ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : step === steps.length - 1 ? (
            "Request an Upcoming Project Estimate"
          ) : (
            <>
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
