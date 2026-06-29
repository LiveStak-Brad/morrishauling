import { morrisConfig } from "@/lib/morris-config";
import { assignCourse } from "@/lib/db/hr/training";
import { requireApiPermission } from "@/lib/api/require-profile";
import { apiOk, apiError, parseJson } from "@/lib/api/route-utils";

export async function POST(request: Request) {
  const profile = await requireApiPermission("training.manage");
  if (profile instanceof Response) return profile;
  try {
    const body = await parseJson<{
      courseId: string;
      employeeId?: string;
      employmentType?: string;
      employeeRole?: string;
      positionId?: string;
      isRequired?: boolean;
      dueDate?: string;
      renewalMonths?: number;
    }>(request);
    if (!body.courseId) return apiError("courseId required", 400);
    const assignId = await assignCourse(morrisConfig.companyId, body);
    return apiOk({ assignId });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to assign course", 500);
  }
}
