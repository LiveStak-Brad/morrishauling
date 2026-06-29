import { morrisConfig } from "@/lib/morris-config";
import {
  getApplicantDocuments,
  uploadApplicantDocument,
  validateDocumentFile,
} from "@/lib/db/hr/document-files";
import { requireApiProfile } from "@/lib/api/require-profile";
import { canAccessAdmin } from "@/lib/auth/permissions";
import { apiOk, apiError } from "@/lib/api/route-utils";
import type { ApplicantDocumentType } from "@/types/hr/documents";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  if (!canAccessAdmin(profile)) return apiError("Admin access required", 403);

  try {
    const { id: applicantId } = await params;
    const documents = await getApplicantDocuments(morrisConfig.companyId, applicantId);
    return apiOk({ documents });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load documents", 500);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  if (!canAccessAdmin(profile)) return apiError("Admin access required", 403);

  try {
    const { id: applicantId } = await params;
    const form = await request.formData();
    const file = form.get("file");
    const documentType = (form.get("documentType") as ApplicantDocumentType) ?? "supporting";
    const applicationId = (form.get("applicationId") as string) ?? undefined;

    if (!(file instanceof File)) return apiError("file required", 400);
    validateDocumentFile(file);

    const doc = await uploadApplicantDocument(morrisConfig.companyId, {
      applicantId,
      applicationId,
      documentType,
      file: Buffer.from(await file.arrayBuffer()),
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
      uploadedByProfileId: profile.id,
    });

    return apiOk({ document: doc });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Upload failed", 500);
  }
}
