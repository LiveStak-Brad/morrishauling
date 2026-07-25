import { apiError, apiOk, parseJson } from "@/lib/api/route-utils";
import { requireApiProfile } from "@/lib/api/require-profile";
import { isAdmin, isPlanner } from "@/lib/auth/permissions";
import { listAllScrapFridaysAdmin, upsertScrapFridayDate } from "@/lib/db/scrap-fridays";

export async function GET() {
  try {
    const profile = await requireApiProfile();
    if (profile instanceof Response) return profile;
    if (!isAdmin(profile) && !isPlanner(profile)) return apiError("Forbidden", 403);
    const dates = await listAllScrapFridaysAdmin();
    return apiOk({ dates });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load dates");
  }
}

export async function POST(request: Request) {
  try {
    const profile = await requireApiProfile();
    if (profile instanceof Response) return profile;
    if (!isAdmin(profile) && !isPlanner(profile)) return apiError("Forbidden", 403);
    const body = await parseJson<{
      id?: string;
      route_date: string;
      status?: string;
      max_route_units?: number;
      max_weight_lb?: number;
      max_volume_cuft?: number;
      max_labor_minutes?: number;
      notes?: string | null;
      active_zones?: Record<string, unknown>;
    }>(request);
    if (!body.route_date) return apiError("route_date required", 400);
    const date = await upsertScrapFridayDate(body);
    return apiOk({ date });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to save date");
  }
}
