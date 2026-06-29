import { addDays, format } from "date-fns";
import { MORRIS_COMPANY_ID } from "@/lib/morris-config";
import { computeSlotStatus } from "@/lib/schedule/slot-status";
import type { ScheduleSlot } from "@/types/schedule";

const DAY_TEMPLATES = [
  {
    windows: [
      { label: "Morning", start: "08:00:00", end: "12:00:00", max: 5, discount: 0 },
      { label: "Afternoon", start: "12:00:00", end: "17:00:00", max: 4, discount: 0 },
    ],
  },
  {
    windows: [
      { label: "Morning", start: "08:00:00", end: "12:00:00", max: 4, discount: 0 },
      { label: "Afternoon", start: "12:00:00", end: "17:00:00", max: 3, discount: 0, seedJobs: 2 },
    ],
  },
  {
    windows: [
      {
        label: "Flexible pricing",
        start: "09:00:00",
        end: "16:00:00",
        max: 6,
        discount: 40,
        reason: "Route-friendly window — save when we can batch your stop",
      },
    ],
  },
  {
    windows: [
      { label: "Morning", start: "08:00:00", end: "12:00:00", max: 5, discount: 0 },
      { label: "Afternoon", start: "12:00:00", end: "17:00:00", max: 5, discount: 0 },
    ],
  },
];

type WindowTemplate = {
  label: string;
  start: string;
  end: string;
  max: number;
  discount: number;
  reason?: string;
  seedJobs?: number;
};

export function generateSeedScheduleSlots(
  companyId: string = MORRIS_COMPANY_ID,
  days = 14,
  startDate = new Date()
): ScheduleSlot[] {
  const now = new Date().toISOString();
  const slots: ScheduleSlot[] = [];

  for (let d = 0; d < days; d++) {
    const template = DAY_TEMPLATES[d % DAY_TEMPLATES.length];
    const date = format(addDays(startDate, d + 1), "yyyy-MM-dd");

    for (const w of template.windows as WindowTemplate[]) {
      const currentJobs = w.seedJobs ?? (d === 1 && w.label === "Morning" ? 1 : 0);
      const id = `slot-${companyId}-${date}-${w.label.toLowerCase().replace(/\s+/g, "-")}`;
      const status = computeSlotStatus(currentJobs, w.max);
      slots.push({
        id,
        companyId,
        slotDate: date,
        windowLabel: w.label,
        startTime: w.start,
        endTime: w.end,
        maxJobs: w.max,
        currentJobs,
        serviceArea: "Warren, Lincoln & St. Charles Counties",
        routeZone: w.discount > 0 ? "flexible_batch" : d % 2 === 0 ? "north_corridor" : "south_corridor",
        discountAmount: w.discount,
        discountReason: w.reason,
        status,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  markDemoFullSlot(slots);
  return slots;
}

/** Mark one demo slot full so booking UI can verify disabled state. */
function markDemoFullSlot(slots: ScheduleSlot[]): void {
  const target = slots.find(
    (s) => s.windowLabel === "Afternoon" && s.currentJobs < s.maxJobs
  );
  if (target) {
    target.currentJobs = target.maxJobs;
    target.status = "full";
  }
}
