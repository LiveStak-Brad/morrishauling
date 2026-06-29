import { headers } from "next/headers";
import { morrisConfig } from "@/lib/morris-config";
import { acknowledgeCourse } from "@/lib/db/hr/training";
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
    const body = await parseJson<{ signerName: string }>(request);
    if (!body.signerName?.trim()) return apiError("Signature name required", 400);
    const h = await headers();
    const completionId = await acknowledgeCourse(
      morrisConfig.companyId,
      ctx.employeeId,
      courseId,
      body.signerName,
      h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? undefined,
      h.get("user-agent") ?? undefined
    );
    return apiOk({ completionId });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Acknowledgment failed", 500);
  }
}
