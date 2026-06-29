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
      action?: "void" | "mark_paid";
      updates?: Partial<Invoice>;
      reason?: string;
    }>(request);

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
        status: balanceDue <= 0 ? "paid" : "partial",
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
