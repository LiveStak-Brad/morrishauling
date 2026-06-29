import { apiError, apiOk, parseJson } from "@/lib/api/route-utils";
import { reviewJobEstimate } from "@/lib/db";
import { getCurrentProfile } from "@/lib/auth/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const profile = await getCurrentProfile();
    if (!profile) return apiError("Authentication required", 401);
    if (profile.role !== "admin" && profile.role !== "planner") {
      return apiError("Admin or planner access required", 403);
    }

    const { id: jobId } = await params;
    const body = await parseJson<{
      companyId: string;
      action: "approved" | "adjusted" | "declined";
      adjustedTotal?: number;
      notes?: string;
    }>(request);

    if (!body.companyId || !body.action) {
      return apiError("companyId and action required", 400);
    }

    const job = await reviewJobEstimate(
      body.companyId,
      jobId,
      {
        action: body.action,
        adjustedTotal: body.adjustedTotal,
        notes: body.notes,
      },
      { actorProfileId: profile.id }
    );

    if (!job) return apiError("Job not found", 404);
    return apiOk({ job });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Review failed");
  }
}
