import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { StickyMobileConcierge } from "@/components/public/StickyMobileConcierge";
import { MarketingBreadcrumbs } from "@/components/seo/MarketingBreadcrumbs";
import { MarketingImage } from "@/components/seo/MarketingImage";
import { ConversionCtaGroup } from "@/components/seo/ConversionCta";
import { JsonLd } from "@/components/seo/JsonLd";
import { DEMOLITION_SERVICES } from "@/lib/seo/demolition";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { DIVISION_SEO } from "@/lib/seo/site";
import { breadcrumbSchema, faqSchema, webPageSchema } from "@/lib/seo/schema";

const HUB_DESCRIPTION =
  "Honest demolition and structure-removal scoping from Morris Service Group LLC — sheds, decks, fences, garages, barns, concrete, and more near Warrenton, Missouri. Project-by-project estimates.";

export const metadata: Metadata = buildPageMetadata({
  title: "Demolition & Structure Removal | Warrenton & Warren County MO",
  description: HUB_DESCRIPTION,
  path: "/junk-removal/demolition",
  ogImage: DIVISION_SEO.junk_removal.ogImage,
  keywords: [
    "demolition Warrenton MO",
    "shed demolition Warren County",
    "structure removal Missouri",
    "deck demolition",
    "fence removal",
  ],
});

const hubFaqs = [
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
];

export default function DemolitionHubPage() {
  const crumbs = [
    { name: "Morris Services", href: "/" },
    { name: "Junk Removal", href: "/junk-removal" },
    { name: "Demolition" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F5F2]">
      <JsonLd
        data={[
          webPageSchema({
            name: "Demolition & Structure Removal",
            description: HUB_DESCRIPTION,
            path: "/junk-removal/demolition",
          }),
          breadcrumbSchema([
            { name: "Morris Services", path: "/" },
            { name: "Junk Removal", path: "/junk-removal" },
            { name: "Demolition", path: "/junk-removal/demolition" },
          ]),
          faqSchema(hubFaqs),
        ]}
      />
      <PublicHeader variant="company" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 pb-28 sm:py-12">
        <MarketingBreadcrumbs items={crumbs} />
        <div className="mt-6 grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-primary">
              Morris Junk Removal
            </p>
            <h1 className="mt-2 font-heading text-4xl font-medium tracking-tight sm:text-5xl">
              Demolition & structure removal
            </h1>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              Looking for shed, deck, fence, garage, barn, or interior demolition near Warrenton?
              Morris Service Group LLC provides clear, honest scoping — what we can tear down and
              haul with our crew and trailers, and when a project needs additional planning or
              equipment.
            </p>
            <ConversionCtaGroup divisionId="junk_removal" className="mt-8" />
          </div>
          <div className="lg:col-span-2">
            <MarketingImage imageKey="demolition-hub-hero" priority />
          </div>
        </div>

        <section className="mt-14">
          <h2 className="font-heading text-2xl font-medium">Demolition topics</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {DEMOLITION_SERVICES.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`/junk-removal/demolition/${s.slug}`}
                  className="block rounded-2xl border border-border bg-white p-5 shadow-sm transition hover:border-brand-primary/40"
                >
                  <h3 className="font-semibold text-foreground">{s.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{s.description}</p>
                  <span className="mt-3 inline-block text-sm font-semibold text-brand-primary">
                    Learn more →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-14">
          <h2 className="font-heading text-2xl font-medium">Frequently asked questions</h2>
          <dl className="mt-4 space-y-4">
            {hubFaqs.map((f) => (
              <div key={f.q} className="rounded-xl border bg-white p-4">
                <dt className="font-semibold">{f.q}</dt>
                <dd className="mt-2 text-sm text-muted-foreground">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>
      <PublicFooter variant="company" />
      <StickyMobileConcierge divisionId="junk_removal" />
    </div>
  );
}
