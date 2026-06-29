import type { ScheduleSlot, ScheduleSlotInput, ScheduleSlotStatus } from "@/types/schedule";
import { computeSlotStatus } from "@/lib/schedule/slot-status";

export function rowToScheduleSlot(row: Record<string, unknown>): ScheduleSlot {
  return {
    id: row.id as string,
    companyId: row.company_id as string,
    slotDate: row.slot_date as string,
    windowLabel: row.window_label as string,
    startTime: String(row.start_time).slice(0, 8),
    endTime: String(row.end_time).slice(0, 8),
    maxJobs: Number(row.max_jobs),
    currentJobs: Number(row.current_jobs),
    serviceArea: (row.service_area as string) ?? undefined,
    routeZone: (row.route_zone as string) ?? undefined,
    discountAmount: Number(row.discount_amount ?? 0),
    discountReason: (row.discount_reason as string) ?? undefined,
    status: row.status as ScheduleSlotStatus,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function scheduleSlotToRow(slot: ScheduleSlot) {
  return {
    id: slot.id,
    company_id: slot.companyId,
    slot_date: slot.slotDate,
    window_label: slot.windowLabel,
    start_time: slot.startTime,
    end_time: slot.endTime,
    max_jobs: slot.maxJobs,
    current_jobs: slot.currentJobs,
    service_area: slot.serviceArea ?? null,
    route_zone: slot.routeZone ?? null,
    discount_amount: slot.discountAmount,
    discount_reason: slot.discountReason ?? null,
    status: slot.status,
    updated_at: new Date().toISOString(),
  };
}

export function scheduleSlotInputToRow(
  companyId: string,
  id: string,
  input: ScheduleSlotInput
) {
  const status = input.status ?? computeSlotStatus(0, input.maxJobs);
  return {
    id,
    company_id: companyId,
    slot_date: input.slotDate,
    window_label: input.windowLabel,
    start_time: input.startTime,
    end_time: input.endTime,
    max_jobs: input.maxJobs,
    current_jobs: 0,
    service_area: input.serviceArea ?? null,
    route_zone: input.routeZone ?? null,
    discount_amount: input.discountAmount ?? 0,
    discount_reason: input.discountReason ?? null,
    status,
    updated_at: new Date().toISOString(),
  };
}
