import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { StickyMobileConcierge } from "@/components/public/StickyMobileConcierge";
import { MarketingBreadcrumbs } from "@/components/seo/MarketingBreadcrumbs";
import { ConversionCtaGroup, RelatedLinks } from "@/components/seo/ConversionCta";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { DIVISION_SEO } from "@/lib/seo/site";

export const metadata: Metadata = buildPageMetadata({
  title: "Junk Removal Resource Center | Morris Junk Removal",
  description:
    "Guides, topics, item acceptance notes, tools, responsible disposal, commercial, and seasonal junk removal resources for Warren County and nearby Missouri.",
  path: "/junk-removal/resources",
  ogImage: DIVISION_SEO.junk_removal.ogImage,
  keywords: [
    "junk removal resources",
    "junk removal guides",
    "responsible disposal",
    "Morris Junk Removal",
  ],
});

const HUBS = [
  {
    href: "/junk-removal/latest",
    label: "Latest jobs",
    body: "Recent local cleanouts and haul-aways — proof we are active every week.",
  },
  {
    href: "/junk-removal/videos",
    label: "Videos",
    body: "YouTube, Shorts, TikToks, Reels, and before-and-after transformations.",
  },
  {
    href: "/junk-removal/gallery",
    label: "Before & after gallery",
    body: "Searchable project photos by city, service, and property type.",
  },
  {
    href: "/junk-removal/community",
    label: "Community",
    body: "Cookouts, cleanups, charity drives, and local partnerships.",
  },
  {
    href: "/junk-removal/guides",
    label: "Guides",
    body: "Pricing, preparation, recycling, cleanout checklists, and what we can take.",
  },
  {
    href: "/junk-removal/topics",
    label: "Topics",
    body: "Furniture, cleanouts, construction, and commercial topic clusters.",
  },
  {
    href: "/junk-removal/items",
    label: "Items",
    body: "Honest acceptance notes for couches, appliances, mattresses, and more.",
  },
  {
    href: "/junk-removal/tools",
    label: "Tools",
    body: "Load-size estimator, can-we-take-this search, and service-area checker.",
  },
  {
    href: "/junk-removal/responsible-disposal",
    label: "Responsible disposal",
    body: "How we evaluate donation, recycling, reuse, and appropriate disposal.",
  },
  {
    href: "/junk-removal/commercial",
    label: "Commercial & property pros",
    body: "Resources for managers, landlords, realtors, HOAs, contractors, and offices.",
  },
  {
    href: "/junk-removal/seasonal",
    label: "Seasonal cleanups",
    body: "Spring, summer, fall, holiday, moving, storm, and estate-season guidance.",
  },
] as const;

export default function JunkResourcesHubPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F7F5F2]">
      <PublicHeader variant="company" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 pb-28 sm:py-12">
        <MarketingBreadcrumbs
          items={[
            { name: "Morris Services", href: "/" },
            { name: "Morris Junk Removal", href: "/junk-removal" },
            { name: "Resources" },
          ]}
        />
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-brand-primary">
          Morris Junk Removal
        </p>
        <h1 className="mt-2 font-heading text-4xl font-medium tracking-tight sm:text-5xl">
          Junk Removal Resource Center
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted-foreground">
          One place for guides, topic hubs, item acceptance notes, planning tools, and seasonal or
          commercial cleanup resources.
        </p>
        <ConversionCtaGroup divisionId="junk_removal" className="mt-8" />

        <ul className="mt-12 grid gap-4 sm:grid-cols-2">
          {HUBS.map((hub) => (
            <li key={hub.href}>
              <Link
                href={hub.href}
                className="block h-full rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition hover:border-brand-primary/30 sm:p-6"
              >
                <p className="font-heading text-xl font-medium text-foreground">{hub.label}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{hub.body}</p>
              </Link>
            </li>
          ))}
        </ul>

        <RelatedLinks
          title="Also useful"
          links={[
            { href: "/junk-removal/services", label: "All junk removal services" },
            { href: "/junk-removal/areas", label: "Service areas" },
            { href: "/junk-removal/gallery", label: "Before & after gallery" },
            { href: "/junk-removal/videos", label: "Watch real jobs" },
            { href: "/pricing", label: "Pricing explained" },
            { href: "/book?division=junk_removal", label: "Request an estimate" },
          ]}
        />
      </main>
      <PublicFooter variant="company" />
      <StickyMobileConcierge divisionId="junk_removal" />
    </div>
  );
}
