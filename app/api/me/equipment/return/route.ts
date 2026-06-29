import { morrisConfig } from "@/lib/morris-config";
import { requestReturn } from "@/lib/db/hr/equipment";
import { requireEmployeeMeContext } from "@/lib/api/require-profile";
import { apiOk, apiError, parseJson } from "@/lib/api/route-utils";

export async function POST(request: Request) {
  const ctx = await requireEmployeeMeContext();
  if (ctx instanceof Response) return ctx;
  try {
    const body = await parseJson<{ checkoutEventId: string }>(request);
    if (!body.checkoutEventId) return apiError("checkoutEventId required", 400);
    await requestReturn(morrisConfig.companyId, ctx.employeeId, body.checkoutEventId);
    return apiOk({ requested: true });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Return request failed", 500);
  }
}
