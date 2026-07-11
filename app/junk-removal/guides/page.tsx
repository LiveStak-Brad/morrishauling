import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { StickyMobileConcierge } from "@/components/public/StickyMobileConcierge";
import { MarketingBreadcrumbs } from "@/components/seo/MarketingBreadcrumbs";
import { ConversionCtaGroup } from "@/components/seo/ConversionCta";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { AUTHORITY_GUIDES } from "@/lib/seo/guides";
import { DIVISION_SEO } from "@/lib/seo/site";

export const metadata: Metadata = buildPageMetadata({
  title: "Junk Removal Guides | Morris Junk Removal",
  description:
    "Practical junk removal guides for Warren County and nearby Missouri — pricing, preparation, recycling, cleanouts, and what we can take.",
  path: "/junk-removal/guides",
  ogImage: DIVISION_SEO.junk_removal.ogImage,
  keywords: ["junk removal guides", "junk removal tips Missouri", "Morris Junk Removal"],
});

export default function JunkGuidesIndexPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F7F5F2]">
      <PublicHeader variant="company" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 pb-28 sm:py-12">
        <MarketingBreadcrumbs
          items={[
            { name: "Morris Services", href: "/" },
            { name: "Morris Junk Removal", href: "/junk-removal" },
            { name: "Guides" },
          ]}
        />
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-brand-primary">
          Morris Junk Removal
        </p>
        <h1 className="mt-2 font-heading text-4xl font-medium tracking-tight sm:text-5xl">
          Junk Removal Guides
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted-foreground">
          Straight answers on pricing, preparation, recycling, and cleanouts — written for Warren
          County and nearby Missouri homes and businesses.
        </p>
        <ConversionCtaGroup divisionId="junk_removal" className="mt-8" />

        <ul className="mt-12 grid gap-3 sm:grid-cols-2">
          {AUTHORITY_GUIDES.map((guide) => (
            <li key={guide.slug}>
              <Link
                href={`/junk-removal/guides/${guide.slug}`}
                className="block rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition hover:border-brand-primary/30"
              >
                <p className="font-semibold text-foreground">{guide.h1}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground line-clamp-2">
                  {guide.summary}
                </p>
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-10 text-sm text-muted-foreground">
          Browse the{" "}
          <Link href="/junk-removal/resources" className="font-semibold text-brand-primary hover:underline">
            Resource Center
          </Link>{" "}
          for topics, items, and tools.
        </p>
      </main>
      <PublicFooter variant="company" />
      <StickyMobileConcierge divisionId="junk_removal" />
    </div>
  );
}
