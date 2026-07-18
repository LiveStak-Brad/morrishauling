import type { Metadata } from "next";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { StickyMobileConcierge } from "@/components/public/StickyMobileConcierge";
import { MarketingBreadcrumbs } from "@/components/seo/MarketingBreadcrumbs";
import { ConversionCtaGroup } from "@/components/seo/ConversionCta";
import { AuthorityContentCard } from "@/components/authority/AuthorityContentCard";
import { RelatedAuthorityLinks } from "@/components/authority/RelatedAuthorityLinks";
import { listPublishedAuthorityStories } from "@/lib/db/authority-stories";
import type { AuthorityStory } from "@/lib/authority/types";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { DIVISION_SEO } from "@/lib/seo/site";
import { WARRENTON_JUNK_SOCIAL } from "@/lib/social/config";

export const metadata: Metadata = buildPageMetadata({
  title: "Latest Junk Removal Jobs | Warrenton & Warren County",
  description:
    "See recent junk removal jobs from Warrenton and nearby Missouri communities — garage cleanouts, estate clearances, furniture and appliance removals from Morris Service Group LLC / @WarrentonJunk.",
  path: "/junk-removal/latest",
  ogImage: DIVISION_SEO.junk_removal.ogImage,
  keywords: [
    "latest junk removal jobs",
    "Warrenton junk removal",
    "Warren County cleanouts",
    "WarrentonJunk",
  ],
});

export default async function JunkLatestJobsPage() {
  let stories: AuthorityStory[] = [];
  try {
    stories = await listPublishedAuthorityStories({ surface: "latest_jobs", limit: 24 });
    if (stories.length === 0) {
      stories = await listPublishedAuthorityStories({ surface: "featured_job", limit: 24 });
    }
  } catch {
    stories = [];
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F5F2]">
      <PublicHeader variant="company" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 pb-28 sm:py-12">
        <MarketingBreadcrumbs
          items={[
            { name: "Morris Services", href: "/" },
            { name: "Morris Junk Removal", href: "/junk-removal" },
            { name: "Latest jobs" },
          ]}
        />
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-brand-primary">
          Always working
        </p>
        <h1 className="mt-2 font-heading text-4xl font-medium tracking-tight sm:text-5xl">
          Latest Junk Removal Jobs
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted-foreground">
          A living feed of real local work. Follow along on the website and on{" "}
          {WARRENTON_JUNK_SOCIAL.handle} — operated by {WARRENTON_JUNK_SOCIAL.operator}.
        </p>
        <ConversionCtaGroup divisionId="junk_removal" className="mt-8" />

        {stories.length === 0 ? (
          <p className="mt-12 rounded-2xl border border-dashed border-black/10 bg-white/70 p-8 text-sm text-muted-foreground">
            Latest job stories will appear here as we publish completed projects. In the meantime,
            follow {WARRENTON_JUNK_SOCIAL.handle} for daily updates.
          </p>
        ) : (
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stories.map((story) => (
              <li key={story.id}>
                <AuthorityContentCard story={story} />
              </li>
            ))}
          </ul>
        )}

        <RelatedAuthorityLinks excludePath="/junk-removal/latest" />
      </main>
      <PublicFooter variant="company" />
      <StickyMobileConcierge divisionId="junk_removal" />
    </div>
  );
}
