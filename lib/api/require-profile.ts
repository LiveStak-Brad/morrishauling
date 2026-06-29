import { cookies } from "next/headers";
import { getCurrentProfile } from "@/lib/auth/server";
import { isAdmin } from "@/lib/auth/permissions";
import type { UserProfile } from "@/lib/auth/types";
import type { Role } from "@/types";
import { hasPermission } from "@/lib/auth/permissions-hr";
import type { HrPermission } from "@/types/hr/permissions";
import { apiError } from "./route-utils";

export const PREVIEW_EMPLOYEE_COOKIE = "morris_preview_employee_id";

/** Employee id for /api/me/* — employees use their profile; admins use preview cookie. */
export async function resolveActingEmployeeId(
  profile: UserProfile
): Promise<string | null> {
  if (profile.role === "employee" && profile.employee_id) {
    return profile.employee_id;
  }
  if (isAdmin(profile)) {
    const cookieStore = await cookies();
    const preview = cookieStore.get(PREVIEW_EMPLOYEE_COOKIE)?.value;
    return preview ?? null;
  }
  return profile.employee_id ?? null;
}

export async function requireActingEmployeeId(
  profile: UserProfile
): Promise<string | Response> {
  const employeeId = await resolveActingEmployeeId(profile);
  if (!employeeId) {
    return apiError(
      profile.role === "admin"
        ? "Select an employee in Admin Preview Mode to view employee data"
        : "Employee record required",
      403
    );
  }
  return employeeId;
}

/** Profile + acting employee id for /api/me/* routes. */
export async function requireEmployeeMeContext(): Promise<
  { profile: UserProfile; employeeId: string } | Response
> {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  const employeeId = await requireActingEmployeeId(profile);
  if (employeeId instanceof Response) return employeeId;
  return { profile, employeeId };
}

export async function requireApiProfile(): Promise<UserProfile | Response> {
  const profile = await getCurrentProfile();
  if (!profile) return apiError("Authentication required", 401);
  if (profile.status !== "active") return apiError("Account inactive", 403);
  return profile;
}

export async function requireApiRole(allowed: Role[]): Promise<UserProfile | Response> {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  if (!allowed.includes(profile.role) && !isAdmin(profile) && profile.role !== "hr" && profile.role !== "office_admin") {
    return apiError("Forbidden", 403);
  }
  return profile;
}

export async function requireApiPermission(permission: HrPermission): Promise<UserProfile | Response> {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  if (!hasPermission(profile, permission)) return apiError("Forbidden", 403);
  return profile;
}
