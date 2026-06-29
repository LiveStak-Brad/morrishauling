import { morrisConfig } from "@/lib/morris-config";
import { createBradTestEmployee } from "@/lib/db/hr/create-test-employee";
import { requireApiPermission } from "@/lib/api/require-profile";
import { requireDevToolsApi } from "@/lib/env/dev-tools";
import { apiOk, apiError, parseJson } from "@/lib/api/route-utils";
import type { EmploymentType } from "@/types/hr/ats";

export async function POST(request: Request) {
  const blocked = requireDevToolsApi();
  if (blocked) return blocked;

  const profile = await requireApiPermission("hr.employees.write");
  if (profile instanceof Response) return profile;
  try {
    const body = await parseJson<{ employmentType?: EmploymentType }>(request).catch(
      () => ({ employmentType: undefined as EmploymentType | undefined })
    );
    const result = await createBradTestEmployee(body.employmentType ?? "w2_full_time");
    return apiOk(result);
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to create test employee", 500);
  }
}
