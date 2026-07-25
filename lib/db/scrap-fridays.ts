import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { MORRIS_COMPANY_ID } from "@/lib/morris-config";
import type { ScrapItemType, ScrapRequestStatus } from "@/lib/scrap-fridays/types";
import type { ScrapEstimateSummary } from "@/lib/scrap-fridays/calc";

async function scrapDb() {
  return createAdminClient() ?? (await createClient());
}

export async function listActiveScrapItemTypes(): Promise<ScrapItemType[]> {
  const supabase = await scrapDb();
  const { data, error } = await supabase
    .from("scrap_item_types")
    .select("*")
    .eq("company_id", MORRIS_COMPANY_ID)
    .eq("active", true)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapItemType);
}

function mapItemType(row: Record<string, unknown>): ScrapItemType {
  return {
    id: String(row.id),
    name: String(row.name),
    category: row.category as ScrapItemType["category"],
    active: Boolean(row.active),
    icon_key: (row.icon_key as string) ?? null,
    default_weight_lb: Number(row.default_weight_lb ?? 50),
    default_volume_cuft: Number(row.default_volume_cuft ?? 8),
    default_stop_minutes: Number(row.default_stop_minutes ?? 15),
    default_route_units: Number(row.default_route_units ?? 1),
    default_equipment: (row.default_equipment as string[]) ?? [],
    default_crew_count: Number(row.default_crew_count ?? 2),
    customer_questions: (row.customer_questions as ScrapItemType["customer_questions"]) ?? [],
    eligibility_rules: (row.eligibility_rules as Record<string, unknown>) ?? {},
    sort_order: Number(row.sort_order ?? 100),
  };
}

