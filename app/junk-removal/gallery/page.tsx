import type { Metadata } from "next";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { StickyMobileConcierge } from "@/components/public/StickyMobileConcierge";
import { MarketingBreadcrumbs } from "@/components/seo/MarketingBreadcrumbs";
import { ConversionCtaGroup } from "@/components/seo/ConversionCta";
import { GalleryFilterClient } from "@/components/authority/GalleryFilterClient";
import { RelatedAuthorityLinks } from "@/components/authority/RelatedAuthorityLinks";
import { listPublishedAuthorityStories } from "@/lib/db/authority-stories";
import type { AuthorityStory } from "@/lib/authority/types";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { DIVISION_SEO } from "@/lib/seo/site";
import { WARRENTON_JUNK_SOCIAL } from "@/lib/social/config";

export const metadata: Metadata = buildPageMetadata({
  title: "Before & After Junk Removal Gallery | Warrenton MO",
  description:
    "Searchable before-and-after junk removal gallery for Warrenton, Warren County, and nearby Missouri — garage, estate, commercial, and construction cleanouts by Morris Service Group LLC.",
  path: "/junk-removal/gallery",
  ogImage: DIVISION_SEO.junk_removal.ogImage,
  keywords: [
    "junk removal before and after",
    "Warrenton junk removal gallery",
    "garage cleanout photos",
    "estate cleanout Warrenton",
  ],
});

export default async function JunkGalleryPage() {
  let stories: AuthorityStory[] = [];
  try {
    const gallery = await listPublishedAuthorityStories({ surface: "gallery", limit: 48 });
    const beforeAfter = await listPublishedAuthorityStories({
      surface: "before_after",
      limit: 48,
    });
    const map = new Map(gallery.map((s) => [s.id, s]));
    for (const s of beforeAfter) map.set(s.id, s);
    stories = Array.from(map.values());
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
            { name: "Gallery" },
          ]}
        />
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-brand-primary">
          Proof of work
        </p>
        <h1 className="mt-2 font-heading text-4xl font-medium tracking-tight sm:text-5xl">
          Before &amp; After Gallery
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted-foreground">
          Filter real projects by city, service, property type, and items removed. Every featured
          project supports our social brand {WARRENTON_JUNK_SOCIAL.handle} and{" "}
          {WARRENTON_JUNK_SOCIAL.operator}.
        </p>
        <ConversionCtaGroup divisionId="junk_removal" className="mt-8" />

        {stories.length === 0 ? (
          <p className="mt-12 rounded-2xl border border-dashed border-black/10 bg-white/70 p-8 text-sm text-muted-foreground">
            Gallery projects will appear here as we publish permissioned before-and-after photos
            from local jobs.
          </p>
        ) : (
          <GalleryFilterClient stories={stories} />
        )}

        <RelatedAuthorityLinks excludePath="/junk-removal/gallery" />
      </main>
      <PublicFooter variant="company" />
      <StickyMobileConcierge divisionId="junk_removal" />
    </div>
  );
}
