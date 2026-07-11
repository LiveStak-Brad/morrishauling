import { morrisConfig } from "@/lib/morris-config";
import { requireApiProfile } from "@/lib/api/require-profile";
import { apiOk, apiError, parseJson } from "@/lib/api/route-utils";
import { createEstimate, listEstimates } from "@/lib/db/billing-operations";
import type { BillingLineItem } from "@/types/billing";

export async function GET() {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  if (!["admin", "planner"].includes(profile.role)) {
    return apiError("Admin access required", 403);
  }
  try {
    const estimates = await listEstimates(morrisConfig.companyId);
    return apiOk({ estimates });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load estimates", 500);
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
      divisionId?: string;
      serviceAddress?: Record<string, unknown>;
      lineItems: Array<Partial<BillingLineItem> & { label: string; unitPrice: number }>;
      discountAmount?: number;
      taxAmount?: number;
      customerNotes?: string;
      internalNotes?: string;
      expiresAt?: string;
      scheduledServiceDate?: string;
      estimateType?: string;
      status?: "draft" | "internal_review" | "ready_to_send";
    }>(request);

    if (!body.customerId) return apiError("customerId required", 400);
    if (!body.lineItems?.length) return apiError("At least one line item is required", 400);

    const estimate = await createEstimate(
      morrisConfig.companyId,
      body,
      { actorProfileId: profile.id, actorRole: profile.role }
    );
    return apiOk({ estimate });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to create estimate", 500);
  }
}
