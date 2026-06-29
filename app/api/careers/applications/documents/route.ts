import { morrisConfig } from "@/lib/morris-config";
import {
  uploadApplicantDocument,
  validateDocumentFile,
} from "@/lib/db/hr/document-files";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { apiOk, apiError } from "@/lib/api/route-utils";
import type { ApplicantDocumentType } from "@/types/hr/documents";

/** Public applicant document upload (after application submit). */
export async function POST(request: Request) {
  const limited = enforceRateLimit(request, {
    key: "careers-applications-documents",
    limit: 20,
    windowMs: 15 * 60_000,
  });
  if (limited) return limited;

  try {
    const form = await request.formData();
    const file = form.get("file");
    const applicantId = form.get("applicantId") as string;
    const applicationId = (form.get("applicationId") as string) ?? undefined;
    const statusToken = form.get("statusToken") as string;
    const documentType = (form.get("documentType") as ApplicantDocumentType) ?? "supporting";

    if (!(file instanceof File)) return apiError("file required", 400);
    if (!applicantId || !statusToken) return apiError("applicantId and statusToken required", 400);

    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();
    if (!admin) return apiError("Storage unavailable", 503);

    const { data: app } = await admin
      .from("applications")
      .select("id, applicant_id, status_token")
      .eq("company_id", morrisConfig.companyId)
      .eq("id", applicationId ?? "")
      .eq("applicant_id", applicantId)
      .maybeSingle();

    if (!app || app.status_token !== statusToken) {
      return apiError("Invalid application token", 403);
    }

    validateDocumentFile(file);

    const doc = await uploadApplicantDocument(morrisConfig.companyId, {
      applicantId,
      applicationId: applicationId ?? (app.id as string),
      documentType,
      file: Buffer.from(await file.arrayBuffer()),
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
    });

    return apiOk({ document: doc });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Upload failed", 500);
  }
}
