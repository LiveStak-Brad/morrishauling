import { morrisConfig } from "@/lib/morris-config";
import {
  setEmployeeAvatar,
  clearEmployeeAvatar,
  getEmployeeAvatarUrl,
} from "@/lib/db/hr/document-files";
import { requireApiProfile } from "@/lib/api/require-profile";
import { canAccessAdmin } from "@/lib/auth/permissions";
import { apiOk, apiError } from "@/lib/api/route-utils";

const ALLOWED_AVATAR = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  if (!canAccessAdmin(profile)) return apiError("Admin access required", 403);

  try {
    const { id: employeeId } = await params;
    const url = await getEmployeeAvatarUrl(morrisConfig.companyId, employeeId);
    return apiOk({ url });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load photo", 500);
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
    if (!(file instanceof File)) return apiError("file required", 400);
    if (!ALLOWED_AVATAR.has(file.type)) return apiError("Use JPEG, PNG, or WebP", 400);

    const path = await setEmployeeAvatar(morrisConfig.companyId, employeeId, {
      file: Buffer.from(await file.arrayBuffer()),
      mimeType: file.type,
      actorProfileId: profile.id,
    });
    const url = await getEmployeeAvatarUrl(morrisConfig.companyId, employeeId);
    return apiOk({ path, url });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Upload failed", 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  if (!canAccessAdmin(profile)) return apiError("Admin access required", 403);

  try {
    const { id: employeeId } = await params;
    await clearEmployeeAvatar(morrisConfig.companyId, employeeId, profile.id);
    return apiOk({ ok: true });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to remove photo", 500);
  }
}
