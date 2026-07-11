import { apiOk, apiError, parseJson } from "@/lib/api/route-utils";
import {
  getEstimateByShareToken,
  getEstimateShareAccess,
  listAdjustmentsForEstimate,
  listEstimateVersions,
  logBillingAudit,
  recordEstimateDecision,
} from "@/lib/db/billing-operations";
import { getCustomers, getJobById, isDbReady } from "@/lib/db/operations";
import { createAdminClient } from "@/lib/supabase/admin";
import { customerFacingLines } from "@/lib/billing/utils";
import { checkRateLimit, enforceRateLimit, getClientIp, rateLimitResponse } from "@/lib/api/rate-limit";

type Ctx = { params: Promise<{ token: string }> };

function shareError(reason: string) {
  if (reason === "expired") {
    return apiError("This estimate link has expired. Please contact Morris Services for a new link.", 410);
  }
  if (reason === "revoked") {
    return apiError("This estimate link is no longer active. Please contact Morris Services.", 410);
  }
  return apiError("Estimate not found or link expired", 404);
}

export async function GET(request: Request, ctx: Ctx) {
  const { token } = await ctx.params;
  const limited = enforceRateLimit(request, {
    key: "public-estimate-get",
    limit: 60,
    windowMs: 60_000,
  });
  if (limited) return limited;

  const tokenLimit = checkRateLimit(request, {
    key: `public-estimate-token:${token.slice(0, 16)}`,
    limit: 30,
    windowMs: 60_000,
  });
  if (!tokenLimit.allowed) return rateLimitResponse(tokenLimit.retryAfterSec);

  try {
    const access = await getEstimateShareAccess(token);
    if (!access.ok) {
      console.warn("[public-estimate] denied", { reason: access.reason, ip: getClientIp(request) });
      return shareError(access.reason);
    }
    const estimate = await getEstimateByShareToken(token);
    if (!estimate) return shareError("not_found");

    if (["sent", "ready_to_send", "revised"].includes(estimate.status) && (await isDbReady())) {
      const sb = createAdminClient();
      if (sb) {
        const now = new Date().toISOString();
        await sb
          .from("estimates")
          .update({ status: "viewed", viewed_at: estimate.viewedAt ?? now, updated_at: now })
          .eq("id", estimate.id);
        await logBillingAudit({
          companyId: estimate.companyId,
          entityType: "estimate",
          entityId: estimate.id,
          action: "estimate_viewed",
          newValue: { via: "customer_link" },
        });
        estimate.status = "viewed";
        estimate.viewedAt = estimate.viewedAt ?? now;
      }
    }

    const [versions, adjustments, customers] = await Promise.all([
      listEstimateVersions(estimate.companyId, estimate.id),
      listAdjustmentsForEstimate(estimate.companyId, estimate.id),
      getCustomers(estimate.companyId),
    ]);
    const customer = customers.find((c) => c.id === estimate.customerId);
    const job = estimate.jobId ? await getJobById(estimate.companyId, estimate.jobId) : undefined;

    return apiOk({
      estimate: {
        ...estimate,
        lineItems: customerFacingLines(estimate.lineItems),
        internalCostBreakdown: undefined,
        estimatedProfit: undefined,
        estimatedMargin: undefined,
        internalNotes: undefined,
      },
      versions: versions.map((v) => ({
        versionNumber: v.versionNumber,
        createdAt: v.createdAt,
        previousTotal: v.previousTotal,
        newTotal: v.newTotal,
        revisionReason: v.revisionReason,
      })),
      adjustments: adjustments.filter((a) => a.status === "approved" || a.status === "pending_approval"),
      customer: customer
        ? { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone }
        : null,
      job: job
        ? { id: job.id, status: job.status, address: job.address, serviceType: job.serviceType }
        : null,
    });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load estimate", 500);
  }
}

export async function POST(request: Request, ctx: Ctx) {
  const { token } = await ctx.params;
  const limited = enforceRateLimit(request, {
    key: "public-estimate-post",
    limit: 15,
    windowMs: 60_000,
  });
  if (limited) return limited;

  const tokenLimit = checkRateLimit(request, {
    key: `public-estimate-act:${token.slice(0, 16)}`,
    limit: 10,
    windowMs: 60_000,
  });
  if (!tokenLimit.allowed) return rateLimitResponse(tokenLimit.retryAfterSec);

  try {
    const access = await getEstimateShareAccess(token);
    if (!access.ok) {
      console.warn("[public-estimate] action denied", { reason: access.reason, ip: getClientIp(request) });
      return shareError(access.reason);
    }
    const estimate = await getEstimateByShareToken(token);
    if (!estimate) return shareError("not_found");

    const body = await parseJson<{
      action: "accept" | "decline" | "clarification";
      name?: string;
      note?: string;
    }>(request);

    if (!["accept", "decline", "clarification"].includes(body.action)) {
      return apiError("Invalid action", 400);
    }

    const updated = await recordEstimateDecision(
      estimate.companyId,
      estimate.id,
      {
        decision:
          body.action === "accept"
            ? "accepted"
            : body.action === "decline"
              ? "declined"
              : "clarification",
        method: "customer_portal",
        acceptedBy: body.name?.trim() || "Customer",
        note: body.note,
      },
      {
        ipAddress: request.headers.get("x-forwarded-for") ?? undefined,
        userAgent: request.headers.get("user-agent") ?? undefined,
      }
    );

    return apiOk({
      estimate: {
        id: updated.id,
        status: updated.status,
        acceptedAt: updated.acceptedAt,
        declinedAt: updated.declinedAt,
        estimatedTotal: updated.estimatedTotal,
      },
    });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Action failed", 500);
  }
}
