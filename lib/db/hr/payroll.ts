import { format, startOfWeek, endOfWeek } from "date-fns";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/db/activity";
import { rowToPayPeriod, rowToPayrollEntry, rowToPayrollExport, rowToContractor1099Yearly } from "@/lib/db/hr-mappers";
import type { PayPeriod, PayrollEntry, PayrollExportFormat } from "@/types/hr/payroll";

function id(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function sbWrite() {
  const admin = createAdminClient();
  if (admin) return admin;
  return createClient();
}

export async function getPayPeriods(companyId: string): Promise<PayPeriod[]> {
  const sb = await sbWrite();
  const { data, error } = await sb
    .from("pay_periods")
    .select("*")
    .eq("company_id", companyId)
    .order("start_date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToPayPeriod);
}

export async function createPayPeriod(companyId: string, startDate: string, endDate: string) {
  const sb = await sbWrite();
  const periodId = id("pp");
  await sb.from("pay_periods").insert({
    id: periodId,
    company_id: companyId,
    start_date: startDate,
    end_date: endDate,
    status: "open",
  });
  return periodId;
}

export async function getOrCreateCurrentPayPeriod(companyId: string): Promise<PayPeriod> {
  const start = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const end = format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const sb = await sbWrite();
  const { data: existing } = await sb
    .from("pay_periods")
    .select("*")
    .eq("company_id", companyId)
    .eq("start_date", start)
    .maybeSingle();
  if (existing) return rowToPayPeriod(existing);
  const periodId = await createPayPeriod(companyId, start, end);
  const { data } = await sb.from("pay_periods").select("*").eq("id", periodId).single();
  return rowToPayPeriod(data!);
}

export async function getPayrollEntries(companyId: string, payPeriodId: string): Promise<PayrollEntry[]> {
  const sb = await sbWrite();
  const { data, error } = await sb
    .from("payroll_entries")
    .select("*, employees(id, first_name, last_name, employee_number)")
    .eq("company_id", companyId)
    .eq("pay_period_id", payPeriodId);
  if (error) throw error;
  return (data ?? []).map(rowToPayrollEntry);
}

export async function aggregatePayrollForPeriod(companyId: string, payPeriodId: string, profileId?: string) {
  const sb = await sbWrite();
  const { data: period } = await sb.from("pay_periods").select("*").eq("id", payPeriodId).single();
  if (!period) throw new Error("Pay period not found");
  if (period.status !== "open") throw new Error("Pay period is locked");

  const { data: employees } = await sb
    .from("employees")
    .select("id, hourly_rate, pay_type, commission_rate, employment_type, overtime_eligible")
    .eq("company_id", companyId)
    .in("lifecycle_status", ["active", "on_leave"]);

  for (const emp of employees ?? []) {
    const { data: punches } = await sb
      .from("timeclock_punches")
      .select("punched_at, punch_type")
      .eq("employee_id", emp.id)
      .gte("punched_at", `${period.start_date}T00:00:00`)
      .lte("punched_at", `${period.end_date}T23:59:59`)
      .order("punched_at");

    let regularHours = 0;
    if (punches && punches.length > 0) {
      let clockIn: Date | null = null;
      for (const p of punches) {
        if (p.punch_type === "clock_in" || p.punch_type === "lunch_in" || p.punch_type === "break_end") {
          clockIn = new Date(p.punched_at);
        } else if (clockIn && (p.punch_type === "clock_out" || p.punch_type === "lunch_out" || p.punch_type === "break_start")) {
          regularHours += (new Date(p.punched_at).getTime() - clockIn.getTime()) / (1000 * 60 * 60);
          clockIn = null;
        }
      }
    } else {
      const { data: timeclock } = await sb
        .from("employee_timeclock")
        .select("clock_in_at, clock_out_at")
        .eq("employee_id", emp.id)
        .gte("shift_date", period.start_date)
        .lte("shift_date", period.end_date)
        .not("clock_out_at", "is", null);

      for (const entry of timeclock ?? []) {
        const start = new Date(entry.clock_in_at).getTime();
        const end = new Date(entry.clock_out_at!).getTime();
        regularHours += (end - start) / (1000 * 60 * 60);
      }
    }
    regularHours = Math.round(regularHours * 100) / 100;

    const hourlyRate = Number(emp.hourly_rate ?? 18);
    const otHours = emp.overtime_eligible && regularHours > 40 ? regularHours - 40 : 0;
    const regHours = regularHours - otHours;
    const grossPay = regHours * hourlyRate + otHours * hourlyRate * 1.5;

    const { data: existing } = await sb
      .from("payroll_entries")
      .select("id")
      .eq("pay_period_id", payPeriodId)
      .eq("employee_id", emp.id)
      .maybeSingle();

    const row = {
      company_id: companyId,
      pay_period_id: payPeriodId,
      employee_id: emp.id,
      regular_hours: regHours,
      overtime_hours: otHours,
      gross_pay: Math.round(grossPay * 100) / 100,
      net_pay: Math.round(grossPay * 0.75 * 100) / 100,
      federal_withholding: Math.round(grossPay * 0.12 * 100) / 100,
      state_withholding: Math.round(grossPay * 0.05 * 100) / 100,
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      await sb.from("payroll_entries").update(row).eq("id", existing.id);
    } else {
      await sb.from("payroll_entries").insert({ id: id("pe"), ...row });
    }
  }

  await logActivity({
    companyId,
    actorProfileId: profileId,
    entityType: "payroll",
    entityId: payPeriodId,
    action: "aggregated",
    message: "Payroll entries aggregated from timeclock",
  });
}

export async function lockPayPeriod(companyId: string, payPeriodId: string, profileId?: string) {
  const sb = await sbWrite();
  await sb.from("pay_periods").update({
    status: "locked",
    locked_at: new Date().toISOString(),
    locked_by_profile_id: profileId,
    updated_at: new Date().toISOString(),
  }).eq("id", payPeriodId).eq("company_id", companyId);
}

export async function exportPayrollCsv(
  companyId: string,
  payPeriodId: string,
  format: PayrollExportFormat,
  profileId?: string
): Promise<{ csv: string; fileName: string; exportId: string }> {
  const entries = await getPayrollEntries(companyId, payPeriodId);
  const sb = await sbWrite();
  const { data: period } = await sb.from("pay_periods").select("*").eq("id", payPeriodId).single();

  const headers =
    format === "quickbooks"
      ? ["Employee", "EmployeeNumber", "RegularHours", "OvertimeHours", "GrossPay", "FederalTax", "StateTax", "NetPay"]
      : ["employee_name", "employee_number", "regular_hours", "overtime_hours", "gross_pay", "federal_withholding", "state_withholding", "net_pay"];

  const rows = entries.map((e) => {
    const name = e.employee ? `${e.employee.firstName} ${e.employee.lastName}` : e.employeeId;
    const num = e.employee?.employeeNumber ?? "";
    return [name, num, e.regularHours, e.overtimeHours, e.grossPay, e.federalWithholding, e.stateWithholding, e.netPay].join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");
  const fileName = `payroll-${period?.start_date}-${period?.end_date}-${format}.csv`;
  const exportId = id("pexport");

  await sb.from("payroll_exports").insert({
    id: exportId,
    company_id: companyId,
    pay_period_id: payPeriodId,
    export_format: format,
    file_name: fileName,
    row_count: entries.length,
    exported_by_profile_id: profileId,
  });

  await sb.from("pay_periods").update({ status: "exported", updated_at: new Date().toISOString() }).eq("id", payPeriodId);

  return { csv, fileName, exportId };
}

export async function getContractor1099Summaries(companyId: string, taxYear: number) {
  const sb = await sbWrite();
  const { data, error } = await sb
    .from("contractor_1099_yearly")
    .select("*, employees(first_name, last_name)")
    .eq("company_id", companyId)
    .eq("tax_year", taxYear);
  if (error) throw error;
  return (data ?? []).map(rowToContractor1099Yearly);
}

export async function upsertContractor1099(
  companyId: string,
  employeeId: string,
  taxYear: number,
  totalCompensation: number
) {
  const sb = await sbWrite();
  const { data: existing } = await sb
    .from("contractor_1099_yearly")
    .select("id")
    .eq("company_id", companyId)
    .eq("employee_id", employeeId)
    .eq("tax_year", taxYear)
    .maybeSingle();

  if (existing) {
    await sb.from("contractor_1099_yearly").update({
      total_compensation: totalCompensation,
      updated_at: new Date().toISOString(),
    }).eq("id", existing.id);
  } else {
    await sb.from("contractor_1099_yearly").insert({
      id: id("1099"),
      company_id: companyId,
      employee_id: employeeId,
      tax_year: taxYear,
      total_compensation: totalCompensation,
    });
  }
}
