import { apiOk, apiError } from "@/lib/api/route-utils";
import { getInvoiceByShareToken, logBillingAudit } from "@/lib/db/billing-operations";
import { getAdminInvoiceDetail, isDbReady } from "@/lib/db/operations";
import { createAdminClient } from "@/lib/supabase/admin";

type Ctx = { params: Promise<{ token: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const { token } = await ctx.params;
  try {
    const invoice = await getInvoiceByShareToken(token);
    if (!invoice) return apiError("Invoice not found or link expired", 404);

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
    });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load invoice", 500);
  }
}
