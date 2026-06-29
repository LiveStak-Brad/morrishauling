import type { ScheduleSlot } from "@/types/schedule";
import { slotStatusLabel } from "@/lib/schedule/slot-status";
import type { ArrivalDayOption, ArrivalTimeSlot } from "@/lib/booking/arrival-slots";

function windowKind(label: string): ArrivalTimeSlot["window"] {
  const lower = label.toLowerCase();
  if (lower.includes("flexible")) return "flexible";
  if (lower.includes("afternoon")) return "afternoon";
  return "morning";
}

function mapStatus(slot: ScheduleSlot): ArrivalTimeSlot["status"] {
  if (slot.discountAmount > 0 && slot.status === "available") return "flexible";
  return slot.status;
}

function mapStatusLabel(slot: ScheduleSlot): string {
  if (slot.discountAmount > 0 && slot.status === "available") {
    return `Save $${slot.discountAmount}`;
  }
  return slotStatusLabel(slot.status, slot.currentJobs, slot.maxJobs);
}

export function scheduleSlotsToCalendarOptions(slots: ScheduleSlot[]): ArrivalDayOption[] {
  const byDate = new Map<string, ScheduleSlot[]>();
  for (const slot of slots) {
    const list = byDate.get(slot.slotDate) ?? [];
    list.push(slot);
    byDate.set(slot.slotDate, list);
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, daySlots]) => {
      const d = new Date(`${date}T12:00:00`);
      return {
        date,
        dayLabel: d.toLocaleDateString("en-US", { weekday: "long" }),
        dateLabel: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        slots: daySlots
          .sort((a, b) => a.startTime.localeCompare(b.startTime))
          .map((slot) => ({
            id: slot.id,
            window: windowKind(slot.windowLabel),
            label: slot.windowLabel,
            status: mapStatus(slot),
            statusLabel: mapStatusLabel(slot),
            discountAmount: slot.discountAmount > 0 ? slot.discountAmount : undefined,
            discountLabel: slot.discountReason,
            bookable: slot.status !== "full" && slot.status !== "closed",
          })),
      };
    });
}

export function findScheduleSlot(slots: ScheduleSlot[], slotId: string): ScheduleSlot | undefined {
  return slots.find((s) => s.id === slotId);
}
