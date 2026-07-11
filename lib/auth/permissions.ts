import type { Role } from "@/types";
import type { UserProfile } from "./types";
import type { Invoice, Job } from "@/types";
import { canHoldPrivilegedStaffRole, isStaffOwnerEmail } from "./staff-allowlist";
import type { DivisionId } from "@/lib/divisions";
import { serviceTypeToDivision } from "@/lib/divisions";

export function isAdmin(profile: UserProfile | null | undefined): boolean {
  return profile?.role === "admin" && canHoldPrivilegedStaffRole(profile.email);
}

export function isHr(profile: UserProfile | null | undefined): boolean {
  if (!profile || !canHoldPrivilegedStaffRole(profile.email)) return false;
  return profile.role === "hr" || profile.role === "office_admin" || isAdmin(profile);
}

export function canAccessAdmin(profile: UserProfile | null | undefined): boolean {
  return isAdmin(profile) || isHr(profile);
}

export function isEmployee(profile: UserProfile | null | undefined): boolean {
  return profile?.role === "employee" || isAdmin(profile);
}

export function isPlanner(profile: UserProfile | null | undefined): boolean {
  return profile?.role === "planner" || isAdmin(profile);
}

export function isCustomer(profile: UserProfile | null | undefined): boolean {
  return profile?.role === "customer";
}

/** Owner sees all divisions. Managers see managed_division_ids only. */
export function getProfileDivisionScope(profile: UserProfile | null | undefined): {
  scope: "all" | "limited";
  divisions: DivisionId[];
} {
  if (!profile) return { scope: "limited", divisions: [] };
  if (isAdmin(profile)) return { scope: "all", divisions: ["junk_removal", "hauling"] };
  const access = profile.division_access ?? "all";
  if (access === "all") {
    return { scope: "all", divisions: ["junk_removal", "hauling"] };
  }
  const managed = (profile.managed_division_ids ?? []).filter(
    (d): d is DivisionId => d === "junk_removal" || d === "hauling"
  );
  return { scope: "limited", divisions: managed };
}

export function canAccessDivision(
  profile: UserProfile | null | undefined,
  divisionId: DivisionId
): boolean {
  if (!profile) return false;
  if (isAdmin(profile)) return true;
  const { scope, divisions } = getProfileDivisionScope(profile);
  if (scope === "all") return true;
  return divisions.includes(divisionId);
}

export function canAccessRoute(profile: UserProfile | null, pathname: string): boolean {
  if (!profile) return false;
  if (isAdmin(profile)) return true;

  if (pathname.startsWith("/admin")) return false;
  if (pathname.startsWith("/planner")) return profile.role === "planner" || isAdmin(profile);
  if (pathname.startsWith("/employee")) return profile.role === "employee" || isAdmin(profile);
  if (pathname.startsWith("/customer")) return profile.role === "customer" || isAdmin(profile);

  return true;
}

export function canAccessJob(
  profile: UserProfile | null,
  job: Pick<Job, "customerId" | "serviceType" | "divisionId">,
  assignedEmployeeIds?: string[]
): boolean {
  if (!profile) return false;
  const divisionId = job.divisionId ?? serviceTypeToDivision(job.serviceType);
  if (isAdmin(profile) || isPlanner(profile)) {
    return canAccessDivision(profile, divisionId);
  }
  if (profile.role === "customer" && profile.customer_id) {
    return job.customerId === profile.customer_id;
  }
  if (profile.role === "employee" && profile.employee_id && assignedEmployeeIds) {
    return assignedEmployeeIds.includes(profile.employee_id);
  }
  return false;
}

export function canAccessInvoice(
  profile: UserProfile | null,
  invoice: Pick<Invoice, "customerId">,
  options?: { assignedEmployeeIds?: string[]; divisionId?: DivisionId }
): boolean {
  if (!profile) return false;
  if (isAdmin(profile) || isPlanner(profile)) {
    if (options?.divisionId) return canAccessDivision(profile, options.divisionId);
    return true;
  }
  if (profile.role === "customer" && profile.customer_id) {
    return invoice.customerId === profile.customer_id;
  }
  if (profile.role === "employee" && profile.employee_id && options?.assignedEmployeeIds) {
    return options.assignedEmployeeIds.includes(profile.employee_id);
  }
  return false;
}

export const ROUTE_ROLE_ACCESS: Record<string, Role[]> = {
  "/customer": ["customer", "admin"],
  "/employee": ["employee", "admin"],
  "/planner": ["planner", "admin"],
  "/admin": ["admin", "hr", "office_admin"],
};

export function roleAllowedForPath(role: Role, pathname: string, email?: string | null): boolean {
  const owner = isStaffOwnerEmail(email);
  const effectiveAdmin = role === "admin" && owner;
  const effectiveHr = (role === "hr" || role === "office_admin") && owner;

  if (effectiveAdmin) return true;
  if (effectiveHr) {
    if (pathname.startsWith("/employee")) return true;
    return pathname.startsWith("/admin/hr");
  }
  if (role === "admin" || role === "hr" || role === "office_admin") {
    return false;
  }
  if (pathname.startsWith("/admin")) return false;
  if (pathname.startsWith("/planner")) return role === "planner";
  if (pathname.startsWith("/employee")) return role === "employee";
  if (pathname.startsWith("/customer")) return role === "customer";
  return true;
}
