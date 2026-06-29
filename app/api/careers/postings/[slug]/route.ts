import { morrisConfig } from "@/lib/morris-config";
import { getJobPostingBySlug } from "@/lib/db/hr";
import { findCareerPosting, getReferenceCareerPostings } from "@/lib/careers/resolve-postings";
import { apiOk, apiError } from "@/lib/api/route-utils";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const posting = await getJobPostingBySlug(morrisConfig.companyId, slug);
    if (posting) return apiOk({ posting });
    const fallback = findCareerPosting(getReferenceCareerPostings(), { slug });
    if (fallback) return apiOk({ posting: fallback });
    return apiError("Job not found", 404);
  } catch {
    const { slug } = await params;
    const fallback = findCareerPosting(getReferenceCareerPostings(), { slug });
    if (fallback) return apiOk({ posting: fallback });
    return apiError("Job not found", 404);
  }
}
