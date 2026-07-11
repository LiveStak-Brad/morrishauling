import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { StickyMobileConcierge } from "@/components/public/StickyMobileConcierge";
import { MarketingBreadcrumbs } from "@/components/seo/MarketingBreadcrumbs";
import { ConversionCtaGroup, RelatedLinks } from "@/components/seo/ConversionCta";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, webPageSchema } from "@/lib/seo/schema";
import { SEO_ORG } from "@/lib/seo/site";

const PATH = "/service-area";

export const metadata: Metadata = buildPageMetadata({
  title: "Service Area | Morris Services",
  description:
    "Morris Services covers Warren, Lincoln, St. Charles, Franklin, and Jefferson Counties in Missouri. Call for estimate-based scheduling — by appointment.",
  path: PATH,
  keywords: [
    "Morris Services service area",
    "Warren County",
    "Lincoln County",
    "St. Charles County",
    "Missouri junk removal service area",
  ],
});

export default function ServiceAreaPage() {
  const crumbs = [
    { name: "Morris Services", href: "/" },
    { name: "Service area" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F5F2]">
      <JsonLd
        data={[
          webPageSchema({
            name: "Service Area | Morris Services",
            description:
              "Service coverage across Warren, Lincoln, St. Charles, Franklin, and Jefferson Counties, Missouri.",
            path: PATH,
          }),
          breadcrumbSchema(crumbs.map((c) => ({ name: c.name, path: c.href ?? PATH }))),
        ]}
      />
      <PublicHeader variant="umbrella" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 pb-28 sm:py-12">
        <MarketingBreadcrumbs items={crumbs} />
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-brand-primary">
          Morris Services
        </p>
        <h1 className="mt-2 font-heading text-4xl font-medium tracking-tight sm:text-5xl">
          Service Area
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted-foreground">
          {SEO_ORG.serviceAreaLabel}. We schedule by appointment based on estimates — not walk-in
          storefront hours.
        </p>

        <section className="mt-10 rounded-2xl border border-black/5 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="font-heading text-2xl font-medium">Contact</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Call or text{" "}
            <a
              href={`tel:${SEO_ORG.phoneTel}`}
              className="font-semibold text-brand-primary hover:underline"
            >
              {SEO_ORG.phone}
            </a>{" "}
            or email{" "}
            <a
              href={`mailto:${SEO_ORG.email}`}
              className="font-semibold text-brand-primary hover:underline"
            >
              {SEO_ORG.email}
            </a>
            .
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Hours: by appointment. Availability depends on the estimate, crew schedule, and travel
            within our coverage area. We do not publish fixed walk-in storefront hours because we
            operate as a mobile, estimate-based service.
          </p>
          <ConversionCtaGroup divisionId="junk_removal" className="mt-6" />
        </section>

        <section className="mt-14">
          <h2 className="font-heading text-2xl font-medium">Primary counties</h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {SEO_ORG.primaryCounties.map((county) => (
              <li
                key={county}
                className="rounded-xl border border-black/5 bg-white px-4 py-3 text-sm font-medium text-foreground shadow-sm"
              >
                {county}
              </li>
            ))}
          </ul>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Extended communities nearby may still be reviewable. Travel expectations are disclosed
            before you book. We do not list a public retail storefront address for walk-ins.
          </p>
        </section>

        <RelatedLinks
          title="Explore coverage & book"
          links={[
            { href: "/junk-removal/areas", label: "Junk removal service areas" },
            { href: "/hauling", label: "Morris Hauling" },
            { href: "/junk-removal", label: "Morris Junk Removal" },
            {
              href: "/junk-removal/tools/service-area-checker",
              label: "Service area checker tool",
            },
            { href: "/contact", label: "Contact" },
            { href: "/book", label: "Book / request an estimate" },
          ]}
        />

        <p className="mt-10 text-sm text-muted-foreground">
          Prefer division-specific pages? See{" "}
          <Link href="/junk-removal/areas" className="font-semibold text-brand-primary hover:underline">
            junk removal areas
          </Link>{" "}
          for city and county detail pages.
        </p>
      </main>
      <PublicFooter variant="umbrella" />
      <StickyMobileConcierge />
    </div>
  );
}
