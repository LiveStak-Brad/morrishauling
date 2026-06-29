import { morrisConfig } from "@/lib/morris-config";
import { createOperationalTruck } from "@/lib/db/operations-depth";
import { requireApiProfile } from "@/lib/api/require-profile";
import { apiOk, apiError, parseJson } from "@/lib/api/route-utils";

export async function POST(request: Request) {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  if (!["admin", "planner"].includes(profile.role)) {
    return apiError("Admin access required", 403);
  }
  try {
    const body = await parseJson<{
      name: string;
      licensePlate?: string;
      make?: string;
      model?: string;
      year?: number;
    }>(request);
    if (!body.name?.trim()) return apiError("Truck name required", 400);
    const truck = await createOperationalTruck(morrisConfig.companyId, body, {
      actorProfileId: profile.id,
    });
    return apiOk({ truck });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to create truck", 500);
  }
}
