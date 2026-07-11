import { apiError, apiOk, parseJson } from "@/lib/api/route-utils";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { MORRIS_COMPANY_ID } from "@/lib/morris-config";
import {
  isDivisionSubmissionAllowedAsync,
  divisionBookingClosedMessage,
} from "@/lib/public-site";
import type { DivisionId } from "@/lib/divisions";
import { billingId, createShareToken, estimateNumber, normalizeLineItem } from "@/lib/billing/utils";
import { enqueueNotification } from "@/lib/notifications/enqueue";
import { getAppBaseUrl } from "@/lib/payments/stripe-client";
import { isGooglePlacesConfigured, verifyPlaceId } from "@/lib/geo/verify-place";

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Find existing customer by verified email or phone, else create.
 * Prevents duplicate customers for guest estimate requests.
 */
async function findOrCreateGuestCustomer(input: {
  companyId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}): Promise<{ customerId: string; created: boolean }> {
  const sb = createAdminClient();
  if (!sb) throw new Error("Database unavailable");

  const email = normalizeEmail(input.email);
  const phoneDigits = normalizePhone(input.phone);

  if (email) {
    const { data: byEmail } = await sb
      .from("customers")
      .select("id, email, phone, archived_at, merged_into_customer_id")
      .eq("company_id", input.companyId)
      .ilike("email", email)
      .is("archived_at", null)
      .is("merged_into_customer_id", null)
      .limit(5);
    const match = (byEmail ?? []).find(
      (c) => normalizeEmail(String(c.email ?? "")) === email
    );
    if (match) return { customerId: match.id as string, created: false };
  }

  if (phoneDigits.length >= 10) {
    const { data: byPhone } = await sb
      .from("customers")
      .select("id, phone, archived_at, merged_into_customer_id")
      .eq("company_id", input.companyId)
      .is("archived_at", null)
      .is("merged_into_customer_id", null)
      .limit(50);
    const match = (byPhone ?? []).find((c) => {
      const digits = normalizePhone(String(c.phone ?? ""));
      return digits.length >= 10 && digits.slice(-10) === phoneDigits.slice(-10);
    });
    if (match) return { customerId: match.id as string, created: false };
  }

  const customerId = billingId("cust");
  const { error } = await sb.from("customers").insert({
    id: customerId,
    company_id: input.companyId,
    first_name: input.firstName.trim(),
    last_name: input.lastName.trim(),
    email,
    phone: input.phone.trim(),
    notes: "Created via guest estimate request",
  });
  if (error) throw error;
  return { customerId, created: true };
}

/**
 * Guest estimate request — no account required.
 * Creates/links customer, draft estimate, share token; email when configured.
 */
export async function POST(request: Request) {
  const limited = enforceRateLimit(request, {
    key: "public-guest-request",
    limit: 8,
    windowMs: 60_000,
  });
  if (limited) return limited;

  try {
    const body = await parseJson<{
      divisionId: DivisionId;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      addressLine1?: string;
      city?: string;
      state?: string;
      zip?: string;
      placeId?: string;
      description?: string;
      preferredDate?: string;
      serviceNotes?: string;
      cargoDescription?: string;
    }>(request);

    const divisionId = body.divisionId === "hauling" ? "hauling" : "junk_removal";
    if (!(await isDivisionSubmissionAllowedAsync(divisionId))) {
      return apiError(divisionBookingClosedMessage(divisionId), 403);
    }

    const firstName = body.firstName?.trim();
    const lastName = body.lastName?.trim();
    const email = body.email?.trim();
    const phone = body.phone?.trim();
    if (!firstName || !lastName || !email || !phone) {
      return apiError("Name, email, and phone are required", 400);
    }
    if (!email.includes("@")) return apiError("Valid email required", 400);
    if (normalizePhone(phone).length < 10) return apiError("Valid phone required", 400);

    if (body.placeId) {
      if (!isGooglePlacesConfigured()) {
        return apiError("Address verification is temporarily unavailable. Please call us.", 503);
      }
      try {
        await verifyPlaceId(body.placeId);
      } catch (e) {
        return apiError(e instanceof Error ? e.message : "Could not verify address", 400);
      }
    }

    const companyId = MORRIS_COMPANY_ID;
    const { customerId, created } = await findOrCreateGuestCustomer({
      companyId,
      firstName,
      lastName,
      email,
      phone,
    });

    const sb = createAdminClient();
    if (!sb) return apiError("Database unavailable", 503);

    const estimateId = billingId("est");
    const share = createShareToken();
    const now = new Date().toISOString();
    const description =
      body.description?.trim() ||
      body.cargoDescription?.trim() ||
      body.serviceNotes?.trim() ||
      "Guest estimate request";

    const lineItems = [
      normalizeLineItem({
        label: divisionId === "hauling" ? "Hauling estimate request" : "Junk removal estimate request",
        description,
        unitPrice: 0,
        quantity: 1,
        category: "labor",
      }),
    ];

    const { error: estError } = await sb.from("estimates").insert({
      id: estimateId,
      company_id: companyId,
      customer_id: customerId,
      division_id: divisionId,
      estimate_number: estimateNumber(),
      status: "draft",
      active: true,
      estimated_total: 0,
      line_items: lineItems,
      customer_notes: [
        body.addressLine1 && `Address: ${body.addressLine1}, ${body.city ?? ""} ${body.state ?? ""} ${body.zip ?? ""}`,
        body.preferredDate && `Preferred date: ${body.preferredDate}`,
        description,
      ]
        .filter(Boolean)
        .join("\n"),
      internal_notes: `Guest request (${created ? "new customer" : "matched existing"}). PlaceId: ${body.placeId ?? "n/a"}`,
      share_token_hash: share.hash,
      share_token_expires_at: share.expiresAt,
      created_at: now,
      updated_at: now,
    });
    if (estError) throw estError;

    const customerUrl = `${getAppBaseUrl()}/e/${share.token}`;

    const delivery = await enqueueNotification({
      companyId,
      divisionId,
      customerId,
      eventType: "request_received",
      channel: "email",
      toEmail: normalizeEmail(email),
      payload: { customerUrl, estimateId, guest: true },
    });

    return apiOk({
      estimateId,
      customerId,
      customerCreated: created,
      customerUrl,
      deliveryStatus: delivery.deliveryStatus,
      deliveryMessage: delivery.deliveryMessage,
      message:
        delivery.deliveryStatus === "skipped" || delivery.deliveryStatus === "failed"
          ? "Request received. Copy your secure estimate link — email is not configured or failed."
          : "Request received. Check your email for next steps.",
    });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to submit request", 500);
  }
}
