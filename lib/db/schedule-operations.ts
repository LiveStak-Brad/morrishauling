import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { useSupabaseData } from "@/lib/db/config";
import {
  rowToScheduleSlot,
  scheduleSlotInputToRow,
  scheduleSlotToRow,
} from "@/lib/db/schedule-mappers";
import { computeSlotStatus } from "@/lib/schedule/slot-status";
import { generateSeedScheduleSlots } from "@/lib/schedule/seed-schedule-slots";
import type { Job } from "@/types";
import type { ScheduleSlot, ScheduleSlotInput } from "@/types/schedule";
import {
  getScheduleSlots as mockGetScheduleSlots,
  getScheduleSlotById as mockGetScheduleSlotById,
  upsertScheduleSlot as mockUpsertScheduleSlot,
  reserveScheduleSlot as mockReserveScheduleSlot,
  seedScheduleSlotsIfEmpty as mockSeedScheduleSlotsIfEmpty,
} from "@/lib/mock-data";

async function sbWrite() {
  const admin = createAdminClient();
  if (admin) return admin;
  return createClient();
}

async function isDbReady(): Promise<boolean> {
  if (!useSupabaseData()) return false;
  try {
    const sb = await createClient();
    const { error } = await sb.from("schedule_slots").select("id").limit(1);
    return !error || error.code !== "PGRST205";
  } catch {
    return false;
  }
}

export async function seedScheduleSlotsIfEmpty(companyId: string): Promise<void> {
  if (!(await isDbReady())) {
    mockSeedScheduleSlotsIfEmpty(companyId);
    return;
  }
  const client = await sbWrite();
  const { count, error } = await client
    .from("schedule_slots")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId);
  if (error) throw error;
  if ((count ?? 0) > 0) return;

  const slots = generateSeedScheduleSlots(companyId);
  const { error: insertError } = await client.from("schedule_slots").insert(
    slots.map((s) => scheduleSlotToRow(s))
  );
  if (insertError) throw insertError;
}

