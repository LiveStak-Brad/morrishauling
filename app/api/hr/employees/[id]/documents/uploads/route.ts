import { morrisConfig } from "@/lib/morris-config";
import {
  uploadEmployeeDocument,
  validateDocumentFile,
  getEmployeeUploads,
} from "@/lib/db/hr/document-files";
import { requireApiProfile } from "@/lib/api/require-profile";
import { canAccessAdmin } from "@/lib/auth/permissions";
import { apiOk, apiError } from "@/lib/api/route-utils";
import type { EmployeeUploadType } from "@/types/hr/documents";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  if (!canAccessAdmin(profile)) return apiError("Admin access required", 403);

  try {
    const { id: employeeId } = await params;
    const uploads = await getEmployeeUploads(morrisConfig.companyId, employeeId);
    return apiOk({ uploads });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load uploads", 500);
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
    const { id: employeeId } = await params;
    const form = await request.formData();
    const file = form.get("file");
    const documentType = (form.get("documentType") as EmployeeUploadType) ?? "other";
    const label = (form.get("label") as string) ?? "Document";

    if (!(file instanceof File)) return apiError("file required", 400);
    validateDocumentFile(file);

    const upload = await uploadEmployeeDocument(morrisConfig.companyId, employeeId, {
      file: Buffer.from(await file.arrayBuffer()),
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
      documentType,
      label,
      uploadedByProfileId: profile.id,
    });

    return apiOk({ upload });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Upload failed", 500);
  }
}
