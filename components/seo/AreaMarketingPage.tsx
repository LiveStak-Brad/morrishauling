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
import { breadcrumbSchema, faqSchema, webPageSchema } from "@/lib/seo/schema";

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
            q: `What should I know about junk removal in ${area.name}?`,
            a: `${area.localContext ?? `We serve homes and businesses throughout ${area.name} and nearby communities.`}${
              area.travelNote ? ` ${area.travelNote}` : ""
            } Share photos plus any stairs, gates, parking limits, or long carries so we can plan the pickup accurately.`,
          },
          {
            q: `How is a ${area.name} junk removal estimate prepared?`,
            a: "We review photos, the amount and type of material, and access details before scheduling. If the actual load differs from what was submitted, we explain any price change before loading begins.",
          },
          {
            q: "How should I prepare for the crew?",
            a: "Identify what goes and what stays, clear a safe path when possible, and tell us about stairs, locked gates, or restricted parking. Someone 18 or older should provide access unless another arrangement is confirmed in writing.",
          },
        ]
      : [
          {
            q: `What should I know about hauling in ${area.name}?`,
            a: `${area.localContext ?? `We review hauling requests throughout ${area.name} and nearby communities.`}${
              area.travelNote ? ` ${area.travelNote}` : ""
            } We confirm the route, access, load specifications, and schedule before accepting the move.`,
          },
          {
            q: `What details are needed for a ${area.name} hauling quote?`,
            a: "Provide exact pickup and delivery addresses, equipment or material dimensions, estimated weight, operating condition, and photos. Those details determine trailer fit, securement needs, and whether both stops are safely accessible.",
          },
          {
            q: "When does a hauling request need manual review?",
            a: "Heavy, unusual, oversized, multi-stop, or permit-sensitive loads are not auto-confirmed. We review capacity, securement, route limits, and required equipment, then clearly accept, revise, or decline the request.",
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

        {area.localContext && (
          <section className="mt-14">
            <h2 className="font-heading text-2xl font-medium">Local service considerations</h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              {area.localContext}
            </p>
          </section>
        )}

        <section className="mt-14">
          <h2 className="font-heading text-2xl font-medium">Residential & commercial</h2>
          {area.useCases && (
            <ul className="mt-4 max-w-3xl list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
              {area.useCases.map((useCase) => (
                <li key={useCase}>{useCase}</li>
              ))}
            </ul>
          )}
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

        {division === "junk_removal" && (
          <RelatedLinks
            title="Helpful resources"
            links={[
              { href: "/junk-removal/resources", label: "Resource center" },
              { href: "/junk-removal/responsible-disposal", label: "Responsible disposal" },
              { href: "/junk-removal/tools/can-we-take-this", label: "Can we take this?" },
              { href: "/pricing", label: "Pricing explained" },
              { href: "/book?division=junk_removal", label: "Request estimate" },
            ]}
          />
        )}

        <div className="mt-14">
          <FacebookFollow />
        </div>
      </main>
      <PublicFooter variant={division === "junk_removal" ? "company" : "umbrella"} />
      <StickyMobileConcierge divisionId={division} />
    </div>
  );
}
