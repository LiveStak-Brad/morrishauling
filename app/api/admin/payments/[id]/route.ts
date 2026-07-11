import { morrisConfig } from "@/lib/morris-config";
import { requireApiProfile } from "@/lib/api/require-profile";
import { apiOk, apiError, parseJson } from "@/lib/api/route-utils";
import { issuePaymentReceipt, logBillingAudit } from "@/lib/db/billing-operations";
import { getInvoiceById, updateInvoice, isDbReady } from "@/lib/db/operations";
import { createAdminClient } from "@/lib/supabase/admin";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  if (!["admin", "planner"].includes(profile.role)) {
    return apiError("Admin access required", 403);
  }
  const { id } = await ctx.params;
  try {
    const body = await parseJson<{
      action: "reverse" | "issue_receipt";
      reason?: string;
    }>(request);

    if (body.action === "issue_receipt") {
      const result = await issuePaymentReceipt(morrisConfig.companyId, id, {
        actorProfileId: profile.id,
      });
      return apiOk(result);
    }

    if (body.action === "reverse") {
      if (!body.reason?.trim()) return apiError("reason is required to reverse a payment", 400);
      if (!(await isDbReady())) return apiError("Database unavailable", 503);
      const sb = createAdminClient();
      if (!sb) return apiError("Database unavailable", 503);

      const { data, error } = await sb
        .from("payments")
        .select("*")
        .eq("company_id", morrisConfig.companyId)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return apiError("Payment not found", 404);
      if (data.reversed_at) return apiError("Payment already reversed", 400);
      if (data.status !== "completed") return apiError("Only completed payments can be reversed", 400);

      const now = new Date().toISOString();
      await sb
        .from("payments")
        .update({
          status: "refunded",
          reversed_at: now,
          reversal_reason: body.reason,
          reversed_by_profile_id: profile.id,
        })
        .eq("id", id);

      // Reverse every invoice allocation (Pay All / multi-invoice), not only primary invoice_id.
      const { data: allocations } = await sb
        .from("payment_allocations")
        .select("invoice_id, amount")
        .eq("payment_id", id)
        .eq("company_id", morrisConfig.companyId);

      const toReverse =
        allocations && allocations.length > 0
          ? allocations.map((a) => ({
              invoiceId: a.invoice_id as string,
              amount: Number(a.amount),
            }))
          : data.invoice_id
            ? [{ invoiceId: data.invoice_id as string, amount: Number(data.amount) }]
            : [];

      for (const row of toReverse) {
        const invoice = await getInvoiceById(morrisConfig.companyId, row.invoiceId);
        if (!invoice) continue;
        const amountPaid = Math.max(0, invoice.amountPaid - row.amount);
        const balanceDue = Math.max(0, invoice.total - amountPaid);
        await updateInvoice(
          morrisConfig.companyId,
          invoice.id,
          {
            amountPaid,
            balanceDue,
            status:
              balanceDue <= 0
                ? "paid"
                : amountPaid > 0
                  ? "partially_paid"
                  : invoice.status === "sent"
                    ? "sent"
                    : "ready_to_send",
            paymentStatus: balanceDue <= 0 ? "paid_in_full" : "balance_due",
          },
          { actorProfileId: profile.id }
        );
      }

      await logBillingAudit({
        companyId: morrisConfig.companyId,
        entityType: "payment",
        entityId: id,
        action: "payment_reversed",
        actorProfileId: profile.id,
        actorRole: profile.role,
        reason: body.reason,
        oldValue: { amount: data.amount, status: data.status },
        newValue: { status: "refunded" },
      });

      return apiOk({ ok: true });
    }

    return apiError("Unknown action", 400);
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Payment action failed", 500);
  }
}
