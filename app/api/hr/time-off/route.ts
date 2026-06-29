import { morrisConfig } from "@/lib/morris-config";
import { getTimeOffRequests, createTimeOffRequest, reviewTimeOffRequest, getPtoBalances } from "@/lib/db/hr";
import { requireApiPermission, requireApiProfile } from "@/lib/api/require-profile";
import { apiOk, apiError, parseJson } from "@/lib/api/route-utils";

export async function GET(request: Request) {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = profile.role === "employee" ? profile.employee_id ?? undefined : searchParams.get("employeeId") ?? undefined;
    const requests = await getTimeOffRequests(morrisConfig.companyId, employeeId ?? undefined);
    const balances =
      employeeId && profile.employee_id
        ? await getPtoBalances(morrisConfig.companyId, profile.employee_id)
        : employeeId
          ? await getPtoBalances(morrisConfig.companyId, employeeId)
          : [];
    return apiOk({ requests, balances });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load time off", 500);
  }
}

export async function POST(request: Request) {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  try {
    const body = await parseJson<{
      employeeId?: string;
      requestType: string;
      startDate: string;
      endDate: string;
      hoursRequested?: number;
      reason?: string;
      partialDay?: boolean;
      action?: string;
      requestId?: string;
      approved?: boolean;
      notes?: string;
    }>(request);

    if (body.action === "review" && body.requestId) {
      const reviewer = await requireApiPermission("schedule.manage");
      if (reviewer instanceof Response) return reviewer;
      await reviewTimeOffRequest(morrisConfig.companyId, body.requestId, body.approved ?? false, profile.id, body.notes);
      return apiOk({ reviewed: true });
    }

    const employeeId = profile.employee_id ?? body.employeeId;
    if (!employeeId) return apiError("Employee ID required", 400);
    const reqId = await createTimeOffRequest(morrisConfig.companyId, employeeId, body);
    return apiOk({ requestId: reqId });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Time off request failed", 500);
  }
}
