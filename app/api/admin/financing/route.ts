import { morrisConfig } from "@/lib/morris-config";
import { createPayment } from "@/lib/db/operations";
import { fetchPaymentsUnfiltered } from "@/lib/db/admin-unfiltered";
import { filterPayments } from "@/lib/data/real-record-filter";
import { buildListMetaFromCounts } from "@/lib/api/admin-data-meta";
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
      jobId: string;
      invoiceId?: string;
      amount: number;
      method: Payment["method"];
      timing?: Payment["timing"];
      notes?: string;
      collectedByEmployeeId?: string;
      status?: Payment["status"];
    }>(request);
    if (!body.customerId || !body.jobId || !body.amount) {
      return apiError("customerId, jobId, and amount required", 400);
    }
    const payment = await createPayment(
      morrisConfig.companyId,
      {
        companyId: morrisConfig.companyId,
        jobId: body.jobId,
        invoiceId: body.invoiceId,
        amount: body.amount,
        method: body.method,
        timing: body.timing ?? "full",
        status: body.status ?? "completed",
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
