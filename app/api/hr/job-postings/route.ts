import { morrisConfig } from "@/lib/morris-config";
import { getJobPostings, createJobPosting } from "@/lib/db/hr";
import { requireApiPermission } from "@/lib/api/require-profile";
import { apiOk, apiError, parseJson } from "@/lib/api/route-utils";
import type { JobPosting } from "@/types/hr/ats";

export async function GET() {
  const profile = await requireApiPermission("hr.applicants.read");
  if (profile instanceof Response) return profile;
  try {
    const postings = await getJobPostings(morrisConfig.companyId);
    return apiOk({ postings });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load postings", 500);
  }
}

export async function POST(request: Request) {
  const profile = await requireApiPermission("hr.applicants.write");
  if (profile instanceof Response) return profile;
  try {
    const body = await parseJson<Partial<JobPosting> & { title: string; slug: string; description: string; employmentType: JobPosting["employmentType"] }>(request);
    const postingId = await createJobPosting(morrisConfig.companyId, body);
    return apiOk({ postingId });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to create posting", 500);
  }
}
