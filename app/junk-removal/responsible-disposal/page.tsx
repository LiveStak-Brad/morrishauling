import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { StickyMobileConcierge } from "@/components/public/StickyMobileConcierge";
import { MarketingBreadcrumbs } from "@/components/seo/MarketingBreadcrumbs";
import { FaqAccordion } from "@/components/seo/FaqAccordion";
import { ConversionCtaGroup, RelatedLinks } from "@/components/seo/ConversionCta";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, faqSchema, serviceSchema, webPageSchema } from "@/lib/seo/schema";
import { DIVISION_SEO } from "@/lib/seo/site";
import {
  HOW_MATERIALS_ARE_EVALUATED,
  MAY_BE_DONATED,
  MAY_BE_RECYCLED,
  MAY_REQUIRE_DISPOSAL,
  RESPONSIBLE_DISPOSAL_FAQS,
  RESPONSIBLE_DISPOSAL_PRINCIPLE,
  RESPONSIBLE_DISPOSAL_SUMMARY,
} from "@/lib/seo/responsible-disposal";
import { servicesForDivision } from "@/lib/seo/services";

const PATH = "/junk-removal/responsible-disposal";

export const metadata: Metadata = buildPageMetadata({
  title: "Responsible Disposal & Recycling | Morris Junk Removal",
  description:
    "How Morris Junk Removal evaluates materials for donation, recycling, reuse, and appropriate disposal in Warren County and nearby Missouri communities.",
  path: PATH,
  ogImage: DIVISION_SEO.junk_removal.ogImage,
  keywords: [
    "responsible junk removal",
    "junk removal recycling",
    "appliance recycling",
    "furniture donation and removal",
    "construction debris recycling",
    "eco-conscious junk removal",
    "Morris Junk Removal",
    "Missouri",
  ],
});

export default function ResponsibleDisposalPage() {
  const junkServices = servicesForDivision("junk_removal").slice(0, 8);
  const crumbs = [
    { name: "Morris Services", href: "/" },
    { name: "Morris Junk Removal", href: "/junk-removal" },
    { name: "Responsible disposal" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F5F2]">
      <JsonLd
        data={[
          webPageSchema({
            name: "Responsible Disposal & Recycling",
            description: RESPONSIBLE_DISPOSAL_SUMMARY,
            path: PATH,
          }),
          serviceSchema({
            name: "Responsible Junk Removal Disposal & Recycling",
            description: RESPONSIBLE_DISPOSAL_SUMMARY,
            path: PATH,
            division: "junk_removal",
          }),
          breadcrumbSchema(
            crumbs.map((c) => ({ name: c.name, path: c.href ?? PATH }))
          ),
          faqSchema([...RESPONSIBLE_DISPOSAL_FAQS]),
        ]}
      />
      <PublicHeader variant="company" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 pb-28 sm:py-12">
        <MarketingBreadcrumbs items={crumbs} />
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-brand-primary">
          Morris Junk Removal
        </p>
        <h1 className="mt-2 font-heading text-4xl font-medium tracking-tight sm:text-5xl">
          Responsible Disposal & Recycling
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted-foreground">
          {RESPONSIBLE_DISPOSAL_PRINCIPLE}
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {RESPONSIBLE_DISPOSAL_SUMMARY}
        </p>
        <ConversionCtaGroup divisionId="junk_removal" className="mt-8" />

        <section className="mt-14">
          <h2 className="font-heading text-2xl font-medium">How materials are evaluated</h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { step: "01", title: "Evaluate", body: "Condition, contamination, and material type." },
              { step: "02", title: "Sort", body: "Donation, reuse, and recycling candidates when practical." },
              { step: "03", title: "Route", body: "Specialty items to appropriate facilities when available." },
              { step: "04", title: "Dispose", body: "Remaining material to suitable licensed options." },
            ].map((item) => (
              <li
                key={item.step}
                className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm"
              >
                <span className="font-mono text-xs font-semibold text-brand-primary">{item.step}</span>
                <h3 className="mt-2 font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
              </li>
            ))}
          </ol>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {HOW_MATERIALS_ARE_EVALUATED.map((item) => (
              <li
                key={item.title}
                className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm"
              >
                <h3 className="font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-14 grid gap-8 md:grid-cols-3">
          <div>
            <h2 className="font-heading text-xl font-medium">What may be recycled</h2>
            <p className="mt-2 text-xs text-muted-foreground">
              Acceptance varies by facility. This is not a guarantee for every job.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {MAY_BE_RECYCLED.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-heading text-xl font-medium">What may be donated or reused</h2>
            <p className="mt-2 text-xs text-muted-foreground">
              Donation depends on condition, demand, facility rules, and available receiving
              organizations.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {MAY_BE_DONATED.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-heading text-xl font-medium">What may require disposal</h2>
            <p className="mt-2 text-xs text-muted-foreground">
              Some material cannot be recycled or donated. We stay transparent about that.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {MAY_REQUIRE_DISPOSAL.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-14 rounded-2xl border border-black/5 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="font-heading text-2xl font-medium">How we select facilities</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Morris uses material categories and licensed disposal partners to recommend appropriate
            facilities for each load. Specialty items (freon appliances, electronics, tires,
            batteries, and certain construction materials) may need different receivers than general
            household junk. Private operating details stay internal — customers see responsible
            handling outcomes, not facility routing playbooks.
          </p>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            You can help by identifying reusable items, electronics, appliances, batteries, tires,
            paint, chemicals, refrigerant appliances, and whether construction or yard waste is
            separated from household junk when you request an estimate.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/book?division=junk_removal"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-brand-primary px-5 text-sm font-semibold text-white hover:bg-brand-primary/90"
            >
              Request a Junk Removal Estimate
            </Link>
            <Link
              href="/contact"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-white px-5 text-sm font-semibold text-foreground hover:bg-muted/40"
            >
              Tell Us What You Need Removed
            </Link>
          </div>
        </section>

        <section className="mt-14">
          <h2 className="font-heading text-2xl font-medium">Frequently asked questions</h2>
          <FaqAccordion items={[...RESPONSIBLE_DISPOSAL_FAQS]} className="mt-4" />
        </section>

        <RelatedLinks
          title="Related junk removal services"
          links={junkServices.map((s) => ({
            href: `/junk-removal/services/${s.slug}`,
            label: s.name,
          }))}
        />

      </main>
      <PublicFooter variant="company" />
      <StickyMobileConcierge divisionId="junk_removal" />
    </div>
  );
}
