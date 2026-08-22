import { apiError, apiOk, parseJson } from "@/lib/api/route-utils";
import { requireApiProfile } from "@/lib/api/require-profile";
import { isAdmin } from "@/lib/auth/permissions";
import { MORRIS_COMPANY_ID } from "@/lib/morris-config";
import { listPublishedProjects, upsertPublishedProject } from "@/lib/db/published-projects";
import type { DivisionId } from "@/lib/divisions";
import { parseDivisionId } from "@/lib/divisions";

export async function GET() {
  try {
    const profile = await requireApiProfile();
    if (profile instanceof Response) return profile;
    if (!isAdmin(profile) && profile.role !== "planner") return apiError("Forbidden", 403);
    const projects = await listPublishedProjects({ includeUnpublished: true });
    return apiOk({ projects });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load projects");
  }
}

export async function POST(request: Request) {
  try {
    const profile = await requireApiProfile();
    if (profile instanceof Response) return profile;
    if (!isAdmin(profile)) return apiError("Forbidden", 403);

    const body = await parseJson<{
      id?: string;
      title: string;
      slug: string;
      divisionId: DivisionId;
      serviceSlug?: string;
      city?: string;
      county?: string;
      acreage?: number;
      vegetationType?: string;
      equipmentUsed?: string;
      attachmentUsed?: string;
      approximateMachineHours?: number;
      customerGoal?: string;
      workCompleted?: string;
      testimonial?: string;
      published?: boolean;
    }>(request);

    if (!body.title?.trim() || !body.slug?.trim()) {
      return apiError("title and slug required", 400);
    }

    const project = await upsertPublishedProject({
      ...body,
      companyId: MORRIS_COMPANY_ID,
      divisionId: parseDivisionId(body.divisionId, "land_clearing"),
      title: body.title.trim(),
      slug: body.slug.trim(),
    });
    return apiOk({ project });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to save project");
  }
}
