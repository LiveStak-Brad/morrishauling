import { morrisConfig } from "@/lib/morris-config";
import { getInvoices, createAdminInvoice } from "@/lib/db/operations";
import { requireApiProfile } from "@/lib/api/require-profile";
import { apiOk, apiError, parseJson } from "@/lib/api/route-utils";
import type { Invoice } from "@/types";

export async function GET() {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  if (!["admin", "planner"].includes(profile.role)) {
    return apiError("Admin access required", 403);
  }
  try {
    const invoices = await getInvoices(morrisConfig.companyId);
    return apiOk({ invoices });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load invoices", 500);
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
      lineItems: Invoice["adjustments"];
      fees?: number;
      tax?: number;
      discount?: number;
      dueDate?: string;
      terms?: string;
      status?: Invoice["status"];
      depositAmount?: number;
      markPaid?: boolean;
      sendPlaceholder?: boolean;
      finalPriceNotes?: string;
    }>(request);
    if (!body.customerId) return apiError("customerId required", 400);
    if (body.sendPlaceholder) {
      return apiError(
        "Email sending is not connected yet. Save as draft or download PDF from invoice detail.",
        400
      );
    }
    const invoice = await createAdminInvoice(
      morrisConfig.companyId,
      {
        ...body,
        status: body.status ?? "draft",
        finalPriceNotes: body.finalPriceNotes,
      },
      { actorProfileId: profile.id }
    );
    return apiOk({ invoice });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to create invoice", 500);
  }
}