export async function listOpenScrapFridays() {
  const supabase = await scrapDb();
  const { data, error } = await supabase
    .from("scrap_friday_dates")
    .select("*")
    .eq("company_id", MORRIS_COMPANY_ID)
    .in("status", ["open", "full"])
    .gte("route_date", new Date().toISOString().slice(0, 10))
    .order("route_date", { ascending: true })
    .limit(12);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createScrapRequestDraft(input: {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  zip?: string;
  placeId?: string;
  latitude?: number;
  longitude?: number;
  serviceAreaOutcome?: string;
  serviceAreaMessage?: string;
  customerId?: string | null;
  draftPayload?: Record<string, unknown>;
}) {
  const supabase = await scrapDb();
  const { data, error } = await supabase
    .from("scrap_pickup_requests")
    .insert({
      company_id: MORRIS_COMPANY_ID,
      status: "draft",
      customer_id: input.customerId ?? null,
      first_name: input.firstName ?? null,
      last_name: input.lastName ?? null,
      phone: input.phone ?? null,
      email: input.email ?? null,
      address_line1: input.addressLine1 ?? null,
      city: input.city ?? null,
      state: input.state ?? "MO",
      zip: input.zip ?? null,
      place_id: input.placeId ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      service_area_outcome: input.serviceAreaOutcome ?? null,
      service_area_message: input.serviceAreaMessage ?? null,
      draft_payload: input.draftPayload ?? {},
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateScrapRequest(
  id: string,
  patch: Record<string, unknown>
) {
  const supabase = await scrapDb();
  const { data, error } = await supabase
    .from("scrap_pickup_requests")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("company_id", MORRIS_COMPANY_ID)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function replaceScrapRequestItems(
  requestId: string,
  items: Array<{
    item_type_id: string;
    item_name_snapshot: string;
    category: string;
    quantity: number;
    customer_estimated_weight_lb?: number | null;
    system_estimated_weight_lb?: number | null;
    weight_band?: string | null;
    dimensions?: Record<string, unknown>;
    size_class?: string | null;
    location_on_property?: string | null;
    detached_confirmed?: boolean;
    empty_confirmed?: boolean;
    answers?: Record<string, unknown>;
    unusually_heavy?: boolean;
    manual_review_required?: boolean;
    notes?: string | null;
  }>
) {
  const supabase = await scrapDb();
  const { error: delErr } = await supabase
    .from("scrap_pickup_items")
    .delete()
    .eq("request_id", requestId);
  if (delErr) throw new Error(delErr.message);
  if (items.length === 0) return [];
  const { data, error } = await supabase
    .from("scrap_pickup_items")
    .insert(items.map((i) => ({ ...i, request_id: requestId })))
    .select("*");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function applyEstimateToRequest(
  requestId: string,
  summary: ScrapEstimateSummary,
  extras?: Record<string, unknown>
) {
  return updateScrapRequest(requestId, {
    estimated_weight_lb: summary.estimatedWeightLb,
    estimated_volume_cuft: summary.estimatedVolumeCuft,
    estimated_stop_minutes: summary.estimatedStopMinutes,
    difficulty_score: summary.difficultyScore,
    suggested_crew_count: summary.suggestedCrewCount,
    suggested_equipment: summary.suggestedEquipment,
    route_units: summary.routeUnits,
    ...extras,
  });
}

export async function getScrapRequest(id: string) {
  const supabase = await scrapDb();
  const { data, error } = await supabase
    .from("scrap_pickup_requests")
    .select("*, scrap_pickup_items(*), scrap_pickup_media(*)")
    .eq("id", id)
    .eq("company_id", MORRIS_COMPANY_ID)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function listScrapRequests(filters?: {
  status?: ScrapRequestStatus | ScrapRequestStatus[];
  fridayId?: string;
  limit?: number;
}) {
  const supabase = await scrapDb();
  let q = supabase
    .from("scrap_pickup_requests")
    .select("*, scrap_pickup_items(count), scrap_pickup_media(count)")
    .eq("company_id", MORRIS_COMPANY_ID)
    .order("created_at", { ascending: false })
    .limit(filters?.limit ?? 100);
  if (filters?.status) {
    if (Array.isArray(filters.status)) q = q.in("status", filters.status);
    else q = q.eq("status", filters.status);
  }
  if (filters?.fridayId) q = q.eq("scrap_friday_date_id", filters.fridayId);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listAllScrapFridaysAdmin() {
  const supabase = await scrapDb();
  const { data, error } = await supabase
    .from("scrap_friday_dates")
    .select("*")
    .eq("company_id", MORRIS_COMPANY_ID)
    .order("route_date", { ascending: false })
    .limit(52);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function upsertScrapFridayDate(input: {
  id?: string;
  route_date: string;
  status?: string;
  max_route_units?: number;
  max_weight_lb?: number;
  max_volume_cuft?: number;
  max_labor_minutes?: number;
  notes?: string | null;
  active_zones?: Record<string, unknown>;
}) {
  const supabase = await scrapDb();
  const payload = {
    ...(input.id ? { id: input.id } : {}),
    company_id: MORRIS_COMPANY_ID,
    program_id: "default",
    route_date: input.route_date,
    status: input.status ?? "open",
    max_route_units: input.max_route_units ?? 40,
    max_weight_lb: input.max_weight_lb ?? 12000,
    max_volume_cuft: input.max_volume_cuft ?? 1200,
    max_labor_minutes: input.max_labor_minutes ?? 480,
    notes: input.notes ?? null,
    active_zones: input.active_zones ?? {},
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from("scrap_friday_dates")
    .upsert(payload, { onConflict: "company_id,route_date" })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function getOrCreateScrapRoute(fridayId: string) {
  const supabase = await scrapDb();
  const existing = await supabase
    .from("scrap_routes")
    .select("*, scrap_route_stops(*)")
    .eq("scrap_friday_date_id", fridayId)
    .maybeSingle();
  if (existing.data) return existing.data;
  const { data, error } = await supabase
    .from("scrap_routes")
    .insert({
      company_id: MORRIS_COMPANY_ID,
      scrap_friday_date_id: fridayId,
      status: "draft",
    })
    .select("*, scrap_route_stops(*)")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function replaceScrapRouteStops(
  routeId: string,
  stops: Array<{
    request_id?: string | null;
    stop_type?: string;
    stop_order: number;
    planned_arrival_start?: string | null;
    planned_arrival_end?: string | null;
    status?: string;
    notes?: string | null;
  }>
) {
  const supabase = await scrapDb();
  await supabase.from("scrap_route_stops").delete().eq("route_id", routeId);
  if (stops.length === 0) return [];
  const { data, error } = await supabase
    .from("scrap_route_stops")
    .insert(
      stops.map((s) => ({
        route_id: routeId,
        request_id: s.request_id ?? null,
        stop_type: s.stop_type ?? "pickup",
        stop_order: s.stop_order,
        planned_arrival_start: s.planned_arrival_start ?? null,
        planned_arrival_end: s.planned_arrival_end ?? null,
        status: s.status ?? "pending",
        notes: s.notes ?? null,
      }))
    )
    .select("*");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function addScrapMedia(input: {
  requestId: string;
  storagePath: string;
  mediaType?: string;
  mediaPurpose?: string;
  uploadedBy?: string;
  itemId?: string | null;
}) {
  const supabase = await scrapDb();
  const { data, error } = await supabase
    .from("scrap_pickup_media")
    .insert({
      request_id: input.requestId,
      item_id: input.itemId ?? null,
      storage_path: input.storagePath,
      media_type: input.mediaType ?? "photo",
      media_purpose: input.mediaPurpose ?? "overview",
      uploaded_by: input.uploadedBy ?? null,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function scrapAnalytics() {
  const supabase = await scrapDb();
  const { data: requests, error } = await supabase
    .from("scrap_pickup_requests")
    .select("status, estimated_weight_lb, route_units, junk_estimate_interest, estimate_id, created_at")
    .eq("company_id", MORRIS_COMPANY_ID);
  if (error) throw new Error(error.message);
  const rows = requests ?? [];
  const count = (status: string) => rows.filter((r) => r.status === status).length;
  const { data: tickets } = await supabase
    .from("scrap_recycling_tickets")
    .select("scrap_revenue, battery_count, battery_revenue, fuel_cost, labor_cost, other_costs, net_weight_lb")
    .eq("company_id", MORRIS_COMPANY_ID);
  const t = tickets ?? [];
  const sum = (key: keyof (typeof t)[0]) =>
    t.reduce((acc, row) => acc + Number(row[key] ?? 0), 0);

  return {
    requestsSubmitted: rows.filter((r) => r.status !== "draft").length,
    approved: count("approved") + count("scheduled") + count("confirmed_by_customer") + count("completed"),
    declined: count("declined"),
    waitlisted: count("waitlisted"),
    completed: count("completed"),
    noShow: count("no_show"),
    junkLeads: rows.filter((r) => r.junk_estimate_interest === "yes" || r.estimate_id).length,
    scrapRevenue: sum("scrap_revenue"),
    batteryCount: sum("battery_count"),
    batteryRevenue: sum("battery_revenue"),
    fuelCost: sum("fuel_cost"),
    laborCost: sum("labor_cost"),
    otherCosts: sum("other_costs"),
    netWeightLb: sum("net_weight_lb"),
    routeProfit:
      sum("scrap_revenue") +
      sum("battery_revenue") -
      sum("fuel_cost") -
      sum("labor_cost") -
      sum("other_costs"),
  };
}
