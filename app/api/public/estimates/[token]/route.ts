import { apiOk, apiError, parseJson } from "@/lib/api/route-utils";
import {
  getEstimateByShareToken,
  listAdjustmentsForEstimate,
  listEstimateVersions,
  logBillingAudit,
  recordEstimateDecision,
} from "@/lib/db/billing-operations";
import { getCustomers, getJobById, isDbReady } from "@/lib/db/operations";
import { createAdminClient } from "@/lib/supabase/admin";
import { customerFacingLines } from "@/lib/billing/utils";

type Ctx = { params: Promise<{ token: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const { token } = await ctx.params;
  try {
    const estimate = await getEstimateByShareToken(token);
    if (!estimate) return apiError("Estimate not found or link expired", 404);

    // Mark viewed honestly when customer opens the link
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
  try {
    const estimate = await getEstimateByShareToken(token);
    if (!estimate) return apiError("Estimate not found or link expired", 404);

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
