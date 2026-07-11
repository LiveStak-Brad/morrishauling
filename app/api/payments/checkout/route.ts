import { apiError, apiOk, parseJson } from "@/lib/api/route-utils";
import { requireApiProfile } from "@/lib/api/require-profile";
import { createInvoiceCheckoutSession } from "@/lib/payments/stripe-service";
import { isOnlineCardPaymentEnabled } from "@/lib/payments/stripe-config";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PaymentTiming } from "@/types/payment";

/**
 * Create a Stripe Checkout Session. Never marks payment completed here —
 * only the verified webhook finalizes balances.
 */
export async function POST(request: Request) {
  try {
    const limited = enforceRateLimit(request, {
      key: "payments-checkout",
      limit: 20,
      windowMs: 60_000,
    });
    if (limited) return limited;

    if (!isOnlineCardPaymentEnabled()) {
      return apiError(
        "Online card payments are not enabled. Pay by cash or check, or contact Morris Services.",
        400
      );
    }

    const profile = await requireApiProfile();
    if (profile instanceof Response) return profile;

    const body = await parseJson<{
      companyId: string;
      customerId?: string;
      invoiceId?: string;
      amount?: number;
      allocations?: Array<{ invoiceId: string; amount: number }>;
      timing?: PaymentTiming;
      payAll?: boolean;
    }>(request);

    if (!body.companyId) return apiError("companyId required", 400);

    const customerId =
      profile.role === "customer"
        ? profile.customer_id ?? undefined
        : body.customerId;

    if (!customerId) return apiError("customerId required", 400);
    if (profile.role === "customer" && profile.customer_id !== customerId) {
      return apiError("Forbidden", 403);
    }

    let allocations = body.allocations ?? [];

    if (body.payAll) {
      const sb = createAdminClient();
      if (!sb) return apiError("Database unavailable", 503);
      const { data: invoices, error } = await sb
        .from("invoices")
        .select("id, balance_due, status")
        .eq("company_id", body.companyId)
        .eq("customer_id", customerId)
        .gt("balance_due", 0)
        .not("status", "in", '("void","written_off")');
      if (error) throw error;
      allocations = (invoices ?? [])
        .filter((i) => Number(i.balance_due) > 0)
        .map((i) => ({ invoiceId: i.id as string, amount: Number(i.balance_due) }));
    } else if (body.invoiceId) {
      const sb = createAdminClient();
      if (!sb) return apiError("Database unavailable", 503);
      const { data: invoice, error } = await sb
        .from("invoices")
        .select("id, balance_due, customer_id")
        .eq("company_id", body.companyId)
        .eq("id", body.invoiceId)
        .maybeSingle();
      if (error) throw error;
      if (!invoice) return apiError("Invoice not found", 404);
      if (invoice.customer_id !== customerId) return apiError("Forbidden", 403);
      const balance = Number(invoice.balance_due);
      const amount = body.amount != null ? Number(body.amount) : balance;
      if (amount <= 0) return apiError("Amount must be positive", 400);
      if (amount > balance + 0.01) return apiError("Amount exceeds invoice balance", 400);
      allocations = [{ invoiceId: body.invoiceId, amount }];
    }

    if (!allocations.length) return apiError("No invoices to pay", 400);

    const session = await createInvoiceCheckoutSession({
      companyId: body.companyId,
      customerId,
      allocations,
      timing: body.timing,
      actorProfileId: profile.id,
    });

    return apiOk({
      sessionId: session.sessionId,
      url: session.url,
      pendingPaymentId: session.pendingPaymentId,
    });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to start checkout");
  }
}
