import { morrisConfig } from "@/lib/morris-config";
import { getEmployeeShifts, createEmployeeShift } from "@/lib/db/hr";
import { requireApiPermission } from "@/lib/api/require-profile";
import { apiOk, apiError, parseJson } from "@/lib/api/route-utils";

export async function GET(request: Request) {
  const profile = await requireApiPermission("schedule.manage");
  if (profile instanceof Response) return profile;
  try {
    const { searchParams } = new URL(request.url);
    const shifts = await getEmployeeShifts(morrisConfig.companyId, {
      employeeId: searchParams.get("employeeId") ?? undefined,
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
    });
    return apiOk({ shifts });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load shifts", 500);
  }
}

export async function POST(request: Request) {
  const profile = await requireApiPermission("schedule.manage");
  if (profile instanceof Response) return profile;
  try {
    const body = await parseJson<{
      employeeId: string;
      shiftDate: string;
      startTime: string;
      endTime: string;
      role?: string;
      notes?: string;
    }>(request);
    const shiftId = await createEmployeeShift(morrisConfig.companyId, body, profile.id);
    return apiOk({ shiftId });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to create shift", 500);
  }
}
