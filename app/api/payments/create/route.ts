import { apiError, apiOk, parseJson } from "@/lib/api/route-utils";
import { requireApiProfile } from "@/lib/api/require-profile";
import { canAccessJob } from "@/lib/auth/permissions";
import { createPayment, getJobById } from "@/lib/db";
import {
  isOnlineCardPaymentEnabled,
  isOnlinePaymentMethod,
} from "@/lib/payments/online-payments-enabled";
import type { CreatePaymentRequest } from "@/types/payment";

export async function POST(request: Request) {
  try {
    const profile = await requireApiProfile();
    if (profile instanceof Response) return profile;

    const body = await parseJson<
      CreatePaymentRequest & {
        customerId?: string;
        collectedByEmployeeId?: string;
      }
    >(request);

    if (!body.companyId || !body.jobId || !body.amount) {
      return apiError("companyId, jobId, and amount required", 400);
    }

    if (!isOnlineCardPaymentEnabled() && isOnlinePaymentMethod(body.method)) {
      return apiError(
        "Online payments are not enabled yet. Please contact Morris Hauling to pay.",
        400
      );
    }

    const job = await getJobById(body.companyId, body.jobId);
    if (!job) return apiError("Job not found", 404);

    if (!canAccessJob(profile, job, job.assignedEmployeeIds)) {
      return apiError("Forbidden", 403);
    }

    const customerId =
      profile.role === "customer" ? profile.customer_id ?? undefined : body.customerId ?? job.customerId;
    const collectedByEmployeeId =
      profile.role === "employee"
        ? profile.employee_id ?? undefined
        : body.collectedByEmployeeId;

    const receiptNumber = `RCP-${Math.floor(Math.random() * 90000) + 10000}`;
    const payment = await createPayment(
      body.companyId,
      {
        companyId: body.companyId,
        jobId: body.jobId,
        invoiceId: body.invoiceId,
        amount: body.amount,
        method: body.method,
        timing: body.timing,
        status: "completed",
        receiptNumber,
        customerId,
        collectedByEmployeeId,
      },
      { actorProfileId: profile.id }
    );

    return apiOk({ payment, receiptNumber });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to create payment");
  }
}
