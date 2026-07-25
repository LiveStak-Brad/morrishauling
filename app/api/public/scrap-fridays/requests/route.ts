import { apiError, apiOk, parseJson } from "@/lib/api/route-utils";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { MORRIS_COMPANY_ID } from "@/lib/morris-config";
import { findOrCreateGuestCustomer } from "@/lib/customers/guest";
import {
  applyEstimateToRequest,
  createScrapRequestDraft,
  getScrapRequest,
  listActiveScrapItemTypes,
  replaceScrapRequestItems,
  updateScrapRequest,
} from "@/lib/db/scrap-fridays";
import { estimateScrapRequest, validateWizardItems } from "@/lib/scrap-fridays/calc";
import type { ScrapWizardItem } from "@/lib/scrap-fridays/types";
import { enqueueNotification } from "@/lib/notifications/enqueue";
import { createEstimate } from "@/lib/db/billing-operations";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  try {
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return apiError("id required", 400);
    const row = await getScrapRequest(id);
    if (!row) return apiError("Not found", 404);
    return apiOk({ request: row });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load request");
  }
}

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, {
    key: "scrap-request",
    limit: 12,
    windowMs: 60_000,
  });
  if (limited) return limited;

  try {
    const body = await parseJson<{
      action?: "draft" | "submit" | "save";
      requestId?: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      email?: string;
      addressLine1?: string;
      addressLine2?: string;
      city?: string;
      state?: string;
      zip?: string;
      placeId?: string;
      latitude?: number;
      longitude?: number;
      serviceAreaOutcome?: string;
      serviceAreaMessage?: string;
      scrapFridayDateId?: string | null;
      items?: ScrapWizardItem[];
      access?: Record<string, unknown>;
      availability?: Record<string, unknown>;
      customerNotes?: string;
      junkEstimateInterest?: "yes" | "no" | "ask_on_arrival";
      junkEstimateNotes?: string;
      detachedConfirmed?: boolean;
      authorityConfirmed?: boolean;
      photosConfirmed?: boolean;
      draftPayload?: Record<string, unknown>;
      mediaCount?: number;
    }>(request);

    const action = body.action ?? "draft";
    const catalog = await listActiveScrapItemTypes();
    const catalogById = new Map(catalog.map((c) => [c.id, c]));

    let requestId = body.requestId;
    if (!requestId) {
      const draft = await createScrapRequestDraft({
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone,
        email: body.email,
        addressLine1: body.addressLine1,
        city: body.city,
        state: body.state,
        zip: body.zip,
        placeId: body.placeId,
        latitude: body.latitude,
        longitude: body.longitude,
        serviceAreaOutcome: body.serviceAreaOutcome,
        serviceAreaMessage: body.serviceAreaMessage,
        draftPayload: body.draftPayload,
      });
      requestId = draft.id as string;
    }

    const items = body.items ?? [];
    if (items.length > 0) {
      const summary = estimateScrapRequest(items, catalogById);
      await replaceScrapRequestItems(
        requestId,
        items.map((item) => {
          const cat = catalogById.get(item.itemTypeId);
          return {
            item_type_id: item.itemTypeId,
            item_name_snapshot: cat?.name ?? item.itemTypeId,
            category: cat?.category ?? "household",
            quantity: item.quantity,
            customer_estimated_weight_lb: item.customerWeightLb ?? null,
            system_estimated_weight_lb:
              (cat?.default_weight_lb ?? 50) * item.quantity,
            weight_band: item.weightBand,
            size_class: item.sizeClass ?? null,
            location_on_property: item.locationOnProperty ?? null,
            detached_confirmed: Boolean(body.detachedConfirmed),
            empty_confirmed: item.answers.empty === true,
            answers: item.answers ?? {},
            unusually_heavy: Boolean(item.unusuallyHeavy),
            manual_review_required:
              Boolean(cat?.eligibility_rules?.manualReview) ||
              Boolean(item.unusuallyHeavy) ||
              item.answers.bolted === true,
            notes: item.notes ?? null,
          };
        })
      );
      await applyEstimateToRequest(requestId, summary, {
        access: body.access ?? {},
        availability: body.availability ?? {},
        customer_notes: body.customerNotes ?? null,
        junk_estimate_interest: body.junkEstimateInterest ?? null,
        junk_estimate_notes: body.junkEstimateNotes ?? null,
        detached_confirmed: Boolean(body.detachedConfirmed),
        authority_confirmed: Boolean(body.authorityConfirmed),
        photos_confirmed: Boolean(body.photosConfirmed),
        scrap_friday_date_id: body.scrapFridayDateId ?? null,
        address_line1: body.addressLine1 ?? undefined,
        address_line2: body.addressLine2 ?? undefined,
        city: body.city ?? undefined,
        state: body.state ?? undefined,
        zip: body.zip ?? undefined,
        place_id: body.placeId ?? undefined,
        latitude: body.latitude ?? undefined,
        longitude: body.longitude ?? undefined,
        service_area_outcome: body.serviceAreaOutcome ?? undefined,
        service_area_message: body.serviceAreaMessage ?? undefined,
        first_name: body.firstName ?? undefined,
        last_name: body.lastName ?? undefined,
        phone: body.phone ?? undefined,
        email: body.email ?? undefined,
        draft_payload: body.draftPayload ?? {},
      });
    } else if (action !== "submit") {
      await updateScrapRequest(requestId, {
        access: body.access ?? {},
        availability: body.availability ?? {},
        customer_notes: body.customerNotes ?? null,
        junk_estimate_interest: body.junkEstimateInterest ?? null,
        junk_estimate_notes: body.junkEstimateNotes ?? null,
        draft_payload: body.draftPayload ?? {},
        address_line1: body.addressLine1 ?? undefined,
        city: body.city ?? undefined,
        zip: body.zip ?? undefined,
        place_id: body.placeId ?? undefined,
        first_name: body.firstName ?? undefined,
        last_name: body.lastName ?? undefined,
        phone: body.phone ?? undefined,
        email: body.email ?? undefined,
      });
    }

    if (action === "submit") {
      const itemErrors = validateWizardItems(items, catalogById);
      if (itemErrors.length) return apiError(itemErrors[0], 400);
      if (!body.detachedConfirmed) {
        return apiError("Confirm items are detached and ready for removal.", 400);
      }
      if (!body.authorityConfirmed) {
        return apiError("Confirm you have authority to dispose of these items.", 400);
      }
      if (!body.firstName?.trim() || !body.lastName?.trim() || !body.phone?.trim() || !body.email?.trim()) {
        return apiError("Name, phone, and email are required.", 400);
      }
      if (!body.addressLine1?.trim() || !body.city?.trim() || !body.zip?.trim()) {
        return apiError("A complete pickup address is required.", 400);
      }
      if ((body.mediaCount ?? 0) < 1 && !body.photosConfirmed) {
        return apiError("At least one photo is required before submission.", 400);
      }

      const { customerId } = await findOrCreateGuestCustomer({
        companyId: MORRIS_COMPANY_ID,
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
        notes: "Created via Free Scrap Fridays request",
      });

      let estimateId: string | null = null;
      if (body.junkEstimateInterest === "yes") {
        const estimate = await createEstimate(MORRIS_COMPANY_ID, {
          customerId,
          divisionId: "junk_removal",
          lineItems: [
            {
              label: `Junk removal estimate interest from Free Scrap Fridays — ${body.junkEstimateNotes || "see notes"}`,
              quantity: 1,
              unitPrice: 0,
            },
          ],
          customerNotes: body.junkEstimateNotes ?? "Lead from Free Scrap Fridays",
          internalNotes: "Created from Free Scrap Fridays wizard",
        });
        estimateId = estimate.id;
      }

      const summary = estimateScrapRequest(items, catalogById);
      const needsReview =
        summary.manualReviewFlags.length > 0 ||
        body.serviceAreaOutcome === "manual_review" ||
        body.serviceAreaOutcome === "extended";

      await updateScrapRequest(requestId, {
        customer_id: customerId,
        status: needsReview ? "under_review" : "submitted",
        submitted_at: new Date().toISOString(),
        estimate_id: estimateId,
        photos_confirmed: true,
      });

      // Address on customer record when empty
      const sb = createAdminClient();
      if (sb) {
        await sb
          .from("customers")
          .update({
            address_line1: body.addressLine1,
            city: body.city,
            state: body.state ?? "MO",
            zip: body.zip,
          })
          .eq("id", customerId)
          .is("address_line1", null);
      }

      await enqueueNotification({
        companyId: MORRIS_COMPANY_ID,
        divisionId: "junk_removal",
        customerId,
        eventType: "request_received",
        channel: "email",
        toEmail: body.email,
        payload: {
          kind: "free_scrap_friday",
          requestId,
          message: "Your Free Scrap Friday pickup request was received.",
        },
      });

      const saved = await getScrapRequest(requestId);
      return apiOk({
        request: saved,
        summary,
        message: "Request submitted. We’ll review photos and confirm availability.",
      });
    }

    const saved = await getScrapRequest(requestId);
    const summary =
      items.length > 0 ? estimateScrapRequest(items, catalogById) : null;
    return apiOk({ request: saved, summary });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Request failed");
  }
}
