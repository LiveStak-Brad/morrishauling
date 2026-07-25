import { apiError, apiOk, parseJson } from "@/lib/api/route-utils";
import { requireApiProfile } from "@/lib/api/require-profile";
import { isAdmin, isPlanner } from "@/lib/auth/permissions";
import {
  getScrapRequest,
  listScrapRequests,
  updateScrapRequest,
} from "@/lib/db/scrap-fridays";
import { enqueueNotification } from "@/lib/notifications/enqueue";
import { MORRIS_COMPANY_ID } from "@/lib/morris-config";
import type { ScrapRequestStatus } from "@/lib/scrap-fridays/types";

export async function GET(request: Request) {
  try {
    const profile = await requireApiProfile();
    if (profile instanceof Response) return profile;
    if (!isAdmin(profile) && !isPlanner(profile) && profile.role !== "employee") {
      return apiError("Forbidden", 403);
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (id) {
      const row = await getScrapRequest(id);
      if (!row) return apiError("Not found", 404);
      return apiOk({ request: row });
    }
    const status = searchParams.get("status") as ScrapRequestStatus | null;
    const fridayId = searchParams.get("fridayId") || undefined;
    const requests = await listScrapRequests({
      status: status || undefined,
      fridayId,
    });
    return apiOk({ requests });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load");
  }
}

export async function PATCH(request: Request) {
  try {
    const profile = await requireApiProfile();
    if (profile instanceof Response) return profile;
    if (!isAdmin(profile) && !isPlanner(profile)) return apiError("Forbidden", 403);

    const body = await parseJson<{
      id: string;
      status?: ScrapRequestStatus;
      internalNotes?: string;
      scrapFridayDateId?: string | null;
      estimatedWeightLb?: number;
      estimatedStopMinutes?: number;
      suggestedCrewCount?: number;
      suggestedEquipment?: string[];
      routeUnits?: number;
      overrideNote?: string;
    }>(request);

    if (!body.id) return apiError("id required", 400);
    const existing = await getScrapRequest(body.id);
    if (!existing) return apiError("Not found", 404);

    const patch: Record<string, unknown> = {};
    if (body.status) {
      patch.status = body.status;
      if (body.status === "approved") patch.approved_at = new Date().toISOString();
      if (body.status === "completed") patch.completed_at = new Date().toISOString();
    }
    if (body.internalNotes !== undefined) {
      patch.internal_notes = body.overrideNote
        ? `${body.internalNotes || ""}\n[Override] ${body.overrideNote}`.trim()
        : body.internalNotes;
    } else if (body.overrideNote) {
      patch.internal_notes = `${existing.internal_notes || ""}\n[Override] ${body.overrideNote}`.trim();
    }
    if (body.scrapFridayDateId !== undefined) {
      patch.scrap_friday_date_id = body.scrapFridayDateId;
    }
    if (body.estimatedWeightLb != null) patch.estimated_weight_lb = body.estimatedWeightLb;
    if (body.estimatedStopMinutes != null) {
      patch.estimated_stop_minutes = body.estimatedStopMinutes;
    }
    if (body.suggestedCrewCount != null) {
      patch.suggested_crew_count = body.suggestedCrewCount;
    }
    if (body.suggestedEquipment) patch.suggested_equipment = body.suggestedEquipment;
    if (body.routeUnits != null) patch.route_units = body.routeUnits;

    const updated = await updateScrapRequest(body.id, patch);

    if (
      body.status &&
      ["approved", "more_info_needed", "declined", "scheduled", "waitlisted"].includes(
        body.status
      ) &&
      existing.email
    ) {
      await enqueueNotification({
        companyId: MORRIS_COMPANY_ID,
        divisionId: "junk_removal",
        customerId: existing.customer_id ?? undefined,
        eventType: "request_received",
        channel: "email",
        toEmail: existing.email as string,
        payload: {
          kind: "free_scrap_friday_status",
          requestId: body.id,
          status: body.status,
        },
      });
    }

    return apiOk({ request: updated });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Update failed");
  }
}
