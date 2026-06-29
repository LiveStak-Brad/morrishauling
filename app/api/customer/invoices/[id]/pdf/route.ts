import { morrisConfig } from "@/lib/morris-config";
import { generateInvoicePdf, getInvoiceById, getJobById } from "@/lib/db/operations";
import { requireApiProfile } from "@/lib/api/require-profile";
import { canAccessInvoice } from "@/lib/auth/permissions";
import { apiOk, apiError } from "@/lib/api/route-utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;

  try {
    const { id } = await params;
    const invoice = await getInvoiceById(morrisConfig.companyId, id);
    if (!invoice) return apiError("Invoice not found", 404);

    let assignedEmployeeIds: string[] | undefined;
    if (profile.role === "employee" && invoice.jobId) {
      const job = await getJobById(morrisConfig.companyId, invoice.jobId);
      assignedEmployeeIds = job?.assignedEmployeeIds;
    }

    if (!canAccessInvoice(profile, invoice, { assignedEmployeeIds })) {
      return apiError("Forbidden", 403);
    }

    const { signedUrl } = await generateInvoicePdf(morrisConfig.companyId, id);
    return apiOk({ url: signedUrl });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load PDF", 500);
  }
}
