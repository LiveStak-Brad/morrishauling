import { apiError, apiOk } from "@/lib/api/route-utils";
import { getCurrentProfile } from "@/lib/auth/server";
import { getOperationsCommandCenter } from "@/lib/db/operations";

export async function GET(request: Request) {
  try {
    const profile = await getCurrentProfile();
    if (!profile || (profile.role !== "admin" && profile.role !== "planner")) {
      return apiError("Admin access required", 403);
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");
    if (!companyId) return apiError("companyId required", 400);

    const debug = searchParams.get("debug") === "1" || searchParams.get("debug") === "true";
    const result = await getOperationsCommandCenter(companyId, { debug });

    if (debug && result && typeof result === "object" && "debug" in result) {
      return apiOk({ data: result.data, debug: result.debug });
    }

    return apiOk({ data: result });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load operations dashboard");
  }
}
