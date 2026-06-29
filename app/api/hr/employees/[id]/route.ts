import { morrisConfig } from "@/lib/morris-config";
import {
  getHrEmployeeById,
  updateHrEmployee,
  getOnboardingProgress,
  getEmployeeDocuments,
  getEmployeeDispatchStats,
  activateEmployee,
  terminateEmployee,
} from "@/lib/db/hr";
import { requireApiPermission } from "@/lib/api/require-profile";
import { apiOk, apiError, parseJson } from "@/lib/api/route-utils";
import type { HrEmployee } from "@/types/hr/employee";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await requireApiPermission("hr.employees.read");
  if (profile instanceof Response) return profile;
  try {
    const { id } = await params;
    const [employee, onboarding, documents, dispatchStats] = await Promise.all([
      getHrEmployeeById(morrisConfig.companyId, id),
      getOnboardingProgress(morrisConfig.companyId, id),
      getEmployeeDocuments(morrisConfig.companyId, id),
      getEmployeeDispatchStats(morrisConfig.companyId, id),
    ]);
    if (!employee) return apiError("Employee not found", 404);
    return apiOk({ employee, onboarding, documents, dispatchStats });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load employee", 500);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await requireApiPermission("hr.employees.write");
  if (profile instanceof Response) return profile;
  try {
    const { id } = await params;
    const updates = await parseJson<Partial<HrEmployee>>(request);
    await updateHrEmployee(morrisConfig.companyId, id, updates);
    const employee = await getHrEmployeeById(morrisConfig.companyId, id);
    return apiOk({ employee });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to update employee", 500);
  }
}
