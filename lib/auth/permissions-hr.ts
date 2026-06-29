import type { UserProfile } from "@/lib/auth/types";
import { isStaffOwnerEmail } from "./staff-allowlist";
import type { HrPermission } from "@/types/hr/permissions";
import { isAdmin } from "./permissions";

const ROLE_PERMISSIONS: Record<string, HrPermission[]> = {
  owner: [
    "hr.applicants.read", "hr.applicants.write", "hr.applicants.hire",
    "hr.employees.read", "hr.employees.write", "hr.employees.terminate",
    "hr.documents.read", "hr.documents.manage", "hr.documents.sign",
    "hr.payroll.read", "hr.payroll.export", "hr.payroll.lock",
    "hr.tax.read", "hr.notes.read", "hr.notes.private.read", "hr.discipline.write",
    "timeclock.approve", "schedule.manage", "equipment.assign",
    "training.manage", "performance.manage",
  ],
  operations_manager: [
    "hr.applicants.read", "hr.applicants.write", "hr.applicants.hire",
    "hr.employees.read", "hr.employees.write",
    "hr.documents.read", "hr.documents.manage",
    "hr.payroll.read", "hr.notes.read", "hr.discipline.write",
    "timeclock.approve", "schedule.manage", "equipment.assign",
    "training.manage", "performance.manage",
  ],
  hr: [
    "hr.applicants.read", "hr.applicants.write", "hr.applicants.hire",
    "hr.employees.read", "hr.employees.write", "hr.employees.terminate",
    "hr.documents.read", "hr.documents.manage",
    "hr.payroll.read", "hr.tax.read",
    "hr.notes.read", "hr.notes.private.read", "hr.discipline.write",
    "training.manage", "performance.manage",
  ],
  office_admin: [
    "hr.applicants.read", "hr.employees.read",
    "hr.documents.read", "hr.payroll.read", "hr.tax.read",
    "hr.notes.read",
  ],
  dispatcher: [
    "hr.employees.read", "schedule.manage", "timeclock.approve", "equipment.assign",
  ],
  crew_leader: [
    "hr.employees.read", "timeclock.approve", "schedule.manage",
  ],
  driver: ["hr.documents.sign"],
  employee: ["hr.documents.sign"],
};

function resolveWorkforceRole(profile: UserProfile): string {
  if (isStaffOwnerEmail(profile.email) && profile.role === "admin") return "owner";
  if (profile.role === "hr") return "hr";
  if (profile.role === "office_admin") return "office_admin";
  if (profile.role === "planner") return "dispatcher";
  return "employee";
}

export function hasPermission(
  profile: UserProfile | null | undefined,
  permission: HrPermission
): boolean {
  if (!profile || profile.status !== "active") return false;
  if (isAdmin(profile)) return true;

  const role = resolveWorkforceRole(profile);
  const perms = ROLE_PERMISSIONS[role] ?? [];
  return perms.includes(permission);
}

export function canAccessHrAdmin(profile: UserProfile | null | undefined): boolean {
  if (!profile) return false;
  if (isAdmin(profile) || profile.role === "hr" || profile.role === "office_admin") return true;
  return hasPermission(profile, "hr.employees.read");
}

export function requireHrPermission(
  profile: UserProfile,
  permission: HrPermission
): boolean {
  return hasPermission(profile, permission);
}
