import { SITE_ORIGIN } from "@/lib/seo/site";
import type { AuthorityStory } from "@/lib/authority/types";

export function videoObjectSchema(story: AuthorityStory) {
  if (!story.youtube_id && !story.video_url) return null;
  const contentUrl = story.video_url
    ? story.video_url
    : story.youtube_id
      ? `https://www.youtube.com/watch?v=${story.youtube_id}`
      : undefined;
  const embedUrl = story.youtube_id
    ? `https://www.youtube.com/embed/${story.youtube_id}`
    : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: story.title,
    description: story.summary || story.description || story.title,
    thumbnailUrl: story.thumbnail_url || story.before_image_url || undefined,
    uploadDate: story.published_at || story.created_at,
    contentUrl,
    embedUrl,
    publisher: {
      "@type": "Organization",
      name: "Morris Service Group LLC",
      url: SITE_ORIGIN,
    },
  };
}

export function videoObjectListSchema(stories: AuthorityStory[]) {
  return stories
    .map(videoObjectSchema)
    .filter((s): s is NonNullable<typeof s> => Boolean(s));
}
