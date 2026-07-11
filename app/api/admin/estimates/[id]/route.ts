import { morrisConfig } from "@/lib/morris-config";
import { requireApiProfile } from "@/lib/api/require-profile";
import { apiOk, apiError, parseJson } from "@/lib/api/route-utils";
import {
  convertEstimateToJob,
  createInvoiceFromEstimate,
  createOnSiteAdjustment,
  deleteEstimate,
  duplicateEstimate,
  getBillingAudit,
  getEstimateById,
  listAdjustmentsForEstimate,
  listEstimateVersions,
  recordEstimateDecision,
  recordInternalApproval,
  sendEstimate,
  updateEstimate,
} from "@/lib/db/billing-operations";
import { getJobById, getInvoices, isDbReady } from "@/lib/db/operations";
import { createAdminClient } from "@/lib/supabase/admin";
import { rowToCustomerUser } from "@/lib/db/mappers";
import { normalizeLineItem } from "@/lib/billing/utils";
import { lineItemsNeedHydration } from "@/lib/billing/standard-charges";
import type { BillingLineItem } from "@/types/billing";

type Ctx = { params: Promise<{ id: string }> };

async function getCustomerRaw(companyId: string, customerId: string | null | undefined) {
  if (!customerId || !(await isDbReady())) return null;
  const sb = createAdminClient();
  if (!sb) return null;
  const { data } = await sb
    .from("customers")
    .select("*")
    .eq("company_id", companyId)
    .eq("id", customerId)
    .maybeSingle();
  return data ? rowToCustomerUser(data as Record<string, unknown>) : null;
}

function hydrateLinesFromJob(job: Awaited<ReturnType<typeof getJobById>>): BillingLineItem[] {
  if (!job) return [];
  const fromBreakdown = job.pricingBreakdown?.length
    ? job.pricingBreakdown
    : job.junkRemovalDetails?.customerPricingBreakdown?.length
      ? job.junkRemovalDetails.customerPricingBreakdown
      : job.haulingDetails?.customerPricingBreakdown?.length
        ? job.haulingDetails.customerPricingBreakdown
        : [];

  return fromBreakdown
    .filter((l) => !(l as { internal?: boolean }).internal)
    .map((l, i) =>
      normalizeLineItem(
        {
          id: l.id,
          label: l.label,
          unitPrice: l.amount,
          quantity: 1,
          amount: l.amount,
          category: "service",
        },
        i
      )
    );
}

export async function GET(_request: Request, ctx: Ctx) {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  if (!["admin", "planner"].includes(profile.role)) {
    return apiError("Admin access required", 403);
  }
  const { id } = await ctx.params;
  try {
    let estimate = await getEstimateById(morrisConfig.companyId, id);
    if (!estimate) return apiError("Estimate not found", 404);

    const job = estimate.jobId
      ? await getJobById(morrisConfig.companyId, estimate.jobId)
      : undefined;

    // Prefer estimate.customerId, then job.customerId
    const customerId = estimate.customerId ?? job?.customerId ?? null;
    const customer = await getCustomerRaw(morrisConfig.companyId, customerId);

    if (lineItemsNeedHydration(estimate.lineItems, estimate.estimatedTotal)) {
      const hydrated = hydrateLinesFromJob(job);
      if (hydrated.length > 0) {
        estimate = {
          ...estimate,
          customerId,
          lineItems: hydrated,
          subtotal: hydrated.reduce((s, l) => s + l.amount, 0),
          serviceAddress:
            Object.keys(estimate.serviceAddress ?? {}).length > 0
              ? estimate.serviceAddress
              : {
                  street: job?.address.street,
                  city: job?.address.city,
                  state: job?.address.state,
                  zip: job?.address.zip,
                },
        };
      } else if (estimate.estimatedTotal > 0 && estimate.lineItems.length === 0) {
        // Single rollup line so the owner still sees the charged total
        estimate = {
          ...estimate,
          customerId,
          lineItems: [
            normalizeLineItem({
              id: "rollup",
              label: "Estimated service total",
              unitPrice: estimate.estimatedTotal,
              quantity: 1,
              amount: estimate.estimatedTotal,
              category: "service",
            }),
          ],
        };
      }
    } else if (customerId && !estimate.customerId) {
      estimate = { ...estimate, customerId };
    }

    // Fill address from job when missing
    if (
      job &&
      (!estimate.serviceAddress ||
        !(estimate.serviceAddress as { street?: string }).street)
    ) {
      estimate = {
        ...estimate,
        serviceAddress: {
          street: job.address.street,
          city: job.address.city,
          state: job.address.state,
          zip: job.address.zip,
        },
      };
    }

    const [versions, adjustments, activity, invoices] = await Promise.all([
      listEstimateVersions(morrisConfig.companyId, id),
      listAdjustmentsForEstimate(morrisConfig.companyId, id),
      getBillingAudit(morrisConfig.companyId, "estimate", id),
      getInvoices(morrisConfig.companyId).catch(() => []),
    ]);

    const invoice =
      (estimate.jobId
        ? invoices.find((i) => i.jobId === estimate.jobId && i.status !== "void")
        : undefined) ?? null;

    return apiOk({
      estimate,
      versions,
      adjustments,
      activity,
      customer,
      job,
      invoice,
      standardCharges: (await import("@/lib/billing/standard-charges")).getStandardChargePresets(),
    });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load estimate", 500);
  }
}

