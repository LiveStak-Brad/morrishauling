import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { StickyMobileConcierge } from "@/components/public/StickyMobileConcierge";
import { MarketingBreadcrumbs } from "@/components/seo/MarketingBreadcrumbs";
import { ConversionCtaGroup } from "@/components/seo/ConversionCta";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { TOPIC_CLUSTERS } from "@/lib/seo/topics";
import { DIVISION_SEO } from "@/lib/seo/site";

export const metadata: Metadata = buildPageMetadata({
  title: "Junk Removal Topics | Morris Junk Removal",
  description:
    "Topic hubs for furniture, cleanouts, construction debris, and commercial junk removal across Warren County and nearby Missouri.",
  path: "/junk-removal/topics",
  ogImage: DIVISION_SEO.junk_removal.ogImage,
  keywords: ["junk removal topics", "furniture removal", "estate cleanout", "commercial junk removal"],
});

export default function JunkTopicsIndexPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F7F5F2]">
      <PublicHeader variant="company" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 pb-28 sm:py-12">
        <MarketingBreadcrumbs
          items={[
            { name: "Morris Services", href: "/" },
            { name: "Morris Junk Removal", href: "/junk-removal" },
            { name: "Topics" },
          ]}
        />
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-brand-primary">
          Morris Junk Removal
        </p>
        <h1 className="mt-2 font-heading text-4xl font-medium tracking-tight sm:text-5xl">
          Junk Removal Topics
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted-foreground">
          Cluster hubs that group related services, items, and guides so you can find the right
          starting point faster.
        </p>
        <ConversionCtaGroup divisionId="junk_removal" className="mt-8" />

        <ul className="mt-12 grid gap-3 sm:grid-cols-2">
          {TOPIC_CLUSTERS.map((topic) => (
            <li key={topic.slug}>
              <Link
                href={`/junk-removal/topics/${topic.slug}`}
                className="block rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition hover:border-brand-primary/30"
              >
                <p className="font-semibold text-foreground">{topic.name}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground line-clamp-3">
                  {topic.summary}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <PublicFooter variant="company" />
      <StickyMobileConcierge divisionId="junk_removal" />
    </div>
  );
}
