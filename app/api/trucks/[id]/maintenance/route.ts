import { apiError, apiOk, parseJson } from "@/lib/api/route-utils";
import { requireApiProfile } from "@/lib/api/require-profile";
import { createMaintenanceLog } from "@/lib/db/operations-depth";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const profile = await requireApiProfile();
    if (profile instanceof Response) return profile;
    if (profile.role !== "admin" && profile.role !== "planner") {
      return apiError("Admin access required", 403);
    }

    const { id: truckId } = await context.params;
    const body = await parseJson<{
      companyId: string;
      serviceType: string;
      serviceDate: string;
      odometerMiles?: number;
      cost?: number;
      vendor?: string;
      notes?: string;
      nextDueDate?: string;
      nextDueMiles?: number;
    }>(request);

    if (!body.companyId || !body.serviceType || !body.serviceDate) {
      return apiError("companyId, serviceType, and serviceDate required", 400);
    }

    const log = await createMaintenanceLog(
      body.companyId,
      {
        truckId,
        serviceType: body.serviceType,
        serviceDate: body.serviceDate,
        odometerMiles: body.odometerMiles,
        cost: body.cost,
        vendor: body.vendor,
        notes: body.notes,
        nextDueDate: body.nextDueDate,
        nextDueMiles: body.nextDueMiles,
      },
      { actorProfileId: profile.id }
    );
    return apiOk({ log });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to log maintenance");
  }
}
