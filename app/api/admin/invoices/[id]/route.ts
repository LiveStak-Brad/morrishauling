import { morrisConfig } from "@/lib/morris-config";
import {
  getAdminInvoiceDetail,
  updateInvoice,
  voidInvoice,
  createPayment,
} from "@/lib/db/operations";
import { requireApiProfile } from "@/lib/api/require-profile";
import { apiOk, apiError, parseJson } from "@/lib/api/route-utils";
import type { Invoice, Payment } from "@/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  if (!["admin", "planner"].includes(profile.role)) {
    return apiError("Admin access required", 403);
  }

  try {
    const { id } = await params;
    const detail = await getAdminInvoiceDetail(morrisConfig.companyId, id);
    if (!detail) return apiError("Invoice not found", 404);
    return apiOk(detail);
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load invoice", 500);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  if (!["admin", "planner"].includes(profile.role)) {
    return apiError("Admin access required", 403);
  }

  try {
    const { id } = await params;
    const body = await parseJson<{
      action?: "void" | "mark_paid" | "send" | "resend";
      updates?: Partial<Invoice>;
      reason?: string;
    }>(request);

    if (body.action === "send" || body.action === "resend") {
      const detail = await getAdminInvoiceDetail(morrisConfig.companyId, id);
      if (!detail) return apiError("Invoice not found", 404);
      const emailConfigured =
        process.env.NOTIFICATIONS_EMAIL_ENABLED === "true" &&
        Boolean(process.env.RESEND_API_KEY || process.env.SMTP_HOST);
      const { createShareToken } = await import("@/lib/billing/utils");
      const { logBillingAudit } = await import("@/lib/db/billing-operations");
      const token = createShareToken();
      const now = new Date().toISOString();
      const deliveryStatus = emailConfigured ? "pending" : "skipped";
      const deliveryError = emailConfigured
        ? null
        : "Email delivery is not configured. Copy the customer link or download the PDF.";

      const invoice = await updateInvoice(
        morrisConfig.companyId,
        id,
        {
          status: detail.invoice.status === "paid" ? detail.invoice.status : "sent",
          deliveryStatus,
          deliveryError: deliveryError ?? undefined,
          sentAt: detail.invoice.sentAt ?? now,
        } as Partial<Invoice>,
        { actorProfileId: profile.id }
      );

      const { createAdminClient } = await import("@/lib/supabase/admin");
      const sb = createAdminClient();
      if (sb) {
        await sb
          .from("invoices")
          .update({
            share_token_hash: token.hash,
            share_token_expires_at: token.expiresAt,
            delivery_status: deliveryStatus,
            delivery_error: deliveryError,
            sent_at: detail.invoice.sentAt ?? now,
            status: detail.invoice.status === "paid" ? detail.invoice.status : "sent",
          })
          .eq("id", id);
      }

      const { enqueueNotification } = await import("@/lib/notifications/enqueue");
      await enqueueNotification({
        companyId: morrisConfig.companyId,
        jobId: detail.invoice.jobId,
        customerId: detail.invoice.customerId,
        eventType: "invoice_available",
        channel: emailConfigured ? "email" : "in_app",
      });

      await logBillingAudit({
        companyId: morrisConfig.companyId,
        entityType: "invoice",
        entityId: id,
        action: body.action === "resend" ? "invoice_resent" : "invoice_sent",
        actorProfileId: profile.id,
        actorRole: profile.role,
        newValue: { deliveryStatus },
      });

      const base = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
      return apiOk({
        invoice,
        customerUrl: `${base}/i/${token.token}`,
        deliveryStatus,
        deliveryMessage: deliveryError ?? "Invoice queued for delivery.",
      });
    }

    if (body.action === "void") {
      const invoice = await voidInvoice(morrisConfig.companyId, id, {
        actorProfileId: profile.id,
        reason: body.reason,
      });
      if (!invoice) return apiError("Invoice not found", 404);
      return apiOk({ invoice });
    }

    if (body.action === "mark_paid") {
      const detail = await getAdminInvoiceDetail(morrisConfig.companyId, id);
      if (!detail) return apiError("Invoice not found", 404);
      const invoice = await updateInvoice(
        morrisConfig.companyId,
        id,
        {
          status: "paid",
          balanceDue: 0,
          amountPaid: detail.invoice.total,
          paymentStatus: "paid_in_full",
        },
        { actorProfileId: profile.id }
      );
      return apiOk({ invoice });
    }

    if (body.updates) {
      const invoice = await updateInvoice(morrisConfig.companyId, id, body.updates, {
        actorProfileId: profile.id,
      });
      if (!invoice) return apiError("Invoice not found", 404);
      return apiOk({ invoice });
    }

    return apiError("updates or action required", 400);
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to update invoice", 500);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  if (!["admin", "planner"].includes(profile.role)) {
    return apiError("Admin access required", 403);
  }

  try {
    const { id } = await params;
    const detail = await getAdminInvoiceDetail(morrisConfig.companyId, id);
    if (!detail) return apiError("Invoice not found", 404);

    const body = await parseJson<{
      amount: number;
      method: Payment["method"];
      timing?: Payment["timing"];
      notes?: string;
    }>(request);

    if (!body.amount || !body.method) {
      return apiError("amount and method required", 400);
    }

    const payment = await createPayment(
      morrisConfig.companyId,
      {
        companyId: morrisConfig.companyId,
        jobId: detail.invoice.jobId,
        invoiceId: id,
        amount: body.amount,
        method: body.method,
        timing: body.timing ?? "full",
        status: "completed",
        customerId: detail.invoice.customerId,
        notes: body.notes,
      },
      { actorProfileId: profile.id }
    );

    const newPaid = detail.invoice.amountPaid + body.amount;
    const balanceDue = Math.max(0, detail.invoice.total - newPaid);
    await updateInvoice(
      morrisConfig.companyId,
      id,
      {
        amountPaid: newPaid,
        balanceDue,
        status: balanceDue <= 0 ? "paid" : "partially_paid",
        paymentStatus: balanceDue <= 0 ? "paid_in_full" : "balance_due",
      },
      { actorProfileId: profile.id }
    );

    const refreshed = await getAdminInvoiceDetail(morrisConfig.companyId, id);
    return apiOk({ payment, detail: refreshed });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to record payment", 500);
  }
}
