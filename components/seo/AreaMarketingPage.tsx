import Link from "next/link";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { StickyMobileConcierge } from "@/components/public/StickyMobileConcierge";
import { MarketingBreadcrumbs } from "@/components/seo/MarketingBreadcrumbs";
import { FaqAccordion } from "@/components/seo/FaqAccordion";
import { ConversionCtaGroup, RelatedLinks } from "@/components/seo/ConversionCta";
import { FacebookFollow } from "@/components/seo/FacebookFollow";
import { JsonLd } from "@/components/seo/JsonLd";
import type { ServiceArea } from "@/lib/seo/locations";
import { areasForDivision } from "@/lib/seo/locations";
import { servicesForDivision } from "@/lib/seo/services";
import { DIVISION_SEO } from "@/lib/seo/site";
import { breadcrumbSchema, faqSchema, localBusinessSchema, webPageSchema } from "@/lib/seo/schema";

export function AreaMarketingPage({
  area,
  division,
}: {
  area: ServiceArea;
  division: "junk_removal" | "hauling";
}) {
  const d = DIVISION_SEO[division];
  const blurb = division === "junk_removal" ? area.junkBlurb : area.haulingBlurb;
  const services = servicesForDivision(division).slice(0, 8);
  const nearbyAreas = areasForDivision(division)
    .filter((a) => a.slug !== area.slug && (a.county === area.county || area.nearby.includes(a.name)))
    .slice(0, 6);

  const faqs =
    division === "junk_removal"
      ? [
          {
            q: `Do you serve ${area.name} for junk removal?`,
            a: `Yes. ${blurb}`,
          },
          {
            q: "Is the online estimate final?",
            a: "Online amounts are estimates based on what you show us. If the on-site scope differs, we review changes with you before continuing.",
          },
          {
            q: "Do I need to be present?",
            a: "Someone 18+ should be available for access unless we arrange otherwise in writing.",
          },
        ]
      : [
          {
            q: `Do you haul equipment in ${area.name}?`,
            a: `Yes when the load and schedule fit. ${blurb}`,
          },
          {
            q: "Why do you need weight and dimensions?",
            a: "Capacity and securement depend on accurate specs. Guessing creates unsafe or impossible jobs.",
          },
          {
            q: "What if my load needs manual review?",
            a: "We pause confirmation until a person reviews weight, dimensions, permits, and equipment fit — then we accept or decline clearly.",
          },
        ];

  const crumbs = [
    { name: "Morris Services", href: "/" },
    { name: d.name, href: d.path },
    { name: "Service areas", href: `${d.path}/areas` },
    { name: area.name },
  ];

  const path = `${d.path}/areas/${area.slug}`;

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F5F2]">
      <JsonLd
        data={[
          localBusinessSchema(division),
          webPageSchema({
            name: `${division === "junk_removal" ? "Junk Removal" : "Hauling"} in ${area.name}, MO`,
            description: blurb,
            path,
          }),
          breadcrumbSchema(
            crumbs.map((c) => ({ name: c.name, path: c.href ?? path }))
          ),
          faqSchema(faqs),
        ]}
      />
      <PublicHeader variant={division === "junk_removal" ? "company" : "umbrella"} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 pb-28 sm:py-12">
        <MarketingBreadcrumbs items={crumbs} />
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-brand-primary">
          {area.kind === "county" ? "County service area" : "City service area"} · {area.county}
        </p>
        <h1 className="mt-2 font-heading text-4xl font-medium tracking-tight sm:text-5xl">
          {division === "junk_removal" ? "Junk Removal" : "Hauling"} in {area.name}, MO
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted-foreground">{blurb}</p>
        {area.travelNote && (
          <p className="mt-3 max-w-3xl rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-950">
            {area.travelNote}
          </p>
        )}
        <ConversionCtaGroup divisionId={division} className="mt-8" />

        <section className="mt-14">
          <h2 className="font-heading text-2xl font-medium">Residential & commercial</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            {division === "junk_removal"
              ? `In ${area.name} we help homeowners, landlords, and local businesses clear furniture, appliances, garages, estates, and property debris. Upload photos so the estimate matches the real job.`
              : `In ${area.name} we support contractors and property owners with equipment moves, material delivery, and local transport — when weight, dimensions, and access fit our capacity.`}
          </p>
        </section>

        <section className="mt-14">
          <h2 className="font-heading text-2xl font-medium">Nearby communities</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We also commonly serve: {area.nearby.join(", ")}.
          </p>
        </section>

        <section className="mt-14">
          <h2 className="font-heading text-2xl font-medium">Popular services</h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {services.map((s) => (
              <li key={s.slug}>
                <Link
                  href={`${d.path}/services/${s.slug}`}
                  className="text-sm font-medium text-brand-primary hover:underline"
                >
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-14">
          <h2 className="font-heading text-2xl font-medium">FAQ — {area.name}</h2>
          <FaqAccordion items={faqs} className="mt-4" />
        </section>

        {nearbyAreas.length > 0 && (
          <RelatedLinks
            title="Nearby service areas"
            links={nearbyAreas.map((a) => ({
              href: `${d.path}/areas/${a.slug}`,
              label: `${division === "junk_removal" ? "Junk Removal" : "Hauling"} in ${a.name}`,
            }))}
          />
        )}

        <div className="mt-14">
          <FacebookFollow />
        </div>
      </main>
      <PublicFooter variant={division === "junk_removal" ? "company" : "umbrella"} />
      <StickyMobileConcierge />
    </div>
  );
}
