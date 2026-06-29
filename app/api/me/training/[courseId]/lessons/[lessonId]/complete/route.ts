import { morrisConfig } from "@/lib/morris-config";
import { markLessonComplete } from "@/lib/db/hr/training";
import { requireEmployeeMeContext } from "@/lib/api/require-profile";
import { apiOk, apiError } from "@/lib/api/route-utils";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> }
) {
  const ctx = await requireEmployeeMeContext();
  if (ctx instanceof Response) return ctx;
  const { lessonId } = await params;
  try {
    await markLessonComplete(morrisConfig.companyId, ctx.employeeId, lessonId);
    return apiOk({ completed: true });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to complete lesson", 500);
  }
}
