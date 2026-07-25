/**
 * Gallery cards render published authority stories (ops photos → authority stories → gallery).
 * No synthetic projects — only what ops publishes with customer permission.
 */

import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button-link";
import type { AuthorityStory } from "@/lib/authority/types";
import { PROPERTY_TYPE_LABELS } from "@/lib/authority/types";
import { buildRelatedAuthorityLinks } from "@/lib/authority/related-links";
import { servicesForDivision } from "@/lib/seo/services";
import { WARRENTON_JUNK_SOCIAL } from "@/lib/social/config";
import { cn } from "@/lib/utils";

const EQUIPMENT_HINTS = [
  "dump trailer",
  "trailer",
  "dolly",
  "winch",
  "hand tools",
  "reciprocating saw",
  "sawzall",
] as const;

function serviceSlugFromCategory(category: string | null): string | undefined {
  if (!category) return undefined;
  const needle = category.toLowerCase();
  return servicesForDivision("junk_removal").find(
    (s) =>
      s.name.toLowerCase() === needle ||
      s.slug.replace(/-/g, " ").includes(needle) ||
      needle.includes(s.slug.replace(/-/g, " "))
  )?.slug;
}

/** Optional equipment line when summary/description mentions gear — no dedicated DB field yet. */
export function deriveEquipmentUsed(story: AuthorityStory): string | null {
  const hay = `${story.summary ?? ""} ${story.description ?? ""}`.toLowerCase();
  const hits = EQUIPMENT_HINTS.filter((term) => hay.includes(term));
  if (!hits.length) return null;
  return hits.map((t) => t.replace(/\b\w/g, (c) => c.toUpperCase())).join(", ");
}

export function ProjectGalleryCard({
  story,
  className,
}: {
  story: AuthorityStory;
  className?: string;
}) {
  const thumb =
    story.thumbnail_url ||
    story.after_image_url ||
    story.before_image_url ||
    story.photo_urls[0] ||
    null;
  const serviceSlug = serviceSlugFromCategory(story.service_category);
  const related = buildRelatedAuthorityLinks({
    serviceSlug,
    limit: 3,
    excludePath: story.internal_path ?? undefined,
  });
  const equipment = deriveEquipmentUsed(story);
  const metaParts = [
    story.service_category,
    story.city,
    story.property_type ? PROPERTY_TYPE_LABELS[story.property_type] : null,
  ].filter(Boolean);

  return (
    <article
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm",
        className
      )}
    >
      {story.before_image_url && story.after_image_url ? (
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
        <div className="relative aspect-[16/9] bg-muted">
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

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {metaParts.length ? (
          <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-primary">
            {metaParts.join(" · ")}
          </p>
        ) : null}
        <h3 className="mt-1.5 text-base font-semibold tracking-tight text-foreground sm:text-lg">
          {story.title}
        </h3>
        {(story.summary || story.description) && (
          <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {story.summary || story.description}
          </p>
        )}
        {equipment ? (
          <p className="mt-2 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground/80">Equipment noted: </span>
            {equipment}
          </p>
        ) : null}

        {related.length ? (
          <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs">
            {related.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="font-medium text-brand-primary hover:underline">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-auto flex flex-col gap-3 pt-4">
          <ButtonLink
            href="/book?division=junk_removal"
            size="sm"
            className="h-10 w-full rounded-full bg-brand-primary text-sm font-semibold sm:w-auto sm:self-start"
          >
            Request a similar estimate
          </ButtonLink>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
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
      </div>
    </article>
  );
}
