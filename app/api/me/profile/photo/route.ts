import { morrisConfig } from "@/lib/morris-config";
import {
  setEmployeeAvatar,
  clearEmployeeAvatar,
  getEmployeeAvatarUrl,
} from "@/lib/db/hr/document-files";
import { requireEmployeeMeContext } from "@/lib/api/require-profile";
import { apiOk, apiError } from "@/lib/api/route-utils";

const ALLOWED_AVATAR = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function GET() {
  const ctx = await requireEmployeeMeContext();
  if (ctx instanceof Response) return ctx;
  try {
    const url = await getEmployeeAvatarUrl(morrisConfig.companyId, ctx.employeeId);
    return apiOk({ url });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load photo", 500);
  }
}

export async function POST(request: Request) {
  const ctx = await requireEmployeeMeContext();
  if (ctx instanceof Response) return ctx;
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return apiError("file required", 400);
    if (!ALLOWED_AVATAR.has(file.type)) return apiError("Use JPEG, PNG, or WebP", 400);
    if (file.size > 5 * 1024 * 1024) return apiError("Max 5MB", 400);

    const path = await setEmployeeAvatar(morrisConfig.companyId, ctx.employeeId, {
      file: Buffer.from(await file.arrayBuffer()),
      mimeType: file.type,
      actorProfileId: ctx.profile.id,
    });
    const url = await getEmployeeAvatarUrl(morrisConfig.companyId, ctx.employeeId);
    return apiOk({ path, url });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Upload failed", 500);
  }
}

export async function DELETE() {
  const ctx = await requireEmployeeMeContext();
  if (ctx instanceof Response) return ctx;
  try {
    await clearEmployeeAvatar(morrisConfig.companyId, ctx.employeeId, ctx.profile.id);
    return apiOk({ ok: true });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to remove photo", 500);
  }
}
