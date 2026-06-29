import { morrisConfig } from "@/lib/morris-config";
import { requireRetraining } from "@/lib/db/hr/training";
import { requireApiPermission } from "@/lib/api/require-profile";
import { apiOk, apiError, parseJson } from "@/lib/api/route-utils";

export async function POST(request: Request) {
  const profile = await requireApiPermission("training.manage");
  if (profile instanceof Response) return profile;
  try {
    const body = await parseJson<{
      employeeId: string;
      courseId: string;
      reason: string;
      dueDate: string;
    }>(request);
    if (!body.employeeId || !body.courseId || !body.reason || !body.dueDate) {
      return apiError("employeeId, courseId, reason, and dueDate required", 400);
    }
    const eventId = await requireRetraining(morrisConfig.companyId, {
      ...body,
      requiredByProfileId: profile.id,
    });
    return apiOk({ eventId });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to create retraining", 500);
  }
}
