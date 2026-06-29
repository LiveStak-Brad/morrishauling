import { morrisConfig } from "@/lib/morris-config";
import { createOperationalTrailer, getOperationalTrailers } from "@/lib/db/operations-depth";
import { buildListMetaFromCounts } from "@/lib/api/admin-data-meta";
import { requireApiProfile } from "@/lib/api/require-profile";
import { apiOk, apiError, parseJson } from "@/lib/api/route-utils";

export async function GET() {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  if (!["admin", "planner"].includes(profile.role)) {
    return apiError("Admin access required", 403);
  }
  try {
    const trailers = await getOperationalTrailers(morrisConfig.companyId);
    const meta = await buildListMetaFromCounts(trailers.length, trailers.length);
    return apiOk({ trailers, meta });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load trailers", 500);
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
      name: string;
      trailerType?: string;
      licensePlate?: string;
    }>(request);
    if (!body.name?.trim()) return apiError("Trailer name required", 400);
    const trailer = await createOperationalTrailer(morrisConfig.companyId, body, {
      actorProfileId: profile.id,
    });
    return apiOk({ trailer });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to create trailer", 500);
  }
}
