import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { StickyMobileConcierge } from "@/components/public/StickyMobileConcierge";
import { MarketingBreadcrumbs } from "@/components/seo/MarketingBreadcrumbs";
import { FaqAccordion } from "@/components/seo/FaqAccordion";
import { ConversionCtaGroup, RelatedLinks } from "@/components/seo/ConversionCta";
import { JsonLd } from "@/components/seo/JsonLd";
import { PlaceholderMedia } from "@/components/seo/PlaceholderMedia";
import { EquipmentLegalNotice } from "@/components/seo/EquipmentLegalNotice";
import type { EquipmentMarketingService } from "@/lib/seo/equipment-divisions";
import { getEquipmentService, equipmentServicesForDivision } from "@/lib/seo/equipment-divisions";
import { DIVISION_SEO } from "@/lib/seo/site";
import { breadcrumbSchema, faqSchema, localBusinessSchema, serviceSchema } from "@/lib/seo/schema";
import { listPublishedProjects } from "@/lib/db/published-projects";
import { RELATED_PROJECT_SLUGS, defaultGoalForServiceSlug, landClearingBookHref } from "@/lib/land-clearing/intents";
import { EquipmentWeUse } from "@/components/seo/EquipmentWeUse";
import { ProjectTrustStrip } from "@/components/seo/ProjectTrustStrip";
import { OnePropertyOneCompany } from "@/components/seo/OnePropertyOneCompany";
import Link from "next/link";

export async function EquipmentServiceMarketingPage({
  service,
}: {
  service: EquipmentMarketingService;
}) {
  const division = DIVISION_SEO[service.division];
  const related = service.related
    .map((slug) => getEquipmentService(service.division, slug) ?? findRelatedAcross(slug))
    .filter(Boolean) as EquipmentMarketingService[];
  const more = equipmentServicesForDivision(service.division).filter((s) => s.slug !== service.slug);
  const relatedSlugs = RELATED_PROJECT_SLUGS[service.slug] ?? [service.slug];
  const projects = await listPublishedProjects({
    divisionId: service.division,
    serviceSlugs: relatedSlugs,
    limit: 4,
  });
  const estimateHref =
    service.division === "land_clearing"
      ? landClearingBookHref({
          goal: defaultGoalForServiceSlug(service.slug),
          serviceSlug: service.slug,
        })
      : `${division.bookPath}&service=${service.slug}`;

  const path = `${division.path}/${service.slug}`;
  const crumbs = [
    { name: "Morris Services", href: "/" },
    { name: division.name, href: division.path },
    { name: service.name },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F5F2]">
      <JsonLd
        data={[
          localBusinessSchema(service.division),
          serviceSchema({
            name: service.name,
            description: service.description,
            path,
            division: service.division,
          }),
          breadcrumbSchema(
            crumbs.map((c) => ({ name: c.name, path: c.href ?? path }))
          ),
          faqSchema(service.faqs),
        ]}
      />
      <PublicHeader variant="umbrella" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 pb-28 sm:py-12">
        <MarketingBreadcrumbs items={crumbs} />
        <div className="mt-6 grid gap-8 lg:grid-cols-5 lg:items-start">
          <div className="lg:col-span-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-primary">
              {division.name}
            </p>
            <h1 className="mt-2 font-heading text-4xl font-medium tracking-tight text-foreground sm:text-5xl">
              {service.h1}
            </h1>
            {service.intro.map((p) => (
              <p key={p.slice(0, 40)} className="mt-4 text-lg leading-relaxed text-muted-foreground">
                {p}
              </p>
            ))}
            <ConversionCtaGroup
              divisionId={service.division}
              estimateHref={estimateHref}
              className="mt-8"
            />
          </div>
          <div className="lg:col-span-2">
            <PlaceholderMedia label="Decorative panel only — not a completed Morris job. Project photography will replace this when real work is documented." />
          </div>
        </div>

        {service.detailSections?.length ? (
          <section className="mt-14 space-y-8">
            {service.detailSections.map((section) => (
              <div key={section.heading} id={section.id} className={section.id ? "scroll-mt-24" : undefined}>
                <h2 className="font-heading text-2xl font-medium">{section.heading}</h2>
                {section.body.map((p) => (
                  <p key={p.slice(0, 48)} className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                    {p}
                  </p>
                ))}
              </div>
            ))}
          </section>
        ) : null}

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
          <h2 className="font-heading text-2xl font-medium">How it works</h2>
          <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
            {service.process.map((x, i) => (
              <li key={x}>
                {i + 1}. {x}
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-14">
          <h2 className="font-heading text-2xl font-medium">Limits and review</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            {service.restrictions.map((x) => (
              <li key={x}>• {x}</li>
            ))}
          </ul>
        </section>

        {projects.length > 0 ? (
          <ProjectTrustStrip projects={projects} title="Completed local projects" />
        ) : (
          <section className="mt-14">
            <h2 className="font-heading text-2xl font-medium">Local projects</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Project pages will appear here after real jobs are completed and published. We do not
              invent before-and-after galleries.
            </p>
            <p className="mt-2 text-sm">
              <Link href="/service-area" className="font-medium text-brand-primary hover:underline">
                View the current service area
              </Link>
              {" · "}
              <Link
                href="/junk-removal/areas/warrenton"
                className="font-medium text-brand-primary hover:underline"
              >
                Warrenton
              </Link>
            </p>
          </section>
        )}

        <RelatedLinks
          title="Related services"
          links={[
            ...related.map((s) => ({
              href: `${DIVISION_SEO[s.division].path}/${s.slug}`,
              label: s.name,
            })),
            ...more
              .filter((s) => !service.related.includes(s.slug))
              .slice(0, 3)
              .map((s) => ({
                href: `${division.path}/${s.slug}`,
                label: s.name,
              })),
          ]}
        />

        <section className="mt-14">
          <h2 className="font-heading text-2xl font-medium">Also useful</h2>
          <ul className="mt-4 space-y-3">
            {service.crossLinks.map((l) => (
              <li key={l.href} className="text-sm text-muted-foreground">
                <Link href={l.href} className="font-medium text-brand-primary hover:underline">
                  {l.label}
                </Link>
                <span className="mt-0.5 block">{l.note}</span>
              </li>
            ))}
          </ul>
        </section>

        {service.division === "land_clearing" && service.slug === "property-reclamation" && (
          <OnePropertyOneCompany className="mt-14" />
        )}

        {service.division === "land_clearing" && <EquipmentWeUse />}

        <section className="mt-14">
          <h2 className="font-heading text-2xl font-medium">FAQ</h2>
          <FaqAccordion items={service.faqs} className="mt-4" />
        </section>

        <EquipmentLegalNotice className="mt-14" />
        <ConversionCtaGroup
          divisionId={service.division}
          estimateHref={estimateHref}
          className="mt-10"
        />
      </main>
      <PublicFooter variant="umbrella" />
      <StickyMobileConcierge divisionId={service.division} />
    </div>
  );
}

function findRelatedAcross(slug: string): EquipmentMarketingService | undefined {
  const divisions = ["land_clearing", "site_work", "equipment_services"] as const;
  for (const d of divisions) {
    const found = getEquipmentService(d, slug);
    if (found) return found;
  }
  return undefined;
}
