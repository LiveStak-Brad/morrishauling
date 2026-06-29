import { morrisConfig } from "@/lib/morris-config";
import { getApplications, createAdminApplicant } from "@/lib/db/hr";
import { requireApiPermission } from "@/lib/api/require-profile";
import { apiOk, apiError, parseJson } from "@/lib/api/route-utils";

export async function GET(request: Request) {
  const profile = await requireApiPermission("hr.applicants.read");
  if (profile instanceof Response) return profile;
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") ?? undefined;
    const applications = await getApplications(morrisConfig.companyId, { status });
    return apiOk({ applications });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load applicants", 500);
  }
}

export async function POST(request: Request) {
  const profile = await requireApiPermission("hr.applicants.write");
  if (profile instanceof Response) return profile;
  try {
    const body = await parseJson<{
      firstName: string;
      lastName: string;
      phone?: string;
      email?: string;
      jobPostingId: string;
      source?: string;
      notes?: string;
    }>(request);
    if (!body.firstName || !body.lastName || !body.jobPostingId) {
      return apiError("firstName, lastName, and jobPostingId required", 400);
    }
    const result = await createAdminApplicant(morrisConfig.companyId, body, {
      actorProfileId: profile.id,
    });
    return apiOk(result);
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to create applicant", 500);
  }
}
