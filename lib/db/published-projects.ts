import { createAdminClient } from "@/lib/supabase/admin";
import type { DivisionId } from "@/lib/divisions";
import type { PublishedProject } from "@/types/equipment";

function rowToProject(r: Record<string, unknown>): PublishedProject {
  return {
    id: String(r.id),
    companyId: String(r.company_id),
    slug: String(r.slug),
    title: String(r.title),
    divisionId: r.division_id as DivisionId,
    serviceSlug: (r.service_slug as string) ?? null,
    city: (r.city as string) ?? null,
    county: (r.county as string) ?? null,
    acreage: r.acreage != null ? Number(r.acreage) : null,
    vegetationType: (r.vegetation_type as string) ?? null,
    equipmentUsed: (r.equipment_used as string) ?? null,
    attachmentUsed: (r.attachment_used as string) ?? null,
    approximateMachineHours:
      r.approximate_machine_hours != null ? Number(r.approximate_machine_hours) : null,
    customerGoal: (r.customer_goal as string) ?? null,
    workCompleted: (r.work_completed as string) ?? null,
    beforeImageUrls: (r.before_image_urls as string[]) ?? [],
    duringImageUrls: (r.during_image_urls as string[]) ?? [],
    afterImageUrls: (r.after_image_urls as string[]) ?? [],
    videoUrls: (r.video_urls as string[]) ?? [],
    testimonial: (r.testimonial as string) ?? null,
    published: Boolean(r.published),
    publishedAt: (r.published_at as string) ?? null,
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

export async function listPublishedProjects(input?: {
  divisionId?: DivisionId;
  serviceSlug?: string;
  limit?: number;
  includeUnpublished?: boolean;
}): Promise<PublishedProject[]> {
  const sb = createAdminClient();
  if (!sb) return [];
  let q = sb.from("published_projects").select("*").order("published_at", { ascending: false });
  if (!input?.includeUnpublished) q = q.eq("published", true);
  if (input?.divisionId) q = q.eq("division_id", input.divisionId);
  if (input?.serviceSlug) q = q.eq("service_slug", input.serviceSlug);
  if (input?.limit) q = q.limit(input.limit);
  const { data, error } = await q;
  if (error || !data) return [];
  return data.map((r) => rowToProject(r as Record<string, unknown>));
}

export async function getPublishedProjectBySlug(slug: string): Promise<PublishedProject | null> {
  const sb = createAdminClient();
  if (!sb) return null;
  const { data, error } = await sb
    .from("published_projects")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  if (error || !data) return null;
  return rowToProject(data as Record<string, unknown>);
}

export async function upsertPublishedProject(
  project: Partial<PublishedProject> & { title: string; slug: string; divisionId: DivisionId; companyId: string }
): Promise<PublishedProject | null> {
  const sb = createAdminClient();
  if (!sb) throw new Error("Database not configured");
  const id = project.id ?? `proj-${Date.now()}`;
  const now = new Date().toISOString();
  const { data, error } = await sb
    .from("published_projects")
    .upsert({
      id,
      company_id: project.companyId,
      slug: project.slug,
      title: project.title,
      division_id: project.divisionId,
      service_slug: project.serviceSlug ?? null,
      city: project.city ?? null,
      county: project.county ?? null,
      acreage: project.acreage ?? null,
      vegetation_type: project.vegetationType ?? null,
      equipment_used: project.equipmentUsed ?? null,
      attachment_used: project.attachmentUsed ?? null,
      approximate_machine_hours: project.approximateMachineHours ?? null,
      customer_goal: project.customerGoal ?? null,
      work_completed: project.workCompleted ?? null,
      before_image_urls: project.beforeImageUrls ?? [],
      during_image_urls: project.duringImageUrls ?? [],
      after_image_urls: project.afterImageUrls ?? [],
      video_urls: project.videoUrls ?? [],
      testimonial: project.testimonial ?? null,
      published: project.published ?? false,
      published_at: project.published ? (project.publishedAt ?? now) : null,
      updated_at: now,
    })
    .select("*")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? rowToProject(data as Record<string, unknown>) : null;
}
