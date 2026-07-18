import { apiOk } from "@/lib/api/route-utils";
import { listPublishedSocialPosts } from "@/lib/db/social-posts";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get("limit") || 8) || 8, 24);
    const posts = await listPublishedSocialPosts(limit);
    return apiOk({ posts });
  } catch (e) {
    // Table may not exist until migration runs — degrade gracefully
    return apiOk({ posts: [], warning: e instanceof Error ? e.message : "unavailable" });
  }
}
