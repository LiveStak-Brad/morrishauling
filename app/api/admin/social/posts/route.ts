import { apiError, apiOk, parseJson } from "@/lib/api/route-utils";
import { requireApiProfile } from "@/lib/api/require-profile";
import { isAdmin } from "@/lib/auth/permissions";
import {
  deleteSocialPost,
  listAllSocialPosts,
  upsertSocialPost,
} from "@/lib/db/social-posts";
import {
  SOCIAL_CONTENT_KINDS,
  SOCIAL_PLATFORMS,
  type SocialContentKind,
  type SocialPlatformId,
} from "@/lib/social/config";

export async function GET() {
  try {
    const profile = await requireApiProfile();
    if (profile instanceof Response) return profile;
    if (!isAdmin(profile)) return apiError("Forbidden", 403);
    const posts = await listAllSocialPosts();
    return apiOk({ posts });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to load posts");
  }
}

export async function POST(request: Request) {
  try {
    const profile = await requireApiProfile();
    if (profile instanceof Response) return profile;
    if (!isAdmin(profile)) return apiError("Forbidden", 403);

    const body = await parseJson<{
      id?: string;
      title?: string;
      thumbnail_url?: string | null;
      platform?: string;
      description?: string | null;
      location?: string | null;
      service_type?: string | null;
      content_kind?: string;
      destination_url?: string;
      published?: boolean;
      display_order?: number;
    }>(request);

    if (!body.title?.trim()) return apiError("title required", 400);
    if (!body.destination_url?.trim()) return apiError("destination_url required", 400);
    if (!SOCIAL_PLATFORMS.some((p) => p.id === body.platform)) {
      return apiError("Invalid platform", 400);
    }
    if (!SOCIAL_CONTENT_KINDS.includes(body.content_kind as SocialContentKind)) {
      return apiError("Invalid content_kind", 400);
    }

    const post = await upsertSocialPost({
      id: body.id,
      title: body.title.trim(),
      thumbnail_url: body.thumbnail_url,
      platform: body.platform as SocialPlatformId,
      description: body.description,
      location: body.location,
      service_type: body.service_type,
      content_kind: body.content_kind as SocialContentKind,
      destination_url: body.destination_url.trim(),
      published: Boolean(body.published),
      display_order: Number(body.display_order) || 0,
    });
    return apiOk({ post });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to save post");
  }
}

export async function DELETE(request: Request) {
  try {
    const profile = await requireApiProfile();
    if (profile instanceof Response) return profile;
    if (!isAdmin(profile)) return apiError("Forbidden", 403);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return apiError("id required", 400);
    await deleteSocialPost(id);
    return apiOk({ deleted: true });
  } catch (e) {
    return apiError(e instanceof Error ? e.message : "Failed to delete post");
  }
}
