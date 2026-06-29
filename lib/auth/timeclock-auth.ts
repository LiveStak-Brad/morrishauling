import type { UserProfile } from "@/lib/auth/types";
import { isAdmin } from "@/lib/auth/permissions";
import { hasPermission } from "@/lib/auth/permissions-hr";

export interface TimeclockTargetResult {
  allowed: boolean;
  employeeId: string | null;
  onBehalf: boolean;
  error?: string;
}

/** Resolve whether profile may record time for employeeId (punch / clock in / out). */
export function resolveTimeclockTarget(
  profile: UserProfile,
  requestedEmployeeId: string | undefined
): TimeclockTargetResult {
  if (profile.role === "customer") {
    return { allowed: false, employeeId: null, onBehalf: false, error: "Forbidden" };
  }

  if (profile.role === "planner") {
    return { allowed: false, employeeId: null, onBehalf: false, error: "Forbidden" };
  }

  const employeeId =
    profile.role === "employee"
      ? profile.employee_id ?? undefined
      : requestedEmployeeId ?? profile.employee_id ?? undefined;

  if (!employeeId) {
    return { allowed: false, employeeId: null, onBehalf: false, error: "Employee ID required" };
  }

  if (profile.role === "employee") {
    if (profile.employee_id !== employeeId) {
      return { allowed: false, employeeId: null, onBehalf: false, error: "Forbidden" };
    }
    return { allowed: true, employeeId, onBehalf: false };
  }

  if (isAdmin(profile)) {
    const onBehalf = Boolean(requestedEmployeeId && requestedEmployeeId !== profile.employee_id);
    return { allowed: true, employeeId, onBehalf };
  }

  if (profile.role === "hr" || profile.role === "office_admin") {
    if (!hasPermission(profile, "timeclock.approve")) {
      return { allowed: false, employeeId: null, onBehalf: false, error: "Forbidden" };
    }
    const onBehalf = Boolean(requestedEmployeeId && requestedEmployeeId !== profile.employee_id);
    return { allowed: true, employeeId, onBehalf };
  }

  return { allowed: false, employeeId: null, onBehalf: false, error: "Forbidden" };
}
