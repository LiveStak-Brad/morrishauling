import { morrisConfig } from "@/lib/morris-config";
import {
  getEmployeeProfileSelf,
  updateEmployeeProfileSelf,
} from "@/lib/db/hr/employee-portal";
import { requireEmployeeMeContext } from "@/lib/api/require-profile";
import { apiOk, apiError, parseJson } from "@/lib/api/route-utils";
import type { EmployeeProfileUpdate } from "@/types/hr/employee-portal";

export async function GET() {
  const ctx = await requireEmployeeMeContext();
  if (ctx instanceof Response) return ctx;
  const { profile, employeeId } = ctx;
  try {
    const data = await getEmployeeProfileSelf(morrisConfig.companyId, employeeId, profile.id);
    if (!data) return apiError("Employee record not found", 404);
    return apiOk({ profile: data });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load profile", 500);
  }
}

export async function PATCH(request: Request) {
  const ctx = await requireEmployeeMeContext();
  if (ctx instanceof Response) return ctx;
  const { profile, employeeId } = ctx;
  try {
    const body = await parseJson<EmployeeProfileUpdate>(request);
    await updateEmployeeProfileSelf(morrisConfig.companyId, employeeId, profile.id, body);
    const data = await getEmployeeProfileSelf(morrisConfig.companyId, employeeId, profile.id);
    return apiOk({ profile: data });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to update profile", 500);
  }
}
