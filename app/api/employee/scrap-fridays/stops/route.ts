import { apiError, apiOk, parseJson } from "@/lib/api/route-utils";
import { requireApiProfile } from "@/lib/api/require-profile";
import { isAdmin, isEmployee, isPlanner } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { MORRIS_COMPANY_ID } from "@/lib/morris-config";
import { updateScrapRequest } from "@/lib/db/scrap-fridays";

export async function GET(request: Request) {
  try {
    const profile = await requireApiProfile();
    if (profile instanceof Response) return profile;
    if (!isAdmin(profile) && !isPlanner(profile) && !isEmployee(profile)) {
      return apiError("Forbidden", 403);
    }
    const fridayId = new URL(request.url).searchParams.get("fridayId");
    const supabase = await createClient();
    let routeQuery = supabase
      .from("scrap_routes")
      .select("*, scrap_route_stops(*, scrap_pickup_requests(*, scrap_pickup_items(*), scrap_pickup_media(*)))")
      .eq("company_id", MORRIS_COMPANY_ID)
      .in("status", ["published", "in_progress", "completed"]);
    if (fridayId) routeQuery = routeQuery.eq("scrap_friday_date_id", fridayId);
    const { data, error } = await routeQuery.order("created_at", { ascending: false }).limit(5);
    if (error) throw new Error(error.message);
    return apiOk({ routes: data ?? [] });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load stops");
  }
}

export async function PATCH(request: Request) {
  try {
    const profile = await requireApiProfile();
    if (profile instanceof Response) return profile;
    if (!isAdmin(profile) && !isPlanner(profile) && !isEmployee(profile)) {
      return apiError("Forbidden", 403);
    }
    const body = await parseJson<{
      stopId: string;
      status?: string;
      actualWeightLb?: number;
      notes?: string;
      result?: string;
      requestStatus?: string;
    }>(request);
    if (!body.stopId) return apiError("stopId required", 400);
    const supabase = await createClient();
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.status) {
      patch.status = body.status;
      if (body.status === "arrived") patch.actual_arrival = new Date().toISOString();
      if (body.status === "completed" || body.status === "unable") {
        patch.actual_departure = new Date().toISOString();
      }
    }
    if (body.actualWeightLb != null) patch.actual_weight_lb = body.actualWeightLb;
    if (body.notes !== undefined) patch.notes = body.notes;
    if (body.result !== undefined) patch.result = body.result;

    const { data, error } = await supabase
      .from("scrap_route_stops")
      .update(patch)
      .eq("id", body.stopId)
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    if (body.requestStatus && data.request_id) {
      await updateScrapRequest(data.request_id as string, {
        status: body.requestStatus,
        ...(body.requestStatus === "completed"
          ? { completed_at: new Date().toISOString() }
          : {}),
      });
    }

    return apiOk({ stop: data });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to update stop");
  }
}
