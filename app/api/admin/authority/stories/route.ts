import { apiError, apiOk, parseJson } from "@/lib/api/route-utils";
import { requireApiProfile } from "@/lib/api/require-profile";
import { isAdmin } from "@/lib/auth/permissions";
import {
  deleteAuthorityStory,
  listAllAuthorityStories,
  upsertAuthorityStory,
} from "@/lib/db/authority-stories";
import {
  AUTHORITY_DIVISION_TAGS,
  AUTHORITY_SURFACES,
  COMMUNITY_EVENT_KINDS,
  PROPERTY_TYPES,
  type AuthorityDivisionTag,
  type AuthoritySocialLinks,
  type AuthoritySurface,
  type CommunityEventKind,
  type PropertyType,
} from "@/lib/authority/types";

export async function GET() {
  try {
    const profile = await requireApiProfile();
    if (profile instanceof Response) return profile;
    if (!isAdmin(profile)) return apiError("Forbidden", 403);
    const stories = await listAllAuthorityStories();
    return apiOk({ stories });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load stories");
  }
}

export async function POST(request: Request) {
  try {
    const profile = await requireApiProfile();
    if (profile instanceof Response) return profile;
    if (!isAdmin(profile)) return apiError("Forbidden", 403);

    const body = await parseJson<{
      id?: string;
      division_id?: string;
      title?: string;
      description?: string | null;
      summary?: string | null;
      location?: string | null;
      city?: string | null;
      service_category?: string | null;
      property_type?: string | null;
      item_removed?: string | null;
      event_kind?: string | null;
      surfaces?: string[];
      before_image_url?: string | null;
      after_image_url?: string | null;
      photo_urls?: string[];
      video_url?: string | null;
      youtube_id?: string | null;
      thumbnail_url?: string | null;
      internal_path?: string | null;
      social_links?: AuthoritySocialLinks;
      published?: boolean;
      published_at?: string | null;
      display_order?: number;
      featured?: boolean;
    }>(request);

    if (!body.title?.trim()) return apiError("title required", 400);
    const surfaces = (body.surfaces ?? []).filter((s) =>
      (AUTHORITY_SURFACES as readonly string[]).includes(s)
    ) as AuthoritySurface[];
    if (surfaces.length === 0) return apiError("Select at least one surface", 400);

    if (
      body.division_id &&
      !(AUTHORITY_DIVISION_TAGS as readonly string[]).includes(body.division_id)
    ) {
      return apiError("Invalid division_id", 400);
    }
    if (
      body.property_type &&
      !(PROPERTY_TYPES as readonly string[]).includes(body.property_type)
    ) {
      return apiError("Invalid property_type", 400);
    }
    if (
      body.event_kind &&
      !(COMMUNITY_EVENT_KINDS as readonly string[]).includes(body.event_kind)
    ) {
      return apiError("Invalid event_kind", 400);
    }

    const story = await upsertAuthorityStory({
      id: body.id,
      division_id: (body.division_id as AuthorityDivisionTag) || "junk_removal",
      title: body.title.trim(),
      description: body.description,
      summary: body.summary,
      location: body.location,
      city: body.city,
      service_category: body.service_category,
      property_type: (body.property_type as PropertyType | null) ?? null,
      item_removed: body.item_removed,
      event_kind: (body.event_kind as CommunityEventKind | null) ?? null,
      surfaces,
      before_image_url: body.before_image_url,
      after_image_url: body.after_image_url,
      photo_urls: body.photo_urls,
      video_url: body.video_url,
      youtube_id: body.youtube_id,
      thumbnail_url: body.thumbnail_url,
      internal_path: body.internal_path,
      social_links: body.social_links,
      published: Boolean(body.published),
      published_at: body.published_at,
      display_order: Number(body.display_order) || 0,
      featured: Boolean(body.featured),
    });

    return apiOk({ story });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to save story");
  }
}

export async function DELETE(request: Request) {
  try {
    const profile = await requireApiProfile();
    if (profile instanceof Response) return profile;
    if (!isAdmin(profile)) return apiError("Forbidden", 403);
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return apiError("id required", 400);
    await deleteAuthorityStory(id);
    return apiOk({ deleted: true });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to delete");
  }
}
