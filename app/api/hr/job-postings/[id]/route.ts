import { morrisConfig } from "@/lib/morris-config";
import { getJobPostingById, updateJobPosting } from "@/lib/db/hr/ats";
import { requireApiPermission } from "@/lib/api/require-profile";
import { apiOk, apiError, parseJson } from "@/lib/api/route-utils";
import type { JobPosting } from "@/types/hr/ats";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const profile = await requireApiPermission("hr.applicants.read");
  if (profile instanceof Response) return profile;
  try {
    const { id } = await context.params;
    const posting = await getJobPostingById(morrisConfig.companyId, id);
    if (!posting) return apiError("Posting not found", 404);
    return apiOk({ posting });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load posting", 500);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const profile = await requireApiPermission("hr.applicants.write");
  if (profile instanceof Response) return profile;
  try {
    const { id } = await context.params;
    const body = await parseJson<Partial<JobPosting>>(request);
    await updateJobPosting(morrisConfig.companyId, id, body);
    return apiOk({ updated: true });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to update posting", 500);
  }
}
