import Link from "next/link";
import { AuthorityContentCard } from "@/components/authority/AuthorityContentCard";
import { getSpotlightStory } from "@/lib/db/authority-stories";
import {
  AUTHORITY_SURFACE_LABELS,
  type AuthoritySurface,
} from "@/lib/authority/types";
import { cn } from "@/lib/utils";

/**
 * Reusable spotlight — returns null when no published story exists for the surface.
 * Safe to drop into any marketing page without empty shells.
 */
export async function AuthoritySpotlight({
  surface,
  className,
  heading,
  href,
  showEmbed = false,
}: {
  surface: AuthoritySurface;
  className?: string;
  heading?: string;
  href?: string;
  showEmbed?: boolean;
}) {
  let story = null;
  try {
    story = await getSpotlightStory(surface);
  } catch {
    return null;
  }
  if (!story) return null;

  const title = heading ?? AUTHORITY_SURFACE_LABELS[surface];

  return (
    <section className={cn("mt-10", className)} aria-labelledby={`spotlight-${surface}`}>
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2
          id={`spotlight-${surface}`}
          className="font-heading text-xl font-medium tracking-tight sm:text-2xl"
        >
          {title}
        </h2>
        {href ? (
          <Link
            href={href}
            className="shrink-0 text-sm font-semibold text-brand-primary hover:underline"
          >
            See more →
          </Link>
        ) : null}
      </div>
      <AuthorityContentCard story={story} showEmbed={showEmbed} />
    </section>
  );
}

/** Compact grid of spotlights for home / junk hub. */
export async function AuthoritySpotlightGrid({
  surfaces,
  className,
}: {
  surfaces: AuthoritySurface[];
  className?: string;
}) {
  const results = await Promise.all(
    surfaces.map(async (surface) => {
      try {
        const story = await getSpotlightStory(surface);
        return story ? { surface, story } : null;
      } catch {
        return null;
      }
    })
  );
  const items = results.filter(Boolean) as Array<{
    surface: AuthoritySurface;
    story: NonNullable<Awaited<ReturnType<typeof getSpotlightStory>>>;
  }>;

  if (items.length === 0) return null;

  return (
    <section className={cn("mt-12", className)}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-primary">
        Active locally
      </p>
      <h2 className="mt-2 font-heading text-2xl font-medium tracking-tight sm:text-3xl">
        Real work from Warren County and nearby
      </h2>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ surface, story }) => (
          <li key={story.id}>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {AUTHORITY_SURFACE_LABELS[surface]}
            </p>
            <AuthorityContentCard story={story} compact />
          </li>
        ))}
      </ul>
    </section>
  );
}
