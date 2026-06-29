import { morrisConfig } from "@/lib/morris-config";
import {
  getDocumentTemplatesAdmin,
  uploadHrTemplateFile,
  getDocumentAuditLog,
  validateDocumentFile,
} from "@/lib/db/hr/document-files";
import { requireApiProfile } from "@/lib/api/require-profile";
import { canAccessAdmin } from "@/lib/auth/permissions";
import { apiOk, apiError } from "@/lib/api/route-utils";

export async function GET() {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  if (!canAccessAdmin(profile)) return apiError("Admin access required", 403);

  try {
    const templates = await getDocumentTemplatesAdmin(morrisConfig.companyId);
    return apiOk({ templates });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load templates", 500);
  }
}

export async function POST(request: Request) {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  if (!canAccessAdmin(profile)) return apiError("Admin access required", 403);

  try {
    const form = await request.formData();
    const file = form.get("file");
    const templateId = form.get("templateId") as string;
    const changeSummary = (form.get("changeSummary") as string) ?? undefined;

    if (!(file instanceof File) || !templateId) {
      return apiError("file and templateId required", 400);
    }
    validateDocumentFile(file);

    const template = await uploadHrTemplateFile(morrisConfig.companyId, templateId, {
      file: Buffer.from(await file.arrayBuffer()),
      mimeType: file.type,
      fileName: file.name,
      actorProfileId: profile.id,
      changeSummary,
    });

    const audit = await getDocumentAuditLog(morrisConfig.companyId, "document_template", templateId);
    return apiOk({ template, audit });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Upload failed", 500);
  }
}
