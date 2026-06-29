import { morrisConfig } from "@/lib/morris-config";
import {
  getEmployeeUploads,
  uploadEmployeeDocument,
  validateDocumentFile,
} from "@/lib/db/hr/document-files";
import { requireEmployeeMeContext } from "@/lib/api/require-profile";
import { apiOk, apiError } from "@/lib/api/route-utils";
import type { EmployeeUploadType } from "@/types/hr/documents";

export async function GET() {
  const ctx = await requireEmployeeMeContext();
  if (ctx instanceof Response) return ctx;
  try {
    const uploads = await getEmployeeUploads(morrisConfig.companyId, ctx.employeeId);
    return apiOk({ uploads });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load uploads", 500);
  }
}

export async function POST(request: Request) {
  const ctx = await requireEmployeeMeContext();
  if (ctx instanceof Response) return ctx;
  try {
    const form = await request.formData();
    const file = form.get("file");
    const documentType = (form.get("documentType") as EmployeeUploadType) ?? "other";
    const label = (form.get("label") as string) ?? "Document";
    const replaceUploadId = (form.get("replaceUploadId") as string) ?? undefined;

    if (!(file instanceof File)) return apiError("file required", 400);
    validateDocumentFile(file);

    const upload = await uploadEmployeeDocument(morrisConfig.companyId, ctx.employeeId, {
      file: Buffer.from(await file.arrayBuffer()),
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
      documentType,
      label,
      uploadedByProfileId: ctx.profile.id,
      replaceUploadId,
    });

    return apiOk({ upload });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Upload failed", 500);
  }
}
