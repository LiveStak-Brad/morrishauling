import { morrisConfig } from "@/lib/morris-config";
import { checkoutAcknowledge } from "@/lib/db/hr/equipment";
import { requireEmployeeMeContext } from "@/lib/api/require-profile";
import { apiOk, apiError, parseJson } from "@/lib/api/route-utils";

export async function POST(request: Request) {
  const ctx = await requireEmployeeMeContext();
  if (ctx instanceof Response) return ctx;
  try {
    const body = await parseJson<{
      checkoutEventId: string;
      signatureName: string;
      conditionConfirmed: string;
    }>(request);
    if (!body.checkoutEventId || !body.signatureName) {
      return apiError("checkoutEventId and signatureName required", 400);
    }
    await checkoutAcknowledge(
      morrisConfig.companyId,
      ctx.employeeId,
      body.checkoutEventId,
      body.signatureName,
      body.conditionConfirmed ?? "good"
    );
    return apiOk({ acknowledged: true });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Acknowledgment failed", 500);
  }
}
