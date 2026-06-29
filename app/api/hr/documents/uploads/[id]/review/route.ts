import { morrisConfig } from "@/lib/morris-config";
import { reviewEmployeeUpload } from "@/lib/db/hr/document-files";
import { requireApiProfile } from "@/lib/api/require-profile";
import { canAccessAdmin } from "@/lib/auth/permissions";
import { apiOk, apiError, parseJson } from "@/lib/api/route-utils";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  if (!canAccessAdmin(profile)) return apiError("Admin access required", 403);

  try {
    const { id } = await params;
    const body = await parseJson<{ status: "approved" | "rejected"; reviewNotes?: string }>(request);
    if (!body.status) return apiError("status required", 400);

    await reviewEmployeeUpload(morrisConfig.companyId, id, {
      status: body.status,
      reviewNotes: body.reviewNotes,
      reviewedByProfileId: profile.id,
    });

    return apiOk({ ok: true });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Review failed", 500);
  }
}
