import { morrisConfig } from "@/lib/morris-config";
import { hireApplicant } from "@/lib/db/hr";
import { requireApiPermission } from "@/lib/api/require-profile";
import { apiOk, apiError, parseJson } from "@/lib/api/route-utils";
import type { EmploymentType } from "@/types/hr/ats";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await requireApiPermission("hr.applicants.hire");
  if (profile instanceof Response) return profile;
  try {
    const { id } = await params;
    const body = await parseJson<{
      employmentType: EmploymentType;
      role?: string;
      departmentId?: string;
      positionId?: string;
      hourlyRate?: number;
    }>(request);
    if (!body.employmentType) return apiError("employmentType required", 400);
    const result = await hireApplicant(morrisConfig.companyId, id, {
      ...body,
      profileId: profile.id,
    });
    return apiOk(result);
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to hire applicant", 500);
  }
}
