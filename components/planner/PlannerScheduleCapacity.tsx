"use client";

import type { Job } from "@/types";
import type { ScheduleSlot } from "@/types/schedule";
import { SCHEDULE_SLOT_STATUS_LABELS } from "@/types/schedule";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { StatusChip } from "@/components/morris/StatusChip";
import { JobCard } from "@/components/customer/JobCard";
import { CalendarClock, Sparkles, AlertTriangle, Route } from "lucide-react";

interface PlannerScheduleCapacityProps {
  slots: ScheduleSlot[];
  jobs: Job[];
}

export function PlannerScheduleCapacity({ slots, jobs }: PlannerScheduleCapacityProps) {
  const todayJobs = jobs;
  const flexibleJobs = todayJobs.filter(
    (j) => (j.flexibleDiscountAmount ?? 0) > 0 || j.scheduledWindowLabel?.toLowerCase().includes("flexible")
  );
  const discountedJobs = todayJobs.filter((j) => (j.flexibleDiscountAmount ?? 0) > 0);
  const reviewJobs = todayJobs.filter(
    (j) => j.reviewStatus === "needs_review" || j.junkRemovalDetails?.reviewRequired
  );
  const routeFriendly = todayJobs.filter((j) => j.junkRemovalDetails?.originBaseId);

  const slotsByWindow = slots.reduce<Record<string, ScheduleSlot[]>>((acc, slot) => {
    const key = slot.windowLabel;
    acc[key] = acc[key] ?? [];
    acc[key].push(slot);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <PremiumCard className="p-4">
          <p className="text-xs text-muted-foreground">Flexible / discounted</p>
          <p className="text-2xl font-bold">{flexibleJobs.length}</p>
        </PremiumCard>
        <PremiumCard className="p-4">
          <p className="text-xs text-muted-foreground">Needs review</p>
          <p className="text-2xl font-bold text-amber-600">{reviewJobs.length}</p>
        </PremiumCard>
        <PremiumCard className="p-4">
          <p className="text-xs text-muted-foreground">Route-optimized base</p>
          <p className="text-2xl font-bold">{routeFriendly.length}</p>
        </PremiumCard>
        <PremiumCard className="p-4">
          <p className="text-xs text-muted-foreground">Limited / full slots</p>
          <p className="text-2xl font-bold">
            {slots.filter((s) => s.status === "limited" || s.status === "almost_full" || s.status === "full").length}
          </p>
        </PremiumCard>
      </div>

      <PremiumCard className="p-5">
        <h3 className="mb-3 flex items-center gap-2 font-bold">
          <CalendarClock className="h-4 w-4" /> Window capacity
        </h3>
        <div className="space-y-3">
          {Object.entries(slotsByWindow).map(([label, windowSlots]) => (
            <div key={label}>
              <p className="mb-1 text-sm font-semibold">{label}</p>
              <div className="flex flex-wrap gap-2">
                {windowSlots.map((slot) => (
                  <span
                    key={slot.id}
                    className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs"
                  >
                    {slot.slotDate.slice(5)} · {slot.currentJobs}/{slot.maxJobs}
                    <StatusChip
                      label={SCHEDULE_SLOT_STATUS_LABELS[slot.status]}
                      variant={
                        slot.status === "full" || slot.status === "closed"
                          ? "neutral"
                          : slot.status === "limited" || slot.status === "almost_full"
                            ? "warning"
                            : "success"
                      }
                      className="text-[9px]"
                    />
                    {slot.discountAmount > 0 && (
                      <Sparkles className="h-3 w-3 text-green-600" />
                    )}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PremiumCard>

      {discountedJobs.length > 0 && (
        <PremiumCard className="p-5">
          <h3 className="mb-3 flex items-center gap-2 font-bold text-green-800">
            <Sparkles className="h-4 w-4" /> Flexible discount jobs
          </h3>
          <div className="space-y-2">
            {discountedJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
                <span>{job.address.city} — {job.scheduledWindowLabel}</span>
                <span className="font-medium text-green-700">−${job.flexibleDiscountAmount}</span>
              </div>
            ))}
          </div>
        </PremiumCard>
      )}

      {reviewJobs.length > 0 && (
        <PremiumCard className="p-5 border-amber-200">
          <h3 className="mb-3 flex items-center gap-2 font-bold">
            <AlertTriangle className="h-4 w-4 text-amber-600" /> Jobs needing review
          </h3>
          <div className="space-y-2">
            {reviewJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </PremiumCard>
      )}

      <PremiumCard className="p-5">
        <h3 className="mb-3 flex items-center gap-2 font-bold">
          <Route className="h-4 w-4" /> Jobs by schedule window
        </h3>
        {todayJobs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No jobs scheduled for today.</p>
        ) : (
          <div className="space-y-4">
            {[...new Set(todayJobs.map((j) => j.scheduledWindowLabel ?? "Unassigned"))].map((window) => (
              <div key={window}>
                <p className="mb-2 text-sm font-semibold">{window}</p>
                <div className="space-y-2">
                  {todayJobs
                    .filter((j) => (j.scheduledWindowLabel ?? "Unassigned") === window)
                    .map((job) => (
                      <JobCard key={job.id} job={job} showInternalProfit />
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </PremiumCard>
    </div>
  );
}
