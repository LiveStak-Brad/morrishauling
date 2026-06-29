import { apiError, apiOk, parseJson } from "@/lib/api/route-utils";
import { requireApiProfile } from "@/lib/api/require-profile";
import { canAccessInvoice } from "@/lib/auth/permissions";
import { getInvoiceById, updateInvoice } from "@/lib/db";
import type { Invoice } from "@/types/payment";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const profile = await requireApiProfile();
    if (profile instanceof Response) return profile;

    const { id } = await params;
    const body = await parseJson<{
      companyId: string;
      updates: Partial<Invoice>;
    }>(request);

    if (!body.companyId || !body.updates) {
      return apiError("companyId and updates required", 400);
    }

    const invoice = await getInvoiceById(body.companyId, id);
    if (!invoice) return apiError("Invoice not found", 404);

    if (!canAccessInvoice(profile, invoice)) {
      return apiError("Forbidden", 403);
    }

    if (profile.role === "customer") {
      return apiError("Customers cannot edit invoices", 403);
    }

    const updated = await updateInvoice(body.companyId, id, body.updates, {
      actorProfileId: profile.id,
    });
    if (!updated) return apiError("Invoice not found", 404);

    return apiOk({ invoice: updated });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to update invoice");
  }
}
