import { NextRequest } from "next/server";
import { apiError, apiOk, parseJson } from "@/lib/api/route-utils";
import { requireApiProfile } from "@/lib/api/require-profile";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTimesheetAdjustments } from "@/lib/db/hr/time-schedule";
import { MORRIS_COMPANY_ID } from "@/lib/morris-config";

export async function GET(request: NextRequest) {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  if (!["admin", "planner"].includes(profile.role)) {
    return apiError("Admin access required", 403);
  }

  const companyId = request.nextUrl.searchParams.get("companyId") || MORRIS_COMPANY_ID;
  const date = request.nextUrl.searchParams.get("date") || new Date().toISOString().slice(0, 10);
  const asExport = request.nextUrl.searchParams.get("export") === "csv";

  try {
    const sb = createAdminClient();
    if (!sb) return apiError("Database unavailable", 503);

    const { data: shifts, error } = await sb
      .from("employee_timeclock")
      .select("*, employees(first_name, last_name)")
      .eq("company_id", companyId)
      .eq("shift_date", date)
      .order("clock_in_at", { ascending: true });
    if (error) throw error;

    const mapped = (shifts ?? []).map((row) => {
      const emp = row.employees as { first_name?: string; last_name?: string } | null;
      const clockIn = row.clock_in_at ? new Date(row.clock_in_at as string).getTime() : null;
      const clockOut = row.clock_out_at ? new Date(row.clock_out_at as string).getTime() : null;
      const hours =
        clockIn && clockOut ? Math.max(0, (clockOut - clockIn) / 3600000) : undefined;
      return {
        id: row.id as string,
        employeeId: row.employee_id as string,
        employeeName: emp
          ? `${emp.first_name ?? ""} ${emp.last_name ?? ""}`.trim()
          : (row.employee_id as string),
        shiftDate: row.shift_date as string,
        clockInAt: row.clock_in_at as string | undefined,
        clockOutAt: row.clock_out_at as string | undefined,
        shiftStatus: row.shift_status as string | undefined,
        hours,
      };
    });

    const adjustments = (await getTimesheetAdjustments(companyId, "pending")).map((a) => ({
      id: a.id,
      employeeId: a.employeeId,
      reason: a.reason,
      status: a.status,
      proposedPunchedAt: a.proposedPunchedAt,
    }));

    if (asExport) {
      const header = "employee,shift_date,clock_in,clock_out,status,hours\n";
      const lines = mapped
        .map(
          (s) =>
            `"${s.employeeName}",${s.shiftDate},${s.clockInAt ?? ""},${s.clockOutAt ?? ""},${s.shiftStatus ?? ""},${s.hours ?? ""}`
        )
        .join("\n");
      return new Response(header + lines, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="timesheet-${date}.csv"`,
        },
      });
    }

    return apiOk({ shifts: mapped, adjustments });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load time data", 500);
  }
}

export async function POST(request: Request) {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  if (!["admin", "planner"].includes(profile.role)) {
    return apiError("Admin access required", 403);
  }

  try {
    const body = await parseJson<{
      action: "approve_adjustment" | "deny_adjustment";
      adjustmentId: string;
      companyId?: string;
    }>(request);

    const { reviewTimesheetAdjustment } = await import("@/lib/db/hr/time-schedule");
    await reviewTimesheetAdjustment(
      body.companyId || MORRIS_COMPANY_ID,
      body.adjustmentId,
      body.action === "approve_adjustment",
      profile.id
    );
    return apiOk({ status: body.action === "approve_adjustment" ? "approved" : "denied" });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Action failed", 500);
  }
}
