import { morrisConfig } from "@/lib/morris-config";
import { listAllCourses, upsertCourse } from "@/lib/db/hr/training";
import { requireApiPermission } from "@/lib/api/require-profile";
import { apiOk, apiError, parseJson } from "@/lib/api/route-utils";
import type { TrainingCourse } from "@/types/hr/training";

export async function GET() {
  const profile = await requireApiPermission("training.manage");
  if (profile instanceof Response) return profile;
  try {
    const courses = await listAllCourses(morrisConfig.companyId);
    return apiOk({ courses });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load courses", 500);
  }
}

export async function POST(request: Request) {
  const profile = await requireApiPermission("training.manage");
  if (profile instanceof Response) return profile;
  try {
    const body = await parseJson<Partial<TrainingCourse> & { name: string }>(request);
    const courseId = await upsertCourse(morrisConfig.companyId, body);
    return apiOk({ courseId });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to save course", 500);
  }
}
