import { apiError, apiOk, parseJson } from "@/lib/api/route-utils";
import { requireApiProfile } from "@/lib/api/require-profile";
import { isAdmin, isPlanner } from "@/lib/auth/permissions";
import {
  getOrCreateScrapRoute,
  getScrapRequest,
  replaceScrapRouteStops,
  updateScrapRequest,
} from "@/lib/db/scrap-fridays";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { MORRIS_COMPANY_ID } from "@/lib/morris-config";

export async function GET(request: Request) {
  try {
    const profile = await requireApiProfile();
    if (profile instanceof Response) return profile;
    if (!isAdmin(profile) && !isPlanner(profile) && profile.role !== "employee") {
      return apiError("Forbidden", 403);
    }
    const fridayId = new URL(request.url).searchParams.get("fridayId");
    if (!fridayId) return apiError("fridayId required", 400);
    const route = await getOrCreateScrapRoute(fridayId);
    return apiOk({ route });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load route");
  }
}

export async function POST(request: Request) {
  try {
    const profile = await requireApiProfile();
    if (profile instanceof Response) return profile;
    if (!isAdmin(profile) && !isPlanner(profile)) return apiError("Forbidden", 403);

    const body = await parseJson<{
      fridayId: string;
      truckId?: string | null;
      trailerId?: string | null;
      driverId?: string | null;
      publish?: boolean;
      stops: Array<{
        requestId?: string | null;
        stopType?: string;
        stopOrder: number;
        plannedArrivalStart?: string | null;
        plannedArrivalEnd?: string | null;
      }>;
    }>(request);

    if (!body.fridayId) return apiError("fridayId required", 400);
    const route = await getOrCreateScrapRoute(body.fridayId);
    const supabase = createAdminClient() ?? (await createClient());

    let plannedWeight = 0;
    let plannedUnits = 0;
    let plannedMinutes = 0;
    for (const s of body.stops) {
      if (!s.requestId) continue;
      const req = await getScrapRequest(s.requestId);
      if (!req) continue;
      plannedWeight += Number(req.estimated_weight_lb ?? 0);
      plannedUnits += Number(req.route_units ?? 0);
      plannedMinutes += Number(req.estimated_stop_minutes ?? 0);
    }

    await supabase
      .from("scrap_routes")
      .update({
        truck_id: body.truckId ?? null,
        trailer_id: body.trailerId ?? null,
        assigned_driver_id: body.driverId ?? null,
        status: body.publish ? "published" : "draft",
        published_at: body.publish ? new Date().toISOString() : null,
        planned_route_units: plannedUnits,
        planned_weight_lb: plannedWeight,
        planned_labor_minutes: plannedMinutes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", route.id)
      .eq("company_id", MORRIS_COMPANY_ID);

    await replaceScrapRouteStops(
      route.id as string,
      body.stops.map((s) => ({
        request_id: s.requestId ?? null,
        stop_type: s.stopType ?? (s.requestId ? "pickup" : "recycling_unload"),
        stop_order: s.stopOrder,
        planned_arrival_start: s.plannedArrivalStart ?? null,
        planned_arrival_end: s.plannedArrivalEnd ?? null,
        status: body.publish ? "pending" : "pending",
      }))
    );

    if (body.publish) {
      for (const s of body.stops) {
        if (!s.requestId) continue;
        await updateScrapRequest(s.requestId, {
          status: "scheduled",
          scrap_friday_date_id: body.fridayId,
        });
      }
    }

    const refreshed = await getOrCreateScrapRoute(body.fridayId);
    return apiOk({ route: refreshed });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to save route");
  }
}