export async function getScheduleSlots(
  companyId: string,
  filters?: { fromDate?: string; toDate?: string; includeClosed?: boolean }
): Promise<ScheduleSlot[]> {
  await seedScheduleSlotsIfEmpty(companyId);

  if (!(await isDbReady())) {
    return mockGetScheduleSlots(companyId, filters);
  }

  let query = (await createClient())
    .from("schedule_slots")
    .select("*")
    .eq("company_id", companyId)
    .order("slot_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (filters?.fromDate) query = query.gte("slot_date", filters.fromDate);
  if (filters?.toDate) query = query.lte("slot_date", filters.toDate);
  if (!filters?.includeClosed) {
    query = query.neq("status", "closed");
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(rowToScheduleSlot);
}

export async function getScheduleSlotById(
  companyId: string,
  slotId: string
): Promise<ScheduleSlot | undefined> {
  if (!(await isDbReady())) {
    return mockGetScheduleSlotById(companyId, slotId);
  }
  const { data, error } = await (await createClient())
    .from("schedule_slots")
    .select("*")
    .eq("company_id", companyId)
    .eq("id", slotId)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToScheduleSlot(data) : undefined;
}

export async function getJobsForScheduleSlot(
  companyId: string,
  slotId: string
): Promise<Job[]> {
  const { getJobs } = await import("@/lib/db/operations");
  const jobs = await getJobs(companyId);
  return jobs.filter((j) => j.selectedScheduleSlotId === slotId);
}

export async function createScheduleSlot(
  companyId: string,
  input: ScheduleSlotInput
): Promise<ScheduleSlot> {
  const id = `slot-${companyId}-${input.slotDate}-${input.windowLabel.toLowerCase().replace(/\s+/g, "-")}-${Date.now().toString(36).slice(-4)}`;
  const slot: ScheduleSlot = {
    id,
    companyId,
    slotDate: input.slotDate,
    windowLabel: input.windowLabel,
    startTime: input.startTime,
    endTime: input.endTime,
    maxJobs: input.maxJobs,
    currentJobs: 0,
    serviceArea: input.serviceArea,
    routeZone: input.routeZone,
    discountAmount: input.discountAmount ?? 0,
    discountReason: input.discountReason,
    status: input.status ?? computeSlotStatus(0, input.maxJobs),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (!(await isDbReady())) {
    return mockUpsertScheduleSlot(companyId, slot);
  }

  const { data, error } = await (await sbWrite())
    .from("schedule_slots")
    .insert(scheduleSlotInputToRow(companyId, id, input))
     .select("*")
    .single();
  if (error) throw error;
  return rowToScheduleSlot(data);
}

export async function updateScheduleSlot(
  companyId: string,
  slotId: string,
  updates: Partial<ScheduleSlotInput> & { status?: ScheduleSlot["status"]; currentJobs?: number }
): Promise<ScheduleSlot> {
  const existing = await getScheduleSlotById(companyId, slotId);
  if (!existing) throw new Error("Schedule slot not found");

  const maxJobs = updates.maxJobs ?? existing.maxJobs;
  const currentJobs = updates.currentJobs ?? existing.currentJobs;
  const forcedStatus = updates.status;
  let status: ScheduleSlot["status"];
  if (forcedStatus === "closed") {
    status = "closed";
  } else if (forcedStatus) {
    status = forcedStatus;
  } else {
    status = computeSlotStatus(currentJobs, maxJobs);
  }

  const merged: ScheduleSlot = {
    ...existing,
    slotDate: updates.slotDate ?? existing.slotDate,
    windowLabel: updates.windowLabel ?? existing.windowLabel,
    startTime: updates.startTime ?? existing.startTime,
    endTime: updates.endTime ?? existing.endTime,
    maxJobs,
    currentJobs,
    serviceArea: updates.serviceArea ?? existing.serviceArea,
    routeZone: updates.routeZone ?? existing.routeZone,
    discountAmount: updates.discountAmount ?? existing.discountAmount,
    discountReason: updates.discountReason ?? existing.discountReason,
    status,
    updatedAt: new Date().toISOString(),
  };

  if (!(await isDbReady())) {
    return mockUpsertScheduleSlot(companyId, merged);
  }

  const { data, error } = await (await sbWrite())
    .from("schedule_slots")
    .update(scheduleSlotToRow(merged))
    .eq("company_id", companyId)
    .eq("id", slotId)
    .select("*")
    .single();
  if (error) throw error;
  return rowToScheduleSlot(data);
}

export async function reserveScheduleSlot(
  companyId: string,
  slotId: string,
  options?: { actorProfileId?: string }
): Promise<ScheduleSlot> {
  const slot = await getScheduleSlotById(companyId, slotId);
  if (!slot) throw new Error("Selected schedule slot not found");
  if (slot.status === "full" || slot.status === "closed") {
    throw new Error("Selected schedule slot is no longer available");
  }
  if (slot.currentJobs >= slot.maxJobs) {
    throw new Error("Selected schedule slot is full");
  }

  const currentJobs = slot.currentJobs + 1;
  const status = computeSlotStatus(currentJobs, slot.maxJobs);
  const updated: ScheduleSlot = { ...slot, currentJobs, status, updatedAt: new Date().toISOString() };

  if (!(await isDbReady())) {
    const saved = mockReserveScheduleSlot(companyId, slotId);
    const { logActivity } = await import("@/lib/db/activity");
    await logActivity({
      companyId,
      actorProfileId: options?.actorProfileId,
      entityType: "schedule_slot",
      entityId: slotId,
      action: "reserved",
      message: `Schedule slot reserved — ${saved.windowLabel}`,
      metadata: { currentJobs: saved.currentJobs, maxJobs: saved.maxJobs },
    });
    return saved;
  }

  const { data, error } = await (await sbWrite())
    .from("schedule_slots")
    .update({
      current_jobs: currentJobs,
      status,
      updated_at: updated.updatedAt,
    })
    .eq("company_id", companyId)
    .eq("id", slotId)
    .select("*")
    .single();
  if (error) throw error;
  const result = rowToScheduleSlot(data);
  const { logActivity } = await import("@/lib/db/activity");
  await logActivity({
    companyId,
    actorProfileId: options?.actorProfileId,
    entityType: "schedule_slot",
    entityId: slotId,
    action: "reserved",
    message: `Schedule slot reserved — ${result.windowLabel}`,
    metadata: { currentJobs: result.currentJobs, maxJobs: result.maxJobs },
  });
  return result;
}
