import { format, addDays } from "date-fns";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { rowToTimeclockPunch, rowToTimesheetAdjustment, rowToTimeOffRequest, rowToEmployeeShift } from "@/lib/db/hr-mappers";
import { businessDateString, businessDayUtcBounds } from "@/lib/datetime/business-timezone";
import type { PunchPayload, PunchType } from "@/types/hr/time";
import type { ShiftConflict } from "@/types/hr/schedule";

function id(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function sbWrite() {
  const admin = createAdminClient();
  if (admin) return admin;
  return createClient();
}

export async function recordPunch(companyId: string, payload: PunchPayload) {
  const sb = await sbWrite();
  const shiftDate = businessDateString(new Date());

  let { data: activeShift } = await sb
    .from("employee_timeclock")
    .select("id")
    .eq("employee_id", payload.employeeId)
    .eq("shift_date", shiftDate)
    .is("clock_out_at", null)
    .maybeSingle();

  if (payload.punchType === "clock_in" && !activeShift) {
    const tcId = id("tc");
    await sb.from("employee_timeclock").insert({
      id: tcId,
      company_id: companyId,
      employee_id: payload.employeeId,
      clock_in_at: new Date().toISOString(),
      shift_date: shiftDate,
      shift_status: "clocked_in",
      start_location: payload.location,
    });
    activeShift = { id: tcId };
  }

  if (!activeShift) throw new Error("No active shift found");

  if (payload.punchType === "clock_out") {
    await sb.from("employee_timeclock").update({
      clock_out_at: new Date().toISOString(),
      shift_status: "clocked_out",
      end_location: payload.location,
      updated_at: new Date().toISOString(),
    }).eq("id", activeShift.id);
  }

  const punchId = id("punch");
  await sb.from("timeclock_punches").insert({
    id: punchId,
    company_id: companyId,
    timeclock_id: activeShift.id,
    employee_id: payload.employeeId,
    punch_type: payload.punchType,
    punched_at: new Date().toISOString(),
    location: payload.location,
    device_info: payload.deviceInfo,
  });

  return punchId;
}

export async function getPunchesForEmployee(companyId: string, employeeId: string, shiftDate?: string) {
  const sb = await sbWrite();
  let query = sb
    .from("timeclock_punches")
    .select("*")
    .eq("company_id", companyId)
    .eq("employee_id", employeeId)
    .order("punched_at", { ascending: false })
    .limit(50);
  if (shiftDate) {
    const { startIso, endIso } = businessDayUtcBounds(shiftDate);
    query = query.gte("punched_at", startIso).lte("punched_at", endIso);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(rowToTimeclockPunch);
}

export async function requestTimesheetAdjustment(
  companyId: string,
  employeeId: string,
  data: { punchId?: string; originalPunchedAt?: string; proposedPunchedAt: string; reason: string },
  profileId?: string
) {
  const sb = await sbWrite();
  const adjId = id("tadj");
  await sb.from("timesheet_adjustments").insert({
    id: adjId,
    company_id: companyId,
    employee_id: employeeId,
    punch_id: data.punchId,
    original_punched_at: data.originalPunchedAt,
    proposed_punched_at: data.proposedPunchedAt,
    reason: data.reason,
    requested_by_profile_id: profileId,
    status: "pending",
  });
  return adjId;
}

export async function reviewTimesheetAdjustment(
  companyId: string,
  adjustmentId: string,
  approved: boolean,
  profileId?: string,
  notes?: string
) {
  const sb = await sbWrite();
  const status = approved ? "approved" : "rejected";
  await sb.from("timesheet_adjustments").update({
    status,
    reviewed_by_profile_id: profileId,
    reviewed_at: new Date().toISOString(),
    review_notes: notes,
    updated_at: new Date().toISOString(),
  }).eq("id", adjustmentId).eq("company_id", companyId);

  if (approved) {
    const { data: adj } = await sb.from("timesheet_adjustments").select("*").eq("id", adjustmentId).single();
    if (adj?.punch_id) {
      await sb.from("timeclock_punches").update({ punched_at: adj.proposed_punched_at }).eq("id", adj.punch_id);
    }
  }
}

export async function getTimesheetAdjustments(companyId: string, status?: string) {
  const sb = await sbWrite();
  let query = sb.from("timesheet_adjustments").select("*").eq("company_id", companyId).order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(rowToTimesheetAdjustment);
}

export async function getPtoBalances(companyId: string, employeeId: string) {
  const sb = await sbWrite();
  const { data, error } = await sb
    .from("pto_balances")
    .select("*")
    .eq("company_id", companyId)
    .eq("employee_id", employeeId);
  if (error) throw error;
  if (!data?.length) {
    await ensurePtoBalances(companyId, employeeId);
    const { data: seeded } = await sb
      .from("pto_balances")
      .select("*")
      .eq("company_id", companyId)
      .eq("employee_id", employeeId);
    return (seeded ?? []).map((r) => ({
      bucket: r.bucket as string,
      balanceHours: Number(r.balance_hours),
    }));
  }
  return data.map((r) => ({
    bucket: r.bucket as string,
    balanceHours: Number(r.balance_hours),
  }));
}

export async function ensurePtoBalances(companyId: string, employeeId: string) {
  const sb = await sbWrite();
  const defaults = [
    { bucket: "vacation", hours: 80 },
    { bucket: "sick", hours: 40 },
    { bucket: "personal", hours: 16 },
  ];
  for (const d of defaults) {
    await sb.from("pto_balances").upsert(
      {
        id: id("ptob"),
        company_id: companyId,
        employee_id: employeeId,
        bucket: d.bucket,
        balance_hours: d.hours,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "employee_id,bucket", ignoreDuplicates: true }
    );
  }
}

async function adjustPtoBalance(
  companyId: string,
  employeeId: string,
  bucket: string,
  hours: number,
  entryType: "usage" | "adjustment" | "accrual",
  referenceId?: string
) {
  const sb = await sbWrite();
  const { data: bal } = await sb
    .from("pto_balances")
    .select("id, balance_hours")
    .eq("employee_id", employeeId)
    .eq("bucket", bucket)
    .maybeSingle();
  if (!bal) return;
  const next = Number(bal.balance_hours) + hours;
  await sb.from("pto_balances").update({ balance_hours: next, updated_at: new Date().toISOString() }).eq("id", bal.id);
  await sb.from("pto_ledger").insert({
    id: id("ptol"),
    company_id: companyId,
    employee_id: employeeId,
    bucket,
    entry_type: entryType,
    hours,
    reference_id: referenceId,
  });
}

export async function createTimeOffRequest(
  companyId: string,
  employeeId: string,
  data: {
    requestType: string;
    startDate: string;
    endDate: string;
    hoursRequested?: number;
    reason?: string;
    partialDay?: boolean;
  }
) {
  const sb = await sbWrite();
  const bucketMap: Record<string, string> = {
    vacation: "vacation",
    sick: "sick",
    personal: "personal",
    personal_day: "personal",
  };
  const bucket = bucketMap[data.requestType];
  if (bucket && data.hoursRequested) {
    const balances = await getPtoBalances(companyId, employeeId);
    const bal = balances.find((b) => b.bucket === bucket);
    if (bal && bal.balanceHours < data.hoursRequested) {
      throw new Error(`Insufficient ${bucket} balance (${bal.balanceHours}h available)`);
    }
  }
  const reqId = id("pto");
  await sb.from("time_off_requests").insert({
    id: reqId,
    company_id: companyId,
    employee_id: employeeId,
    request_type: data.requestType,
    start_date: data.startDate,
    end_date: data.endDate,
    hours_requested: data.hoursRequested,
    partial_day: data.partialDay ?? false,
    reason: data.reason,
    status: "pending",
  });
  return reqId;
}

export async function reviewTimeOffRequest(
  companyId: string,
  requestId: string,
  approved: boolean,
  profileId?: string,
  notes?: string
) {
  const sb = await sbWrite();
  const { data: req } = await sb.from("time_off_requests").select("*").eq("id", requestId).single();
  await sb.from("time_off_requests").update({
    status: approved ? "approved" : "denied",
    reviewed_by_profile_id: profileId,
    reviewed_at: new Date().toISOString(),
    review_notes: notes,
    manager_notes: notes,
    updated_at: new Date().toISOString(),
  }).eq("id", requestId).eq("company_id", companyId);

  if (approved && req) {
    const bucketMap: Record<string, string> = {
      vacation: "vacation",
      sick: "sick",
      personal: "personal",
      personal_day: "personal",
    };
    const bucket = bucketMap[String(req.request_type)];
    const hours = Number(req.hours_requested ?? 8);
    if (bucket) {
      await adjustPtoBalance(companyId, String(req.employee_id), bucket, -hours, "usage", requestId);
    }
  }
}

export async function getTimeOffRequests(companyId: string, employeeId?: string) {
  const sb = await sbWrite();
  let query = sb.from("time_off_requests").select("*").eq("company_id", companyId).order("created_at", { ascending: false });
  if (employeeId) query = query.eq("employee_id", employeeId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(rowToTimeOffRequest);
}

export async function createEmployeeShift(
  companyId: string,
  data: { employeeId: string; shiftDate: string; startTime: string; endTime: string; role?: string; notes?: string },
  profileId?: string
) {
  const conflicts = await checkShiftConflicts(companyId, data.employeeId, data.startTime, data.endTime);
  if (conflicts.length) throw new Error(conflicts.map((c) => c.message).join("; "));

  const sb = await sbWrite();
  const shiftId = id("shift");
  await sb.from("employee_shifts").insert({
    id: shiftId,
    company_id: companyId,
    employee_id: data.employeeId,
    shift_date: data.shiftDate,
    start_time: data.startTime,
    end_time: data.endTime,
    role: data.role,
    notes: data.notes,
    created_by_profile_id: profileId,
    status: "scheduled",
  });
  return shiftId;
}

export async function getEmployeeShifts(companyId: string, filters?: { employeeId?: string; from?: string; to?: string }) {
  const sb = await sbWrite();
  let query = sb.from("employee_shifts").select("*").eq("company_id", companyId).order("start_time");
  if (filters?.employeeId) query = query.eq("employee_id", filters.employeeId);
  if (filters?.from) query = query.gte("shift_date", filters.from);
  if (filters?.to) query = query.lte("shift_date", filters.to);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(rowToEmployeeShift);
}

export async function checkShiftConflicts(
  companyId: string,
  employeeId: string,
  startTime: string,
  endTime: string
): Promise<ShiftConflict[]> {
  const sb = await sbWrite();
  const conflicts: ShiftConflict[] = [];
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();

  const { data: shifts } = await sb
    .from("employee_shifts")
    .select("id, start_time, end_time")
    .eq("company_id", companyId)
    .eq("employee_id", employeeId)
    .neq("status", "cancelled");

  for (const shift of shifts ?? []) {
    const s = new Date(shift.start_time).getTime();
    const e = new Date(shift.end_time).getTime();
    if (start < e && end > s) {
      conflicts.push({
        employeeId,
        conflictType: "shift_overlap",
        message: "Overlapping shift assignment",
        conflictingId: shift.id,
      });
    }
  }

  const { data: assignments } = await sb
    .from("job_assignments")
    .select("job_id, jobs(scheduled_start, scheduled_end)")
    .eq("employee_id", employeeId);

  for (const a of assignments ?? []) {
    const raw = a.jobs as unknown;
    const job = (Array.isArray(raw) ? raw[0] : raw) as Record<string, unknown> | null;
    if (!job?.scheduled_start || !job?.scheduled_end) continue;
    const s = new Date(String(job.scheduled_start)).getTime();
    const e = new Date(String(job.scheduled_end)).getTime();
    if (start < e && end > s) {
      conflicts.push({
        employeeId,
        conflictType: "job_assignment",
        message: "Conflicts with assigned job",
        conflictingId: String(a.job_id),
      });
    }
  }

  return conflicts;
}
