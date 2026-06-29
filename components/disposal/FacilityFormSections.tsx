"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ALL_MATERIAL_CATEGORIES,
  MATERIAL_CATEGORY_GROUPS,
  MATERIAL_CATEGORY_LABELS,
  type MaterialCategory,
} from "@/lib/disposal/material-categories";
import { getMaterialIcon } from "@/lib/disposal/material-icons";
import { formatTodayHours } from "@/lib/disposal/facility-hours";
import type { DumpSiteHours } from "@/types/operations-depth";
import type { DisposalFacility, FacilityAccessType } from "@/types/disposal-management";
import { ChevronDown, ChevronUp, Clock, MapPin } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const DAY_LABELS: Record<(typeof DAY_KEYS)[number], string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

const HOUR_PRESETS = [
  "Closed",
  "7:00 AM – 4:00 PM",
  "7:30 AM – 4:30 PM",
  "8:00 AM – 4:00 PM",
  "8:00 AM – 5:00 PM",
  "9:00 AM – 5:00 PM",
  "7:00 AM – 12:00 PM",
];

export function FacilityHoursBuilder({
  hours,
  onChange,
}: {
  hours: DumpSiteHours | undefined;
  onChange: (h: DumpSiteHours) => void;
}) {
  const value = hours ?? {};

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5" />
        Today: {formatTodayHours(value) || "No hours set"}
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {DAY_KEYS.map((day) => (
          <div key={day} className="flex items-center gap-2">
            <Label className="w-24 shrink-0 text-xs">{DAY_LABELS[day]}</Label>
            <Select
              value={value[day] ?? "Closed"}
              onValueChange={(v) => onChange({ ...value, [day]: v })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HOUR_PRESETS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MaterialCategorySelector({
  selected,
  onChange,
  rejected,
  onRejectedChange,
}: {
  selected: MaterialCategory[];
  onChange: (m: MaterialCategory[]) => void;
  rejected?: string[];
  onRejectedChange?: (r: string[]) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = (m: MaterialCategory) => {
    onChange(selected.includes(m) ? selected.filter((x) => x !== m) : [...selected, m]);
  };

  const toggleRejected = (label: string) => {
    if (!onRejectedChange || !rejected) return;
    onRejectedChange(
      rejected.includes(label) ? rejected.filter((x) => x !== label) : [...rejected, label]
    );
  };

  return (
    <div className="space-y-3">
      {MATERIAL_CATEGORY_GROUPS.map((group) => {
        const open = expanded === group.id;
        const selectedInGroup = group.categories.filter((c) => selected.includes(c)).length;
        return (
          <div key={group.id} className="rounded-lg border overflow-hidden">
            <button
              type="button"
              className="flex w-full items-center justify-between bg-muted/40 px-3 py-2 text-left text-sm font-medium hover:bg-muted/60"
              onClick={() => setExpanded(open ? null : group.id)}
            >
              <span>
                {group.label}
                {selectedInGroup > 0 && (
                  <span className="ml-2 text-xs font-normal text-brand-primary">
                    {selectedInGroup} selected
                  </span>
                )}
              </span>
              {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {open && (
              <div className="grid gap-1.5 p-3 sm:grid-cols-2 md:grid-cols-3">
                {group.categories.map((m) => {
                  const Icon = getMaterialIcon(m);
                  return (
                    <label
                      key={m}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm transition-colors",
                        selected.includes(m) ? "border-brand-primary bg-brand-primary/5" : "hover:bg-muted/50"
                      )}
                    >
                      <Checkbox checked={selected.includes(m)} onCheckedChange={() => toggle(m)} />
                      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{MATERIAL_CATEGORY_LABELS[m]}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {onRejectedChange && rejected && (
        <div className="pt-2">
          <Label className="text-xs text-muted-foreground">Explicitly rejected (optional)</Label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {ALL_MATERIAL_CATEGORIES.slice(0, 12).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => toggleRejected(MATERIAL_CATEGORY_LABELS[m])}
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs border",
                  rejected.includes(MATERIAL_CATEGORY_LABELS[m])
                    ? "border-red-400 bg-red-50 text-red-700"
                    : "bg-muted/50"
                )}
              >
                {MATERIAL_CATEGORY_LABELS[m]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function FacilityRestrictionsForm({
  facility,
  onChange,
}: {
  facility: DisposalFacility;
  onChange: (f: DisposalFacility) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <Label>Max load size</Label>
        <Input
          placeholder="e.g. Single axle, 20 yd"
          value={facility.maxLoadSize ?? ""}
          onChange={(e) => onChange({ ...facility, maxLoadSize: e.target.value })}
        />
      </div>
      <div>
        <Label>Weight limit (tons)</Label>
        <Input
          type="number"
          step="0.5"
          value={facility.weightLimitTons ?? ""}
          onChange={(e) => onChange({ ...facility, weightLimitTons: Number(e.target.value) || undefined })}
        />
      </div>
      <div>
        <Label>Truck restrictions</Label>
        <Input
          placeholder="e.g. No box trucks over 26 ft"
          value={facility.truckRestrictions ?? ""}
          onChange={(e) => onChange({ ...facility, truckRestrictions: e.target.value })}
        />
      </div>
      <div>
        <Label>Trailer restrictions</Label>
        <Input
          placeholder="e.g. No enclosed trailers"
          value={facility.trailerRestrictions ?? ""}
          onChange={(e) => onChange({ ...facility, trailerRestrictions: e.target.value })}
        />
      </div>
      <div className="sm:col-span-2">
        <Label>Holiday closures</Label>
        <Input
          placeholder="Comma-separated dates, e.g. 2026-07-04, 2026-12-25"
          value={(facility.holidayClosures ?? []).join(", ")}
          onChange={(e) =>
            onChange({
              ...facility,
              holidayClosures: e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
        />
      </div>
    </div>
  );
}

export function FacilityAccessTypeSelect({
  value,
  onChange,
}: {
  value: FacilityAccessType;
  onChange: (v: FacilityAccessType) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as FacilityAccessType)}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="public">Public</SelectItem>
        <SelectItem value="commercial">Commercial</SelectItem>
        <SelectItem value="both">Public & Commercial</SelectItem>
      </SelectContent>
    </Select>
  );
}

export function FacilityMapEmbed({ facility }: { facility: DisposalFacility }) {
  if (!facility.location) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border bg-muted/30 text-sm text-muted-foreground">
        <MapPin className="mr-2 h-4 w-4" />
        Add latitude/longitude to show map
      </div>
    );
  }

  const { lat, lng } = facility.location;
  const q = encodeURIComponent(`${facility.address}, ${facility.city ?? ""}`);

  return (
    <div className="overflow-hidden rounded-xl border">
      <iframe
        title={`Map — ${facility.name}`}
        className="h-56 w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        src={`https://www.google.com/maps?q=${lat},${lng}&z=14&output=embed`}
      />
      <div className="flex items-center justify-between border-t bg-muted/30 px-3 py-2 text-xs">
        <span className="text-muted-foreground truncate">
          {facility.address}
          {facility.city ? `, ${facility.city}` : ""}
        </span>
        <a
          className="shrink-0 font-medium text-brand-primary hover:underline"
          href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${q}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Directions
        </a>
      </div>
    </div>
  );
}

export function FacilityGpsInputs({
  facility,
  onChange,
}: {
  facility: DisposalFacility;
  onChange: (f: DisposalFacility) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <Label>Latitude</Label>
        <Input
          type="number"
          step="0.000001"
          value={facility.location?.lat ?? ""}
          onChange={(e) =>
            onChange({
              ...facility,
              location: {
                lat: Number(e.target.value),
                lng: facility.location?.lng ?? 0,
              },
            })
          }
        />
      </div>
      <div>
        <Label>Longitude</Label>
        <Input
          type="number"
          step="0.000001"
          value={facility.location?.lng ?? ""}
          onChange={(e) =>
            onChange({
              ...facility,
              location: {
                lat: facility.location?.lat ?? 0,
                lng: Number(e.target.value),
              },
            })
          }
        />
      </div>
    </div>
  );
}

export function FacilityClosureToggle({
  facility,
  onChange,
}: {
  facility: DisposalFacility;
  onChange: (f: DisposalFacility) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm">
        <Checkbox
          checked={facility.isClosed}
          onCheckedChange={(v) => onChange({ ...facility, isClosed: Boolean(v) })}
        />
        Temporarily closed
      </label>
      {facility.isClosed && (
        <Textarea
          rows={2}
          placeholder="Closure reason for dispatch…"
          value={facility.closureReason ?? ""}
          onChange={(e) => onChange({ ...facility, closureReason: e.target.value })}
        />
      )}
    </div>
  );
}
