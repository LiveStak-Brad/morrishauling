import Link from "next/link";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { StickyMobileConcierge } from "@/components/public/StickyMobileConcierge";
import { MarketingBreadcrumbs } from "@/components/seo/MarketingBreadcrumbs";
import { MarketingImage } from "@/components/seo/MarketingImage";
import { FaqAccordion } from "@/components/seo/FaqAccordion";
import { ConversionCtaGroup, RelatedLinks } from "@/components/seo/ConversionCta";
import { JsonLd } from "@/components/seo/JsonLd";
import type { DemolitionService } from "@/lib/seo/demolition";
import { getDemolitionService, DEMOLITION_SERVICES } from "@/lib/seo/demolition";
import { getService } from "@/lib/seo/services";
import { breadcrumbSchema, faqSchema, serviceSchema } from "@/lib/seo/schema";

export function DemolitionMarketingPage({ service }: { service: DemolitionService }) {
  const path = `/junk-removal/demolition/${service.slug}`;
  const crumbs = [
    { name: "Morris Services", href: "/" },
    { name: "Junk Removal", href: "/junk-removal" },
    { name: "Demolition", href: "/junk-removal/demolition" },
    { name: service.name },
  ];

  const relatedDemo = service.relatedDemolition
    .map((slug) => getDemolitionService(slug))
    .filter(Boolean) as DemolitionService[];
  const relatedJunk = service.relatedServices
    .map((slug) => getService("junk_removal", slug))
    .filter(Boolean);

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F5F2]">
      <JsonLd
        data={[
          serviceSchema({
            name: service.name,
            description: service.description,
            path,
            division: "junk_removal",
          }),
          breadcrumbSchema(
            crumbs.map((c) => ({ name: c.name, path: c.href ?? path }))
          ),
          faqSchema(service.faqs),
        ]}
      />
      <PublicHeader variant="company" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 pb-28 sm:py-12">
        <MarketingBreadcrumbs items={crumbs} />
        <div className="mt-6 grid gap-8 lg:grid-cols-5 lg:items-start">
          <div className="lg:col-span-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-primary">
              Demolition & structure removal
            </p>
            <h1 className="mt-2 font-heading text-4xl font-medium tracking-tight text-foreground sm:text-5xl">
              {service.name}
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{service.overview}</p>
            <ConversionCtaGroup divisionId="junk_removal" className="mt-8" />
            <p className="mt-4 text-sm text-muted-foreground">
              Estimates are project-by-project. We explain what Morris Service Group LLC can handle
              with our crew and trailers — and when a larger plan is needed.
            </p>
          </div>
          <div className="lg:col-span-2">
            <MarketingImage imageKey={service.imageKey} priority sizes="(max-width: 1024px) 90vw, 420px" />
          </div>
        </div>

        <section className="mt-14 rounded-2xl border border-amber-200/80 bg-amber-50/50 p-6">
          <h2 className="font-heading text-2xl font-medium">Honest scoping</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            We build topical authority around demolition so customers can find clear local answers.
            We do not advertise work we cannot evaluate or perform. Every job is confirmed in writing
            before we schedule.
          </p>
        </section>

        <section className="mt-14 grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="font-heading text-2xl font-medium">What we currently evaluate & handle</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {service.currentlyOffers.map((x) => (
                <li key={x}>• {x}</li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-heading text-2xl font-medium">Equipment we use</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {service.equipment.map((x) => (
                <li key={x}>• {x}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-14">
          <h2 className="font-heading text-2xl font-medium">
            When larger projects need more planning
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {service.whenLargerScope.map((x) => (
              <li key={x}>• {x}</li>
            ))}
          </ul>
        </section>

        <section className="mt-14">
          <h2 className="font-heading text-2xl font-medium">How it works</h2>
          <ol className="mt-4 grid gap-3 sm:grid-cols-3">
            {service.process.map((step, i) => (
              <li key={step} className="rounded-2xl border border-border bg-white p-4 text-sm">
                <span className="text-xs font-semibold uppercase tracking-wide text-brand-primary">
                  Step {i + 1}
                </span>
                <p className="mt-2 text-foreground">{step}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-14">
          <h2 className="font-heading text-2xl font-medium">Frequently asked questions</h2>
          <FaqAccordion items={service.faqs} className="mt-4" />
        </section>

        <RelatedLinks
          title="Related demolition services"
          links={relatedDemo.slice(0, 6).map((s) => ({
            href: `/junk-removal/demolition/${s.slug}`,
            label: s.name,
          }))}
        />

        {relatedJunk.length > 0 && (
          <RelatedLinks
            title="Related junk removal services"
            links={relatedJunk.slice(0, 6).map((s) => ({
              href: `/junk-removal/services/${s!.slug}`,
              label: s!.name,
            }))}
          />
        )}

        <div className="mt-10 flex flex-wrap gap-4 text-sm">
          <Link href="/free-scrap-fridays" className="font-semibold text-brand-primary hover:underline">
            Free Scrap Fridays — metal scrap pickup
          </Link>
          <Link href="/junk-removal/gallery" className="font-semibold text-brand-primary hover:underline">
            Before & after gallery
          </Link>
          <Link href="/pricing" className="font-semibold text-brand-primary hover:underline">
            How pricing works
          </Link>
        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          Browse all {DEMOLITION_SERVICES.length} demolition topics on the{" "}
          <Link href="/junk-removal/demolition" className="underline">
            demolition hub
          </Link>
          .
        </p>
      </main>
      <PublicFooter variant="company" />
      <StickyMobileConcierge divisionId="junk_removal" />
    </div>
  );
}
