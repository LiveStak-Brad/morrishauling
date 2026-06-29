"use client";

import { useEffect, useState } from "react";
import type { ArrivalDayOption, ArrivalTimeSlot } from "@/lib/booking/arrival-slots";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { StatusChip } from "@/components/morris/StatusChip";
import { CalendarClock, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

function slotVariant(status: ArrivalTimeSlot["status"]) {
  switch (status) {
    case "available":
      return "success" as const;
    case "limited":
      return "warning" as const;
    case "almost_full":
      return "urgent" as const;
    case "flexible":
      return "info" as const;
    case "full":
    case "closed":
      return "neutral" as const;
  }
}

export interface EstimatedArrivalCalendarProps {
  companyId: string;
  selectedSlotId?: string;
  onSelect: (slotId: string, day: ArrivalDayOption, slot: ArrivalTimeSlot) => void;
  previewMode?: boolean;
}

export function EstimatedArrivalCalendar({
  companyId,
  selectedSlotId,
  onSelect,
  previewMode = false,
}: EstimatedArrivalCalendarProps) {
  const [days, setDays] = useState<ArrivalDayOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/schedule/slots?companyId=${encodeURIComponent(companyId)}&days=14`
        );
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.error ?? "Failed to load schedule");
        if (!cancelled) setDays(data.days ?? []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load schedule");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  return (
    <PremiumCard
      className={cn(
        "p-4 sm:p-5",
        previewMode && "border-2 border-dashed border-amber-300/80 bg-amber-50/40"
      )}
    >
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <CalendarClock className="h-5 w-5 shrink-0 text-brand-primary" />
        <h3 className="font-bold">
          {previewMode ? "Preview: sample scheduling windows" : "Estimated arrival window"}
        </h3>
        {previewMode && (
          <StatusChip label="Not confirmed" variant="warning" className="text-[10px]" />
        )}
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        {previewMode
          ? "Sample screens only — selecting a window here does not reserve a crew or appointment."
          : "Choose a day and window that works for you. Flexible options may reduce your estimate when we can route efficiently."}
      </p>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          {previewMode ? "Loading preview windows…" : "Loading available windows…"}
        </div>
      )}

      {error && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </p>
      )}

      {!loading && !error && days.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {previewMode
            ? "Preview schedule data is not available right now."
            : "No arrival windows available right now. Please call us to schedule."}
        </p>
      )}

      <div className={cn("space-y-4", previewMode && "opacity-90")}>
        {days.map((day) => (
          <div
            key={day.date}
            className={cn("rounded-xl border p-3 sm:p-4", previewMode && "border-dashed border-amber-200/80 bg-white/60")}
          >
            <div className="mb-3 flex items-baseline justify-between gap-2">
              <div>
                <p className="font-semibold">{day.dayLabel}</p>
                <p className="text-xs text-muted-foreground">{day.dateLabel}</p>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {day.slots.map((slot) => {
                const selected = selectedSlotId === slot.id;
                const disabled = previewMode ? false : !slot.bookable;
                return (
                  <button
                    key={slot.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => !disabled && onSelect(slot.id, day, slot)}
                    className={cn(
                      "min-h-[48px] rounded-xl border-2 p-3 text-left transition-all",
                      disabled && "cursor-not-allowed opacity-50",
                      previewMode && "border-dashed",
                      selected
                        ? previewMode
                          ? "border-amber-500 bg-amber-100/60"
                          : "border-brand-primary bg-brand-primary/5"
                        : disabled
                          ? "border-muted bg-muted/30"
                          : previewMode
                            ? "border-amber-200/80 bg-white hover:border-amber-400/60"
                            : "border-muted hover:border-brand-primary/40"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{slot.label}</p>
                        <div className="mt-1.5">
                          <StatusChip
                            label={previewMode ? "Sample window" : slot.statusLabel}
                            variant={previewMode ? "neutral" : slotVariant(slot.status)}
                            className="text-[10px]"
                          />
                        </div>
                      </div>
                      {!previewMode && slot.discountAmount && slot.bookable && (
                        <span className="flex items-center gap-0.5 text-xs font-semibold text-green-700">
                          <Sparkles className="h-3 w-3" />
                          Save ${slot.discountAmount}
                        </span>
                      )}
                    </div>
                    {!previewMode && slot.discountLabel && slot.bookable && (
                      <p className="mt-2 text-xs text-muted-foreground">{slot.discountLabel}</p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        {previewMode
          ? "This calendar is for demonstration only. Real scheduling opens at launch."
          : "Final arrival time confirmed after booking. Windows are estimates, not guaranteed appointment times."}
      </p>
    </PremiumCard>
  );
}
