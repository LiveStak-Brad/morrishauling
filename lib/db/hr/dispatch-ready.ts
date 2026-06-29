import { format, addDays } from "date-fns";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getOnboardingProgress } from "./employees";
import { getAssignedCourses } from "./training";
import type { DispatchReadyEmployee } from "@/types/hr/nav";

async function sbWrite() {
  const admin = createAdminClient();
  if (admin) return admin;
  return createClient();
}

export async function getDispatchReadyEmployees(companyId: string): Promise<DispatchReadyEmployee[]> {
  const sb = await sbWrite();
  const today = format(new Date(), "yyyy-MM-dd");
  const soon = format(addDays(new Date(), 30), "yyyy-MM-dd");

  const { data: employees, error } = await sb
    .from("employees")
    .select("id, profile_id, first_name, last_name, role, lifecycle_status, employment_type, employee_number, driver_license_on_file")
    .eq("company_id", companyId)
    .eq("lifecycle_status", "active")
    .order("last_name");
  if (error) throw error;

  const { data: credentials } = await sb
    .from("employee_credentials")
    .select("employee_id, credential_type, expires_at, status")
    .eq("company_id", companyId)
    .in("credential_type", ["drivers_license", "cdl", "dot_medical"]);

  const credByEmp = new Map<string, typeof credentials>();
  for (const c of credentials ?? []) {
    const list = credByEmp.get(c.employee_id) ?? [];
    list.push(c);
    credByEmp.set(c.employee_id, list);
  }

  const results: DispatchReadyEmployee[] = [];
  for (const emp of employees ?? []) {
    const progress = await getOnboardingProgress(companyId, emp.id);
    const warnings: string[] = [];
    if (!progress.canActivate) {
      warnings.push(`Onboarding ${progress.percentComplete}% complete`);
    }

    const creds = credByEmp.get(emp.id) ?? [];
    const dl = creds.find((c) => c.credential_type === "drivers_license");
    const isDriverRole = ["driver", "lead", "admin"].includes(emp.role);

    let driverLicenseOk = Boolean(emp.driver_license_on_file) || Boolean(dl);
    let licenseWarning: string | undefined;

    if (isDriverRole) {
      if (!dl && !emp.driver_license_on_file) {
        driverLicenseOk = false;
        licenseWarning = "Driver license not on file";
        warnings.push(licenseWarning);
      } else if (dl?.expires_at && dl.expires_at <= soon) {
        driverLicenseOk = false;
        licenseWarning = `License expires ${dl.expires_at}`;
        warnings.push(licenseWarning);
      } else if (dl?.status === "expired") {
        driverLicenseOk = false;
        licenseWarning = "Driver license expired";
        warnings.push(licenseWarning);
      }
    }

    try {
      const assigned = await getAssignedCourses(companyId, emp.id);
      const trainingIssues = assigned.filter(
        (a) => a.isOverdue || a.status === "expired" || (a.course.isRequired && a.status === "not_started")
      );
      if (trainingIssues.length) {
        warnings.push(`${trainingIssues.length} training item(s) overdue or incomplete`);
      }
    } catch {
      // training tables may not be migrated yet
    }

    results.push({
      id: emp.id,
      name: `${emp.first_name} ${emp.last_name}`,
      firstName: emp.first_name,
      lastName: emp.last_name,
      role: emp.role,
      lifecycleStatus: emp.lifecycle_status,
      employmentType: emp.employment_type ?? undefined,
      employeeNumber: emp.employee_number ?? undefined,
      onboardingComplete: progress.canActivate,
      onboardingPercent: progress.percentComplete,
      driverLicenseOk,
      licenseWarning,
      warnings,
      profileId: emp.profile_id ?? undefined,
    });
  }

  return results;
}

export async function getActiveClockedInCount(companyId: string): Promise<number> {
  const sb = await sbWrite();
  const today = format(new Date(), "yyyy-MM-dd");
  const { count } = await sb
    .from("employee_timeclock")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("shift_date", today)
    .is("clock_out_at", null);
  return count ?? 0;
}
