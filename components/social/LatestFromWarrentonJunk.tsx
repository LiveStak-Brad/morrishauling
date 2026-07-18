"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { SocialIcon } from "@/components/social/SocialIcons";
import {
  SOCIAL_CONTENT_KIND_LABELS,
  WARRENTON_JUNK_SOCIAL,
  type SocialContentKind,
  type SocialPlatformId,
} from "@/lib/social/config";
import { trackSocialFollow } from "@/lib/social/track";
import { cn } from "@/lib/utils";

type Post = {
  id: string;
  title: string;
  thumbnail_url: string | null;
  platform: SocialPlatformId;
  description: string | null;
  location: string | null;
  service_type: string | null;
  content_kind: SocialContentKind;
  destination_url: string;
};

export function LatestFromWarrentonJunk({ className }: { className?: string }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/public/social-posts?limit=6")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && Array.isArray(d.posts)) setPosts(d.posts);
      })
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded || posts.length === 0) return null;

  return (
    <section className={cn("mt-12", className)} aria-labelledby="latest-warrentonjunk">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-primary">
        Latest content
      </p>
      <h2
        id="latest-warrentonjunk"
        className="mt-2 font-heading text-2xl font-medium tracking-tight sm:text-3xl"
      >
        Latest From {WARRENTON_JUNK_SOCIAL.handle}
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Hand-picked jobs and tips — not scraped. Operated by {WARRENTON_JUNK_SOCIAL.operator}.
      </p>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <li key={post.id}>
            <a
              href={post.destination_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackSocialFollow({
                  platform: post.platform,
                  surface: "latest_content",
                  eventName: "social_click",
                })
              }
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition hover:border-brand-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            >
              <div className="relative aspect-[16/10] bg-muted">
                {post.thumbnail_url ? (
                  <Image
                    src={post.thumbnail_url}
                    alt=""
                    fill
                    className="object-cover transition group-hover:scale-[1.02]"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <SocialIcon platform={post.platform} className="h-8 w-8 opacity-40" />
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-brand-primary">
                  <SocialIcon platform={post.platform} className="h-3.5 w-3.5" />
                  {SOCIAL_CONTENT_KIND_LABELS[post.content_kind] ?? post.content_kind}
                </div>
                <h3 className="mt-2 text-sm font-semibold leading-snug tracking-tight">
                  {post.title}
                </h3>
                {post.description ? (
                  <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {post.description}
                  </p>
                ) : null}
                {post.location ? (
                  <p className="mt-auto pt-3 text-[11px] text-muted-foreground">{post.location}</p>
                ) : null}
              </div>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
