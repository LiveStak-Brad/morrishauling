import { morrisConfig } from "@/lib/morris-config";
import { updateDisposalReview, skipJobDisposal } from "@/lib/db/disposal-review";
import { requireApiProfile } from "@/lib/api/require-profile";
import { apiOk, apiError, parseJson } from "@/lib/api/route-utils";
import type { DisposalReviewStatus } from "@/lib/disposal/disposal-requirements";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ jobId: string }> }
) {
  const profile = await requireApiProfile();
  if (profile instanceof Response) return profile;
  if (profile.role !== "admin") return apiError("Admin access required", 403);

  try {
    const { jobId } = await context.params;
    const body = await parseJson<{
      action: "approve" | "flag" | "request_correction" | "skip";
      notes?: string;
      skipReason?: string;
      skipNotes?: string;
      markJobCompleted?: boolean;
    }>(request);

    if (body.action === "skip") {
      if (!body.skipReason?.trim()) return apiError("skipReason required", 400);
      await skipJobDisposal(morrisConfig.companyId, jobId, {
        skipReason: body.skipReason,
        skipNotes: body.skipNotes,
        actorProfileId: profile.id,
        markJobCompleted: body.markJobCompleted,
      });
      return apiOk({ skipped: true });
    }

    const statusMap: Record<string, DisposalReviewStatus> = {
      approve: "approved",
      flag: "flagged",
      request_correction: "correction_requested",
    };
    const status = statusMap[body.action];
    if (!status) return apiError("Invalid action", 400);

    await updateDisposalReview(morrisConfig.companyId, jobId, {
      status,
      notes: body.notes,
      actorProfileId: profile.id,
    });
    return apiOk({ status });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Review update failed", 500);
  }
}
