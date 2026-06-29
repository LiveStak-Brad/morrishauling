import { morrisConfig } from "@/lib/morris-config";
import { submitQuizAttempt } from "@/lib/db/hr/training";
import { requireEmployeeMeContext } from "@/lib/api/require-profile";
import { apiOk, apiError, parseJson } from "@/lib/api/route-utils";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const ctx = await requireEmployeeMeContext();
  if (ctx instanceof Response) return ctx;
  const { courseId } = await params;
  try {
    const body = await parseJson<{ answers: Record<string, number> }>(request);
    const result = await submitQuizAttempt(
      morrisConfig.companyId,
      ctx.employeeId,
      courseId,
      body.answers ?? {}
    );
    return apiOk(result);
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Quiz submission failed", 500);
  }
}
