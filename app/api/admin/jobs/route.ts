import { morrisConfig } from "@/lib/morris-config";
import { getJobsWithMeta, createAdminJobManual } from "@/lib/db/operations";
import { requireApiProfile } from "@/lib/api/require-profile";
import { apiOk, apiError, parseJson } from "@/lib/api/route-utils";
import { canAccessDivision, getProfileDivisionScope } from "@/lib/auth/permissions";
import { serviceTypeToDivision } from "@/lib/divisions";

export async function GET(request: Request) {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  if (!["admin", "planner"].includes(profile.role)) {
    return apiError("Admin access required", 403);
  }
  try {
    const { searchParams } = new URL(request.url);
    const { jobs, meta } = await getJobsWithMeta(morrisConfig.companyId, {
      status: searchParams.get("status") ?? undefined,
      scheduledDate: searchParams.get("scheduledDate") ?? undefined,
    });
    const scope = getProfileDivisionScope(profile);
    const filtered = jobs.filter((j) => {
      const d = j.divisionId ?? serviceTypeToDivision(j.serviceType);
      return canAccessDivision(profile, d);
    });
    return apiOk({
      jobs: filtered,
      meta: { ...meta, divisionScope: scope },
    });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load jobs", 500);
  }
}

export async function POST(request: Request) {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  if (!["admin", "planner"].includes(profile.role)) {
    return apiError("Admin access required", 403);
  }
  try {
    const body = await parseJson<{
      customerId: string;
      serviceType: "junk_removal" | "hauling_transport";
      street: string;
      city: string;
      state: string;
      zip: string;
      junkType?: string;
      scheduledDate?: string;
      scheduledWindowLabel?: string;
      estimatedTotal?: number;
      notes?: string;
      assignedEmployeeIds?: string[];
      truckId?: string;
      trailerId?: string;
    }>(request);
    if (!body.customerId || !body.street || !body.city || !body.zip) {
      return apiError("Customer and address required", 400);
    }
    const job = await createAdminJobManual(morrisConfig.companyId, body, {
      actorProfileId: profile.id,
    });
    return apiOk({ job });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to create job", 500);
  }
}
