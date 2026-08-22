import { apiError, apiOk, parseJson } from "@/lib/api/route-utils";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import { MORRIS_COMPANY_ID } from "@/lib/morris-config";
import {
  isDivisionSubmissionAllowedAsync,
  divisionBookingClosedMessage,
} from "@/lib/public-site";
import { isEquipmentDivision, parseDivisionId, type DivisionId } from "@/lib/divisions";
import { billingId, createShareToken, estimateNumber, normalizeLineItem } from "@/lib/billing/utils";
import { enqueueNotification } from "@/lib/notifications/enqueue";
import { getAppBaseUrl } from "@/lib/payments/stripe-client";
import { insertEquipmentIntake } from "@/lib/db/equipment";
import { inferCapabilityFromServiceSlug } from "@/lib/equipment/catalog";
import { getDivision } from "@/lib/divisions";

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

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
      .select("id, email, archived_at, merged_into_customer_id")
      .eq("company_id", input.companyId)
      .ilike("email", email)
      .is("archived_at", null)
      .is("merged_into_customer_id", null)
      .limit(5);
    const match = (byEmail ?? []).find((c) => normalizeEmail(String(c.email ?? "")) === email);
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
    notes: "Created via equipment / land-clearing estimate request",
  });
  if (error) throw error;
  return { customerId, created: true };
}

/**
 * Land clearing / site work / equipment-services intake.
 * Does not produce instant guaranteed pricing.
 */
export async function POST(request: Request) {
  const limited = enforceRateLimit(request, {
    key: "public-equipment-request",
    limit: 8,
    windowMs: 60_000,
  });
  if (limited) return limited;

  try {
    const body = await parseJson<{
      divisionId: DivisionId;
      serviceSlug?: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      intake: Record<string, unknown>;
    }>(request);

    const divisionId = parseDivisionId(body.divisionId);
    if (!isEquipmentDivision(divisionId)) {
      return apiError("Use the junk removal or hauling booking form for that division.", 400);
    }
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
    const config = getDivision(divisionId);
    const inferred = inferCapabilityFromServiceSlug(body.serviceSlug);
    const intake = body.intake ?? {};
    const addressBits = [intake.address, intake.city, intake.zip].filter(Boolean).join(", ");

    const lineItems = [
      normalizeLineItem({
        label: `${config.shortName} estimate request`,
        description: body.serviceSlug
          ? `${body.serviceSlug.replace(/-/g, " ")} — upcoming project estimate`
          : "Upcoming project estimate — no instant price",
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
        addressBits && `Property: ${addressBits}`,
        intake.acreage && `Acreage: ${intake.acreage}`,
        intake.goal && `Goal: ${intake.goal}`,
        "No instant guaranteed pricing. Review required.",
      ]
        .filter(Boolean)
        .join("\n"),
      internal_notes: `Equipment intake (${created ? "new customer" : "matched"}). Service: ${body.serviceSlug ?? "n/a"}. Capability: ${inferred.capabilityId ?? "n/a"}`,
      share_token_hash: share.hash,
      share_token_expires_at: share.expiresAt,
      created_at: now,
      updated_at: now,
    });
    if (estError) throw estError;

    const acres = Number(intake.acreage);
    await insertEquipmentIntake({
      id: billingId("eqi"),
      companyId,
      estimateId,
      divisionId,
      serviceSlug: body.serviceSlug ?? null,
      kind: divisionId as "land_clearing" | "site_work" | "equipment_services",
      intake,
      equipmentTypeId: inferred.equipmentTypeId ?? null,
      attachmentTypeId: inferred.attachmentId ?? null,
      estimatedAcres: Number.isFinite(acres) ? acres : null,
      vegetationDensity: typeof intake.density === "string" ? intake.density : null,
      treeDiameterRange: typeof intake.diameterRange === "string" ? intake.diameterRange : null,
      terrainType: typeof intake.terrain === "string" ? intake.terrain : null,
    });

    const customerUrl = `${getAppBaseUrl()}/e/${share.token}`;
    const delivery = await enqueueNotification({
      companyId,
      divisionId,
      customerId,
      eventType: "request_received",
      channel: "email",
      toEmail: normalizeEmail(email),
      payload: { customerUrl, estimateId, guest: true, divisionId },
    });

    return apiOk({
      estimateId,
      customerId,
      customerUrl,
      deliveryStatus: delivery.deliveryStatus,
      deliveryMessage: delivery.deliveryMessage,
      message:
        delivery.deliveryStatus === "skipped" || delivery.deliveryStatus === "failed"
          ? "Request received. Copy your secure estimate link — email is not configured or failed."
          : "Request received. We will review your upcoming project estimate. Check your email for next steps.",
    });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to submit request", 500);
  }
}
