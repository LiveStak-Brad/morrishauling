import { morrisConfig } from "@/lib/morris-config";
import { getCourseDetail, getQuizQuestionsPublic } from "@/lib/db/hr/training";
import { requireEmployeeMeContext } from "@/lib/api/require-profile";
import { apiOk, apiError } from "@/lib/api/route-utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const ctx = await requireEmployeeMeContext();
  if (ctx instanceof Response) return ctx;
  const { courseId } = await params;
  try {
    const detail = await getCourseDetail(morrisConfig.companyId, ctx.employeeId, courseId);
    if (!detail) return apiError("Course not found", 404);
    const quizQuestions = await getQuizQuestionsPublic(morrisConfig.companyId, courseId);
    return apiOk({ detail, quizQuestions });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load course", 500);
  }
}
