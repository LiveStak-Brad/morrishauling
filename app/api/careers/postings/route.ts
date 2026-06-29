import { morrisConfig } from "@/lib/morris-config";
import { getPublishedJobPostings } from "@/lib/db/hr";
import { resolveCareersPostings, getReferenceCareerPostings } from "@/lib/careers/resolve-postings";
import { apiOk } from "@/lib/api/route-utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const employmentType = searchParams.get("employmentType");
    let postings = resolveCareersPostings(await getPublishedJobPostings(morrisConfig.companyId));
    if (employmentType) {
      postings = postings.filter((p) => p.employmentType === employmentType);
    }
    return apiOk({ postings, fromReference: postings.every((p) => p.isReferenceTemplate) });
  } catch (e) {
    const { getReferenceCareerPostings } = await import("@/lib/careers/resolve-postings");
    return apiOk({ postings: getReferenceCareerPostings(), fromReference: true });
  }
}
