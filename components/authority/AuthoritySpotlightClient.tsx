"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AuthorityContentCard } from "@/components/authority/AuthorityContentCard";
import { AUTHORITY_SURFACE_LABELS } from "@/lib/authority/types";
import type { AuthorityStory, AuthoritySurface } from "@/lib/authority/types";
import { cn } from "@/lib/utils";

export function AuthoritySpotlightClient({
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
  const [story, setStory] = useState<AuthorityStory | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/public/authority-stories?surface=${surface}&featured=1&limit=1`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const first = d.stories?.[0] as AuthorityStory | undefined;
        if (first) {
          setStory(first);
          return;
        }
        return fetch(`/api/public/authority-stories?surface=${surface}&limit=1`)
          .then((r) => r.json())
          .then((d2) => {
            if (!cancelled) setStory(d2.stories?.[0] ?? null);
          });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [surface]);

  if (!story) return null;

  return (
    <section className={cn("mt-10", className)} aria-labelledby={`c-spotlight-${surface}`}>
      <div className="mb-3 flex items-end justify-between gap-3">
        <h2
          id={`c-spotlight-${surface}`}
          className="font-heading text-xl font-medium tracking-tight sm:text-2xl"
        >
          {heading ?? AUTHORITY_SURFACE_LABELS[surface]}
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

export function AuthoritySpotlightGridClient({
  surfaces,
  className,
}: {
  surfaces: AuthoritySurface[];
  className?: string;
}) {
  const [items, setItems] = useState<Array<{ surface: AuthoritySurface; story: AuthorityStory }>>(
    []
  );

  const surfacesKey = surfaces.join(",");

  useEffect(() => {
    let cancelled = false;
    const list = surfacesKey.split(",").filter(Boolean) as AuthoritySurface[];
    Promise.all(
      list.map(async (surface) => {
        const res = await fetch(
          `/api/public/authority-stories?surface=${surface}&limit=1`
        ).then((r) => r.json());
        const story = res.stories?.[0] as AuthorityStory | undefined;
        return story ? { surface, story } : null;
      })
    ).then((rows) => {
      if (!cancelled) {
        setItems(rows.filter(Boolean) as Array<{ surface: AuthoritySurface; story: AuthorityStory }>);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [surfacesKey]);

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
          <li key={`${surface}-${story.id}`}>
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
