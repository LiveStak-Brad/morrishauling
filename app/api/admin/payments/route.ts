import { morrisConfig } from "@/lib/morris-config";
import { createPayment } from "@/lib/db/operations";
import { fetchPaymentsUnfiltered } from "@/lib/db/admin-unfiltered";
import { filterPayments } from "@/lib/data/real-record-filter";
import { buildListMetaFromCounts } from "@/lib/api/admin-data-meta";
import { isOnlinePaymentMethod } from "@/lib/payments/online-payments-enabled";
import { requireApiProfile } from "@/lib/api/require-profile";
import { apiOk, apiError, parseJson } from "@/lib/api/route-utils";
import type { Payment } from "@/types";

export async function GET() {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  if (!["admin", "planner"].includes(profile.role)) {
    return apiError("Admin access required", 403);
  }
  try {
    const all = await fetchPaymentsUnfiltered(morrisConfig.companyId);
    const payments = filterPayments(all);
    const meta = await buildListMetaFromCounts(all.length, payments.length);
    return apiOk({ payments, meta });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load payments", 500);
  }
}

export async function POST(request: Request) {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  if (!["admin", "planner"].includes(profile.role)) {
    return apiError("Admin access required", 403);
  }
  try {
    const body = await parseJson<{
      customerId: string;
      jobId?: string;
      invoiceId?: string;
      amount: number;
      method: Payment["method"];
      timing?: Payment["timing"];
      notes?: string;
      collectedByEmployeeId?: string;
    }>(request);
    if (!body.customerId || !body.amount) {
      return apiError("customerId and amount required", 400);
    }
    if (!body.jobId && !body.invoiceId) {
      return apiError("invoiceId or jobId required", 400);
    }
    if (isOnlinePaymentMethod(body.method)) {
      return apiError(
        "Online card and ACH payments are not enabled yet. Record cash or check manually.",
        400
      );
    }

    let jobId = body.jobId;
    let invoiceId = body.invoiceId;
    if (invoiceId && !jobId) {
      const { getInvoiceById } = await import("@/lib/db/operations");
      const inv = await getInvoiceById(morrisConfig.companyId, invoiceId);
      if (!inv) return apiError("Invoice not found", 404);
      if (inv.customerId !== body.customerId) {
        return apiError("Invoice does not belong to this customer", 400);
      }
      jobId = inv.jobId;
    }

    // Prefer allocation path when paying a specific invoice so balances stay accurate
    if (invoiceId) {
      const { allocatePaymentAcrossInvoices } = await import("@/lib/db/billing-operations");
      const result = await allocatePaymentAcrossInvoices(
        morrisConfig.companyId,
        {
          customerId: body.customerId,
          amount: body.amount,
          method: body.method,
          allocations: [{ invoiceId, amount: body.amount }],
          notes: body.notes,
          timing: body.timing,
        },
        { actorProfileId: profile.id, actorRole: profile.role }
      );
      return apiOk({ payment: result.payment, allocations: result.allocations });
    }

    const payment = await createPayment(
      morrisConfig.companyId,
      {
        companyId: morrisConfig.companyId,
        jobId: jobId!,
        invoiceId,
        amount: body.amount,
        method: body.method,
        timing: body.timing ?? "full",
        status: "completed",
        customerId: body.customerId,
        collectedByEmployeeId: body.collectedByEmployeeId,
        notes: body.notes,
      },
      { actorProfileId: profile.id }
    );
    return apiOk({ payment });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to create payment", 500);
  }
}
