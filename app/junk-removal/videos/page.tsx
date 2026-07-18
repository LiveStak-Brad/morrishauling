import type { Metadata } from "next";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { StickyMobileConcierge } from "@/components/public/StickyMobileConcierge";
import { MarketingBreadcrumbs } from "@/components/seo/MarketingBreadcrumbs";
import { ConversionCtaGroup } from "@/components/seo/ConversionCta";
import { JsonLd } from "@/components/seo/JsonLd";
import { AuthorityContentCard } from "@/components/authority/AuthorityContentCard";
import { RelatedAuthorityLinks } from "@/components/authority/RelatedAuthorityLinks";
import { listPublishedAuthorityStories } from "@/lib/db/authority-stories";
import { videoObjectListSchema } from "@/lib/authority/schema";
import type { AuthoritySurface } from "@/lib/authority/types";
import { AUTHORITY_SURFACE_LABELS } from "@/lib/authority/types";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { DIVISION_SEO } from "@/lib/seo/site";
import { WARRENTON_JUNK_SOCIAL } from "@/lib/social/config";
import { webPageSchema, breadcrumbSchema } from "@/lib/seo/schema";

export const metadata: Metadata = buildPageMetadata({
  title: "Junk Removal Videos | Warrenton & Warren County MO",
  description:
    "Watch real Warrenton junk removal jobs — YouTube videos, Shorts, TikToks, Reels, and before-and-after transformations from Morris Service Group LLC / @WarrentonJunk.",
  path: "/junk-removal/videos",
  ogImage: DIVISION_SEO.junk_removal.ogImage,
  keywords: [
    "Warrenton junk removal videos",
    "junk removal Warren County",
    "before and after junk removal",
    "WarrentonJunk",
  ],
});

const SECTIONS: Array<{ surface: AuthoritySurface; embed?: boolean }> = [
  { surface: "video_hub", embed: true },
  { surface: "latest_video", embed: true },
  { surface: "shorts" },
  { surface: "tiktok" },
  { surface: "reels" },
  { surface: "before_after" },
];

async function loadSurface(surface: AuthoritySurface) {
  try {
    return await listPublishedAuthorityStories({ surface, limit: 8 });
  } catch {
    return [];
  }
}

export default async function JunkVideosPage() {
  const sections = await Promise.all(
    SECTIONS.map(async (s) => ({ ...s, stories: await loadSurface(s.surface) }))
  );
  const forSchema = sections.flatMap((s) => s.stories).filter((s) => s.youtube_id || s.video_url);

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F5F2]">
      <JsonLd
        data={[
          webPageSchema({
            name: "Junk Removal Videos",
            description:
              "Real junk removal jobs on video from Warrenton and Warren County, Missouri.",
            path: "/junk-removal/videos",
          }),
          breadcrumbSchema([
            { name: "Morris Services", path: "/" },
            { name: "Junk Removal", path: "/junk-removal" },
            { name: "Videos", path: "/junk-removal/videos" },
          ]),
          ...videoObjectListSchema(forSchema),
        ]}
      />
      <PublicHeader variant="company" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 pb-28 sm:py-12">
        <MarketingBreadcrumbs
          items={[
            { name: "Morris Services", href: "/" },
            { name: "Morris Junk Removal", href: "/junk-removal" },
            { name: "Videos" },
          ]}
        />
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-brand-primary">
          Watch the work
        </p>
        <h1 className="mt-2 font-heading text-4xl font-medium tracking-tight sm:text-5xl">
          Junk Removal Videos
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted-foreground">
          Real cleanouts, trailer loads, and before-and-afters from Warrenton and surrounding
          Missouri communities. Follow {WARRENTON_JUNK_SOCIAL.handle} — operated by{" "}
          {WARRENTON_JUNK_SOCIAL.operator}.
        </p>
        <ConversionCtaGroup divisionId="junk_removal" className="mt-8" />

        {sections.every((s) => s.stories.length === 0) ? (
          <p className="mt-12 rounded-2xl border border-dashed border-black/10 bg-white/70 p-8 text-sm text-muted-foreground">
            Video stories are being curated. Follow {WARRENTON_JUNK_SOCIAL.handle} for the latest
            jobs while we publish on-site embeds.
          </p>
        ) : (
          sections.map((section) =>
            section.stories.length === 0 ? null : (
              <section key={section.surface} className="mt-14">
                <h2 className="font-heading text-2xl font-medium tracking-tight">
                  {AUTHORITY_SURFACE_LABELS[section.surface]}
                </h2>
                <ul className="mt-6 grid gap-4 sm:grid-cols-2">
                  {section.stories.map((story) => (
                    <li key={story.id}>
                      <AuthorityContentCard
                        story={story}
                        showEmbed={Boolean(section.embed && story.youtube_id)}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            )
          )
        )}

        <RelatedAuthorityLinks excludePath="/junk-removal/videos" />
      </main>
      <PublicFooter variant="company" />
      <StickyMobileConcierge divisionId="junk_removal" />
    </div>
  );
}
