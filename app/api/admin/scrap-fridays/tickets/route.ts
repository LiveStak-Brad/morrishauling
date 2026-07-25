import { apiError, apiOk, parseJson } from "@/lib/api/route-utils";
import { requireApiProfile } from "@/lib/api/require-profile";
import { isAdmin, isPlanner } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { MORRIS_COMPANY_ID } from "@/lib/morris-config";

export async function GET(request: Request) {
  try {
    const profile = await requireApiProfile();
    if (profile instanceof Response) return profile;
    if (!isAdmin(profile) && !isPlanner(profile)) return apiError("Forbidden", 403);
    const routeId = new URL(request.url).searchParams.get("routeId");
    const supabase = await createClient();
    let q = supabase
      .from("scrap_recycling_tickets")
      .select("*")
      .eq("company_id", MORRIS_COMPANY_ID)
      .order("created_at", { ascending: false });
    if (routeId) q = q.eq("route_id", routeId);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return apiOk({ tickets: data ?? [] });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load tickets");
  }
}

export async function POST(request: Request) {
  try {
    const profile = await requireApiProfile();
    if (profile instanceof Response) return profile;
    if (!isAdmin(profile) && !isPlanner(profile)) return apiError("Forbidden", 403);
    const body = await parseJson<{
      routeId: string;
      recyclingCenter?: string;
      ticketImagePath?: string;
      materialType?: string;
      grossWeightLb?: number;
      tareWeightLb?: number;
      netWeightLb?: number;
      scrapRevenue?: number;
      batteryCount?: number;
      batteryRevenue?: number;
      fuelCost?: number;
      laborCost?: number;
      otherCosts?: number;
      notes?: string;
    }>(request);
    if (!body.routeId) return apiError("routeId required", 400);
    const supabase = await createClient();
    const net =
      body.netWeightLb ??
      (body.grossWeightLb != null && body.tareWeightLb != null
        ? Number(body.grossWeightLb) - Number(body.tareWeightLb)
        : null);
    const { data, error } = await supabase
      .from("scrap_recycling_tickets")
      .insert({
        company_id: MORRIS_COMPANY_ID,
        route_id: body.routeId,
        recycling_center: body.recyclingCenter ?? null,
        ticket_image_path: body.ticketImagePath ?? null,
        material_type: body.materialType ?? null,
        gross_weight_lb: body.grossWeightLb ?? null,
        tare_weight_lb: body.tareWeightLb ?? null,
        net_weight_lb: net,
        scrap_revenue: body.scrapRevenue ?? 0,
        battery_count: body.batteryCount ?? 0,
        battery_revenue: body.batteryRevenue ?? (body.batteryCount ?? 0) * 3,
        fuel_cost: body.fuelCost ?? 0,
        labor_cost: body.laborCost ?? 0,
        other_costs: body.otherCosts ?? 0,
        notes: body.notes ?? null,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return apiOk({ ticket: data });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to save ticket");
  }
}
