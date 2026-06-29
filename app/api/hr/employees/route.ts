import { morrisConfig } from "@/lib/morris-config";
import { getHrEmployees, createEmployeeDirectly } from "@/lib/db/hr/employees";
import { requireApiPermission } from "@/lib/api/require-profile";
import { apiOk, apiError, parseJson } from "@/lib/api/route-utils";
import type { EmploymentType } from "@/types/hr/ats";

export async function GET(request: Request) {
  const profile = await requireApiPermission("hr.employees.read");
  if (profile instanceof Response) return profile;
  try {
    const { searchParams } = new URL(request.url);
    const employees = await getHrEmployees(morrisConfig.companyId, {
      lifecycleStatus: searchParams.get("lifecycleStatus") ?? undefined,
      employmentType: searchParams.get("employmentType") ?? undefined,
      search: searchParams.get("search") ?? undefined,
    });
    return apiOk({ employees });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load employees", 500);
  }
}

export async function POST(request: Request) {
  const profile = await requireApiPermission("hr.employees.write");
  if (profile instanceof Response) return profile;
  try {
    const body = await parseJson<{
      firstName: string;
      lastName: string;
      email?: string;
      phone?: string;
      employmentType: EmploymentType;
      role?: string;
      departmentId?: string;
      positionId?: string;
      payType?: string;
      hourlyRate?: number;
      hireDate?: string;
    }>(request);
    if (!body.firstName || !body.lastName || !body.employmentType) {
      return apiError("firstName, lastName, and employmentType required", 400);
    }
    const result = await createEmployeeDirectly(morrisConfig.companyId, body, {
      actorProfileId: profile.id,
    });
    return apiOk(result);
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to create employee", 500);
  }
}
