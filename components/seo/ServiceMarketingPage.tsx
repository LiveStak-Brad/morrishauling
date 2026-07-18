import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { StickyMobileConcierge } from "@/components/public/StickyMobileConcierge";
import { MarketingBreadcrumbs } from "@/components/seo/MarketingBreadcrumbs";
import { MarketingImage } from "@/components/seo/MarketingImage";
import { FaqAccordion } from "@/components/seo/FaqAccordion";
import { ConversionCtaGroup, RelatedLinks } from "@/components/seo/ConversionCta";
import { RelatedAuthorityLinks } from "@/components/authority/RelatedAuthorityLinks";
import { AuthoritySpotlightClient } from "@/components/authority/AuthoritySpotlightClient";
import { JsonLd } from "@/components/seo/JsonLd";
import type { MarketingService } from "@/lib/seo/services";
import { getService, servicesForDivision } from "@/lib/seo/services";
import { DIVISION_SEO } from "@/lib/seo/site";
import {
  breadcrumbSchema,
  faqSchema,
  serviceSchema,
} from "@/lib/seo/schema";

export function ServiceMarketingPage({ service }: { service: MarketingService }) {
  const division = DIVISION_SEO[service.division];
  const related = service.related
    .map((slug) => getService(service.division, slug))
    .filter(Boolean) as MarketingService[];
  const more = servicesForDivision(service.division)
    .filter((s) => s.slug !== service.slug)
    .slice(0, 4);

  const crumbs = [
    { name: "Morris Services", href: "/" },
    { name: division.name, href: division.path },
    { name: "Services", href: `${division.path}/services` },
    { name: service.name },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F5F2]">
      <JsonLd
        data={[
          serviceSchema({
            name: service.name,
            description: service.description,
            path: `${division.path}/services/${service.slug}`,
            division: service.division,
          }),
          breadcrumbSchema(
            crumbs.map((c) => ({ name: c.name, path: c.href ?? `${division.path}/services/${service.slug}` }))
          ),
          faqSchema(service.faqs),
        ]}
      />
      <PublicHeader variant={service.division === "junk_removal" ? "company" : "umbrella"} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 pb-28 sm:py-12">
        <MarketingBreadcrumbs items={crumbs} />
        <div className="mt-6 grid gap-8 lg:grid-cols-5 lg:items-start">
          <div className="lg:col-span-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-primary">
              {division.name}
            </p>
            <h1 className="mt-2 font-heading text-4xl font-medium tracking-tight text-foreground sm:text-5xl">
              {service.name}
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{service.description}</p>
            <ConversionCtaGroup divisionId={service.division} className="mt-8" />
          </div>
          <div className="lg:col-span-2">
            <MarketingImage
              imageKey={service.imageKey}
              priority
              className={
                service.imageKey === "gooseneck-hauling" ||
                service.imageKey === "junk-removal-truck"
                  ? "mx-auto w-full max-w-sm lg:max-w-none"
                  : undefined
              }
              sizes="(max-width: 1024px) 90vw, 420px"
            />
          </div>
        </div>

        <section className="mt-14 grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="font-heading text-2xl font-medium">Who it is for</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {service.whoFor.map((x) => (
                <li key={x}>• {x}</li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-heading text-2xl font-medium">What is included</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {service.included.map((x) => (
                <li key={x}>• {x}</li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-heading text-2xl font-medium">What we need from you</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {service.needed.map((x) => (
                <li key={x}>• {x}</li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-heading text-2xl font-medium">What affects pricing</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {service.pricingFactors.map((x) => (
                <li key={x}>• {x}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-14">
          <h2 className="font-heading text-2xl font-medium">Restrictions & review</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {service.restrictions.map((x) => (
              <li key={x}>• {x}</li>
            ))}
          </ul>
        </section>

        {service.responsibleDisposal && (
          <section className="mt-14 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
            <h2 className="font-heading text-2xl font-medium">Responsible disposal</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {service.responsibleDisposal}
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              <a
                href="/junk-removal/responsible-disposal"
                className="font-semibold text-brand-primary hover:underline"
              >
                Learn how we handle donation, recycling, and disposal →
              </a>
            </p>
          </section>
        )}

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
          title="Related services"
          links={[...related, ...more]
            .filter((s, i, arr) => arr.findIndex((x) => x.slug === s.slug) === i)
            .slice(0, 6)
            .map((s) => ({
              href: `${division.path}/services/${s.slug}`,
              label: s.name,
            }))}
        />

        {service.division === "junk_removal" && (
          <>
            <AuthoritySpotlightClient
              surface="before_after"
              href="/junk-removal/gallery"
              className="mt-12"
            />
            <RelatedAuthorityLinks
              serviceSlug={service.slug}
              excludePath={`${division.path}/services/${service.slug}`}
              prefer={[
                { href: "/junk-removal/gallery", label: "Before & after gallery" },
                { href: "/junk-removal/videos", label: "Watch real jobs" },
                { href: "/junk-removal/latest", label: "Latest jobs" },
              ]}
            />
          </>
        )}

      </main>
      <PublicFooter variant={service.division === "junk_removal" ? "company" : "umbrella"} />
      <StickyMobileConcierge divisionId={service.division} />
    </div>
  );
}