export async function PATCH(request: Request, ctx: Ctx) {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  if (!["admin", "planner"].includes(profile.role)) {
    return apiError("Admin access required", 403);
  }
  const { id } = await ctx.params;
  try {
    const body = await parseJson<{
      lineItems?: BillingLineItem[];
      discountAmount?: number;
      taxAmount?: number;
      customerNotes?: string | null;
      internalNotes?: string | null;
      expiresAt?: string | null;
      scheduledServiceDate?: string | null;
      serviceAddress?: Record<string, unknown>;
      status?: Parameters<typeof updateEstimate>[2]["status"];
      revisionReason?: string;
      forceRevision?: boolean;
    }>(request);

    const estimate = await updateEstimate(morrisConfig.companyId, id, body, {
      actorProfileId: profile.id,
      actorRole: profile.role,
      forceRevision: body.forceRevision,
    });
    return apiOk({ estimate });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to update estimate", 500);
  }
}

export async function POST(request: Request, ctx: Ctx) {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  if (!["admin", "planner"].includes(profile.role)) {
    return apiError("Admin access required", 403);
  }
  const { id } = await ctx.params;
  try {
    const body = await parseJson<{
      action:
        | "send"
        | "resend"
        | "duplicate"
        | "accept"
        | "decline"
        | "clarification"
        | "convert"
        | "create_invoice"
        | "create_adjustment"
        | "internal_approve"
        | "delete";
      method?: string;
      acceptedBy?: string;
      approvedBy?: string;
      note?: string;
      reason?: string;
      scheduledDate?: string;
      ownerOverride?: boolean;
      addedLineItems?: Array<{ label: string; unitPrice: number; quantity?: number }>;
      removedLineItemIds?: string[];
    }>(request);

    const opts = { actorProfileId: profile.id, actorRole: profile.role };

    switch (body.action) {
      case "send":
      case "resend": {
        const result = await sendEstimate(morrisConfig.companyId, id, {
          ...opts,
          resend: body.action === "resend",
        });
        return apiOk(result);
      }
      case "duplicate": {
        const estimate = await duplicateEstimate(morrisConfig.companyId, id, opts);
        return apiOk({ estimate });
      }
      case "internal_approve": {
        if (!body.approvedBy && !body.acceptedBy) {
          return apiError("approvedBy is required", 400);
        }
        const result = await recordInternalApproval(
          morrisConfig.companyId,
          id,
          {
            approvedBy: body.approvedBy || body.acceptedBy || profile.email || profile.id,
            note: body.note,
          },
          opts
        );
        return apiOk(result);
      }
      case "delete": {
        await deleteEstimate(
          morrisConfig.companyId,
          id,
          { reason: body.reason, isOwner: profile.role === "admin" },
          opts
        );
        return apiOk({ deleted: true });
      }
      case "accept":
      case "decline":
      case "clarification": {
        if (!body.method || !body.acceptedBy) {
          return apiError("method and acceptedBy are required", 400);
        }
        const estimate = await recordEstimateDecision(
          morrisConfig.companyId,
          id,
          {
            decision: body.action === "accept" ? "accepted" : body.action === "decline" ? "declined" : "clarification",
            method: body.method,
            acceptedBy: body.acceptedBy,
            note: body.note,
          },
          opts
        );
        return apiOk({ estimate });
      }
      case "convert": {
        const result = await convertEstimateToJob(
          morrisConfig.companyId,
          id,
          {
            scheduledDate: body.scheduledDate,
            notes: body.note,
            ownerOverride: body.ownerOverride && profile.role === "admin",
          },
          opts
        );
        return apiOk(result);
      }
      case "create_invoice": {
        const invoice = await createInvoiceFromEstimate(morrisConfig.companyId, id, {
          ...opts,
          dueDate: body.scheduledDate,
        });
        return apiOk({ invoice });
      }
      case "create_adjustment": {
        if (!body.reason || !body.addedLineItems?.length) {
          return apiError("reason and addedLineItems are required", 400);
        }
        const adjustment = await createOnSiteAdjustment(
          morrisConfig.companyId,
          id,
          {
            reason: body.reason,
            addedLineItems: body.addedLineItems,
            removedLineItemIds: body.removedLineItemIds,
          },
          opts
        );
        return apiOk({ adjustment });
      }
      default:
        return apiError("Unknown action", 400);
    }
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Action failed", 500);
  }
}
