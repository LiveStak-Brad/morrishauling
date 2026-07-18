import Image from "next/image";
import Link from "next/link";
import { VideoEmbedSlot } from "@/components/seo/VideoEmbedSlot";
import type { AuthorityStory } from "@/lib/authority/types";
import { PROPERTY_TYPE_LABELS } from "@/lib/authority/types";
import { WARRENTON_JUNK_SOCIAL } from "@/lib/social/config";
import { cn } from "@/lib/utils";

export function AuthorityContentCard({
  story,
  className,
  showEmbed = false,
  compact = false,
}: {
  story: AuthorityStory;
  className?: string;
  showEmbed?: boolean;
  compact?: boolean;
}) {
  const thumb =
    story.thumbnail_url ||
    story.after_image_url ||
    story.before_image_url ||
    story.photo_urls[0] ||
    null;
  const href = story.internal_path || story.video_url || story.social_links.youtube || null;
  const meta = [
    story.city,
    story.service_category,
    story.property_type ? PROPERTY_TYPE_LABELS[story.property_type] : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm",
        className
      )}
    >
      {showEmbed && story.youtube_id ? (
        <VideoEmbedSlot youtubeId={story.youtube_id} title={story.title} />
      ) : story.before_image_url && story.after_image_url ? (
        <div className="grid grid-cols-2 gap-px bg-black/5">
          <div className="relative aspect-square bg-muted">
            <Image
              src={story.before_image_url}
              alt={`Before — ${story.title}`}
              fill
              className="object-cover"
              sizes="200px"
              unoptimized
            />
            <span className="absolute left-2 top-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white">
              Before
            </span>
          </div>
          <div className="relative aspect-square bg-muted">
            <Image
              src={story.after_image_url}
              alt={`After — ${story.title}`}
              fill
              className="object-cover"
              sizes="200px"
              unoptimized
            />
            <span className="absolute left-2 top-2 rounded bg-brand-primary px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white">
              After
            </span>
          </div>
        </div>
      ) : thumb ? (
        <div className={cn("relative bg-muted", compact ? "aspect-[16/10]" : "aspect-[16/9]")}>
          <Image
            src={thumb}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
            unoptimized
          />
        </div>
      ) : null}

      <div className={cn("flex flex-1 flex-col", compact ? "p-3.5" : "p-4 sm:p-5")}>
        {meta ? (
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-primary">
            {meta}
          </p>
        ) : null}
        <h3
          className={cn(
            "font-semibold tracking-tight text-foreground",
            compact ? "mt-1 text-sm" : "mt-1.5 text-base sm:text-lg"
          )}
        >
          {href ? (
            <Link href={href} className="hover:text-brand-primary hover:underline">
              {story.title}
            </Link>
          ) : (
            story.title
          )}
        </h3>
        {(story.summary || story.description) && (
          <p
            className={cn(
              "mt-1.5 text-muted-foreground",
              compact ? "line-clamp-2 text-xs" : "line-clamp-3 text-sm leading-relaxed"
            )}
          >
            {story.summary || story.description}
          </p>
        )}
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-3 text-xs text-muted-foreground">
          {story.published_at ? (
            <time dateTime={story.published_at}>
              {new Date(story.published_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </time>
          ) : null}
          {story.location ? <span>{story.location}</span> : null}
          <span>via {WARRENTON_JUNK_SOCIAL.handle}</span>
        </div>
      </div>
    </article>
  );
}
