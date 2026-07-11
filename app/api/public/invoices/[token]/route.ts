import { apiOk, apiError, parseJson } from "@/lib/api/route-utils";
import {
  getInvoiceByShareToken,
  getInvoiceShareAccess,
  logBillingAudit,
} from "@/lib/db/billing-operations";
import { getAdminInvoiceDetail, isDbReady } from "@/lib/db/operations";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, enforceRateLimit, getClientIp, rateLimitResponse } from "@/lib/api/rate-limit";
import { createPublicInvoiceCheckout } from "@/lib/payments/stripe-service";
import { isOnlineCardPaymentEnabled } from "@/lib/payments/stripe-config";

type Ctx = { params: Promise<{ token: string }> };

function shareError(reason: string) {
  if (reason === "expired") {
    return apiError("This invoice link has expired. Please contact Morris Services for a new link.", 410);
  }
  if (reason === "revoked") {
    return apiError("This invoice link is no longer active. Please contact Morris Services.", 410);
  }
  return apiError("Invoice not found or link expired", 404);
}

export async function GET(request: Request, ctx: Ctx) {
  const { token } = await ctx.params;
  const limited = enforceRateLimit(request, {
    key: "public-invoice-get",
    limit: 60,
    windowMs: 60_000,
  });
  if (limited) return limited;

  const tokenLimit = checkRateLimit(request, {
    key: `public-invoice-token:${token.slice(0, 16)}`,
    limit: 30,
    windowMs: 60_000,
  });
  if (!tokenLimit.allowed) return rateLimitResponse(tokenLimit.retryAfterSec);

  try {
    const access = await getInvoiceShareAccess(token);
    if (!access.ok) {
      console.warn("[public-invoice] denied", { reason: access.reason, ip: getClientIp(request) });
      return shareError(access.reason);
    }
    const invoice = await getInvoiceByShareToken(token);
    if (!invoice) return shareError("not_found");

    if (["sent", "ready_to_send"].includes(invoice.status) && (await isDbReady())) {
      const sb = createAdminClient();
      if (sb) {
        const now = new Date().toISOString();
        await sb
          .from("invoices")
          .update({ status: "viewed", viewed_at: now })
          .eq("id", invoice.id);
        await logBillingAudit({
          companyId: invoice.companyId,
          entityType: "invoice",
          entityId: invoice.id,
          action: "invoice_viewed",
        });
      }
    }

    const detail = await getAdminInvoiceDetail(invoice.companyId, invoice.id);
    if (!detail) return apiError("Invoice not found", 404);

    return apiOk({
      invoice: detail.invoice,
      job: detail.job
        ? {
            id: detail.job.id,
            address: detail.job.address,
            serviceType: detail.job.serviceType,
            status: detail.job.status,
          }
        : null,
      customer: detail.customer
        ? { name: detail.customer.name, email: detail.customer.email }
        : null,
      payments: detail.payments.map((p) => ({
        id: p.id,
        amount: p.amount,
        method: p.method,
        status: p.status,
        createdAt: p.createdAt,
        receiptNumber: p.receiptNumber,
      })),
      onlinePaymentsEnabled: isOnlineCardPaymentEnabled(),
    });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load invoice", 500);
  }
}

/** Start Stripe Checkout for a public invoice link. Amount validated server-side. */
export async function POST(request: Request, ctx: Ctx) {
  const { token } = await ctx.params;
  const limited = enforceRateLimit(request, {
    key: "public-invoice-pay",
    limit: 10,
    windowMs: 60_000,
  });
  if (limited) return limited;

  const tokenLimit = checkRateLimit(request, {
    key: `public-invoice-pay-token:${token.slice(0, 16)}`,
    limit: 8,
    windowMs: 60_000,
  });
  if (!tokenLimit.allowed) return rateLimitResponse(tokenLimit.retryAfterSec);

  try {
    if (!isOnlineCardPaymentEnabled()) {
      return apiError("Online card payments are not enabled yet.", 400);
    }

    const access = await getInvoiceShareAccess(token);
    if (!access.ok) return shareError(access.reason);

    const invoice = await getInvoiceByShareToken(token);
    if (!invoice) return shareError("not_found");

    const body = await parseJson<{ amount?: number }>(request);
    const balance = invoice.balanceDue;
    const amount = body.amount != null ? Number(body.amount) : balance;
    if (amount <= 0) return apiError("Amount must be positive", 400);
    if (amount > balance + 0.01) return apiError("Amount exceeds invoice balance", 400);

    const session = await createPublicInvoiceCheckout({
      companyId: invoice.companyId,
      customerId: invoice.customerId,
      invoiceId: invoice.id,
      amount,
      shareToken: token,
    });

    return apiOk({ url: session.url, sessionId: session.sessionId });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to start payment", 500);
  }
}
