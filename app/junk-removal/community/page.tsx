import type { Metadata } from "next";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { StickyMobileConcierge } from "@/components/public/StickyMobileConcierge";
import { MarketingBreadcrumbs } from "@/components/seo/MarketingBreadcrumbs";
import { ConversionCtaGroup } from "@/components/seo/ConversionCta";
import { AuthorityContentCard } from "@/components/authority/AuthorityContentCard";
import { RelatedAuthorityLinks } from "@/components/authority/RelatedAuthorityLinks";
import { listPublishedAuthorityStories } from "@/lib/db/authority-stories";
import {
  COMMUNITY_EVENT_KINDS,
  COMMUNITY_EVENT_LABELS,
  type AuthorityStory,
  type CommunityEventKind,
} from "@/lib/authority/types";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { DIVISION_SEO } from "@/lib/seo/site";
import { SOCIAL_SERVICE_COMMUNITIES, WARRENTON_JUNK_SOCIAL } from "@/lib/social/config";

export const metadata: Metadata = buildPageMetadata({
  title: "Community | Morris Service Group LLC — Warrenton MO",
  description:
    "Community cookouts, cleanups, charity events, food drives, and local partnerships from Morris Service Group LLC — the people behind Warrenton junk removal and @WarrentonJunk.",
  path: "/junk-removal/community",
  ogImage: DIVISION_SEO.junk_removal.ogImage,
  keywords: [
    "Morris Service Group community",
    "Warrenton community events",
    "Warren County business",
    "WarrentonJunk",
  ],
});

export default async function JunkCommunityPage() {
  let events: AuthorityStory[] = [];
  let spotlights: AuthorityStory[] = [];
  try {
    events = await listPublishedAuthorityStories({ surface: "community_event", limit: 24 });
    spotlights = await listPublishedAuthorityStories({
      surface: "community_spotlight",
      limit: 8,
    });
  } catch {
    events = [];
    spotlights = [];
  }

  const byKind = COMMUNITY_EVENT_KINDS.map((kind) => ({
    kind,
    items: events.filter((e) => e.event_kind === kind || (!e.event_kind && kind === "other")),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F5F2]">
      <PublicHeader variant="company" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 pb-28 sm:py-12">
        <MarketingBreadcrumbs
          items={[
            { name: "Morris Services", href: "/" },
            { name: "Morris Junk Removal", href: "/junk-removal" },
            { name: "Community" },
          ]}
        />
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-brand-primary">
          More than trucks
        </p>
        <h1 className="mt-2 font-heading text-4xl font-medium tracking-tight sm:text-5xl">
          Community
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted-foreground">
          {WARRENTON_JUNK_SOCIAL.operator} is a local business family — active in Warrenton and
          nearby towns through cookouts, cleanups, charity drives, partnerships, and everyday
          neighbor support. Junk removal is how we serve properties; community is how we show up.
        </p>
        <ConversionCtaGroup divisionId="junk_removal" className="mt-8" />

        <section className="mt-12 rounded-2xl border border-black/5 bg-white p-5 sm:p-6">
          <h2 className="font-heading text-xl font-medium">Where we show up</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {SOCIAL_SERVICE_COMMUNITIES.join(" · ")}
          </p>
        </section>

        <section className="mt-12">
          <h2 className="font-heading text-2xl font-medium tracking-tight">
            How we get involved
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {(Object.keys(COMMUNITY_EVENT_LABELS) as CommunityEventKind[]).map((kind) => (
              <li
                key={kind}
                className="rounded-xl border border-black/5 bg-white px-4 py-3 text-sm font-medium"
              >
                {COMMUNITY_EVENT_LABELS[kind]}
              </li>
            ))}
          </ul>
        </section>

        {spotlights.length > 0 && (
          <section className="mt-14">
            <h2 className="font-heading text-2xl font-medium tracking-tight">
              Community spotlight
            </h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {spotlights.map((story) => (
                <li key={story.id}>
                  <AuthorityContentCard story={story} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {byKind.length === 0 ? (
          <p className="mt-12 rounded-2xl border border-dashed border-black/10 bg-white/70 p-8 text-sm text-muted-foreground">
            Upcoming community moments will be posted here and on {WARRENTON_JUNK_SOCIAL.handle}.
          </p>
        ) : (
          byKind.map((group) => (
            <section key={group.kind} className="mt-14">
              <h2 className="font-heading text-2xl font-medium tracking-tight">
                {COMMUNITY_EVENT_LABELS[group.kind]}
              </h2>
              <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                {group.items.map((story) => (
                  <li key={story.id}>
                    <AuthorityContentCard story={story} />
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}

        <RelatedAuthorityLinks excludePath="/junk-removal/community" />
      </main>
      <PublicFooter variant="company" />
      <StickyMobileConcierge divisionId="junk_removal" />
    </div>
  );
}
