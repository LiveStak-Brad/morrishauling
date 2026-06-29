import { morrisConfig } from "@/lib/morris-config";
import { getOperationalTrucks, getOperationalTrailers } from "@/lib/db/operations-depth";
import { requireApiPermission } from "@/lib/api/require-profile";
import { apiOk, apiError } from "@/lib/api/route-utils";

export async function GET() {
  const profile = await requireApiPermission("equipment.assign");
  if (profile instanceof Response) return profile;
  try {
    const [trucks, trailers] = await Promise.all([
      getOperationalTrucks(morrisConfig.companyId),
      getOperationalTrailers(morrisConfig.companyId),
    ]);
    const units = [
      ...trucks.map((t) => ({
        id: t.id,
        name: t.name,
        kind: "truck" as const,
        status: t.status,
        licensePlate: t.licensePlate,
      })),
      ...trailers.map((t) => ({
        id: t.id,
        name: t.name,
        kind: "trailer" as const,
        status: t.status,
        licensePlate: t.licensePlate,
      })),
    ];
    return apiOk({ units });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load fleet units", 500);
  }
}
