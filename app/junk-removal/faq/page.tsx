import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { StickyMobileConcierge } from "@/components/public/StickyMobileConcierge";
import { MarketingBreadcrumbs } from "@/components/seo/MarketingBreadcrumbs";
import { FaqAccordion } from "@/components/seo/FaqAccordion";
import { ConversionCtaGroup } from "@/components/seo/ConversionCta";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, faqSchema, webPageSchema } from "@/lib/seo/schema";
import { JUNK_DIVISION_FAQS } from "@/lib/seo/faqs";
import { DIVISION_SEO } from "@/lib/seo/site";

const PATH = "/junk-removal/faq";

const DEMOLITION_FAQ_HUB = [
  {
    q: "Does Morris Service Group LLC demolish any building?",
    a: "No. We evaluate each project and explain what our crew and dump trailers can handle — and when larger equipment or specialty contractors are needed. Estimates are always project-by-project.",
  },
  {
    q: "What demolition-related work do you commonly handle?",
    a: "Residential shed and deck tear-downs, fence removal, remodel debris, small concrete pads, and staged haul-away after larger tear-downs. Larger barns, mobile homes, and heavy structures need careful scoping first.",
  },
  {
    q: "How do I get a demolition estimate?",
    a: "Send photos and access notes through our estimate flow, or call. We respond with what is included, what is excluded, and next steps.",
  },
] as const;

const ALL_FAQS = [...JUNK_DIVISION_FAQS, ...DEMOLITION_FAQ_HUB];

export const metadata: Metadata = buildPageMetadata({
  title: "Junk Removal FAQs | Morris Junk Removal",
  description:
    "Answers about junk removal pricing, photos, access, donation and recycling, and demolition scoping for Warren County and nearby Missouri — Morris Service Group LLC.",
  path: PATH,
  ogImage: DIVISION_SEO.junk_removal.ogImage,
  keywords: [
    "junk removal FAQ",
    "junk removal pricing questions",
    "demolition junk removal Missouri",
    "Morris Junk Removal",
  ],
});

export default function JunkFaqHubPage() {
  const crumbs = [
    { name: "Morris Services", href: "/" },
    { name: "Morris Junk Removal", href: "/junk-removal" },
    { name: "FAQs" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F5F2]">
      <JsonLd
        data={[
          webPageSchema({
            name: "Junk Removal FAQs",
            description:
              "Division-level answers on pricing, preparation, responsible disposal, and demolition scoping for Morris Junk Removal.",
            path: PATH,
          }),
          breadcrumbSchema([
            { name: "Morris Services", path: "/" },
            { name: "Morris Junk Removal", path: "/junk-removal" },
            { name: "FAQs", path: PATH },
          ]),
          faqSchema([...ALL_FAQS]),
        ]}
      />
      <PublicHeader variant="company" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 pb-28 sm:py-12">
        <MarketingBreadcrumbs items={crumbs} />
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-brand-primary">
          Morris Junk Removal
        </p>
        <h1 className="mt-2 font-heading text-4xl font-medium tracking-tight sm:text-5xl">
          Junk Removal FAQs
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted-foreground">
          One place for division-wide answers on estimates, on-site changes, access, and responsible
          disposal — without repeating every service-specific checklist. Service pages may add
          item-level detail; start here for how Morris Junk Removal works.
        </p>
        <ConversionCtaGroup divisionId="junk_removal" className="mt-8" />

        <nav
          className="mt-10 flex flex-wrap gap-2 text-sm"
          aria-label="Related junk removal resources"
        >
          {[
            { href: "/junk-removal/guides", label: "Guides" },
            { href: "/free-scrap-fridays", label: "Free Scrap Fridays" },
            { href: "/pricing", label: "Pricing" },
            { href: "/book?division=junk_removal", label: "Request an estimate" },
            { href: "/junk-removal/demolition", label: "Demolition hub" },
            { href: "/junk-removal/responsible-disposal", label: "Responsible disposal" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full border border-black/10 bg-white px-4 py-2 font-medium text-foreground shadow-sm hover:border-brand-primary/40"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <section className="mt-14">
          <h2 className="font-heading text-2xl font-medium">General junk removal</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Pricing, photos, presence on site, and what we can take across Warren County and nearby
            communities.
          </p>
          <FaqAccordion items={[...JUNK_DIVISION_FAQS]} className="mt-6" />
        </section>

        <section className="mt-14">
          <h2 className="font-heading text-2xl font-medium">Demolition &amp; structure removal</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Honest capacity language for sheds, decks, fences, and haul-away after tear-downs.{" "}
            <Link href="/junk-removal/demolition" className="font-semibold text-brand-primary hover:underline">
              Browse demolition topics →
            </Link>
          </p>
          <FaqAccordion items={[...DEMOLITION_FAQ_HUB]} className="mt-6" />
        </section>
      </main>
      <PublicFooter variant="company" />
      <StickyMobileConcierge divisionId="junk_removal" />
    </div>
  );
}
