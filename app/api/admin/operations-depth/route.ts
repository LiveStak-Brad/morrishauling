import { apiError, apiOk } from "@/lib/api/route-utils";
import { requireApiProfile } from "@/lib/api/require-profile";
import { getOperationsDepthSnapshot } from "@/lib/db/operations-depth";

export async function GET(request: Request) {
  try {
    const profile = await requireApiProfile();
    if (profile instanceof Response) return profile;
    if (!["admin", "planner"].includes(profile.role)) {
      return apiError("Admin access required", 403);
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    if (!companyId) return apiError("companyId required", 400);

    const data = await getOperationsDepthSnapshot(companyId);
    return apiOk({ data });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load operations depth");
  }
}
