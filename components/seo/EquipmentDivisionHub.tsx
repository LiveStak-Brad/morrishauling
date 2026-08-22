import Link from "next/link";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { StickyMobileConcierge } from "@/components/public/StickyMobileConcierge";
import { MarketingBreadcrumbs } from "@/components/seo/MarketingBreadcrumbs";
import { ConversionCtaGroup, RelatedLinks } from "@/components/seo/ConversionCta";
import { JsonLd } from "@/components/seo/JsonLd";
import { PlaceholderMedia } from "@/components/seo/PlaceholderMedia";
import { EquipmentLegalNotice } from "@/components/seo/EquipmentLegalNotice";
import { LandClearingGoalSelector } from "@/components/seo/LandClearingGoalSelector";
import { OnePropertyOneCompany } from "@/components/seo/OnePropertyOneCompany";
import { EquipmentWeUse } from "@/components/seo/EquipmentWeUse";
import { ProjectTrustStrip } from "@/components/seo/ProjectTrustStrip";
import { FaqAccordion } from "@/components/seo/FaqAccordion";
import {
  DIVISION_HUB_COPY,
  equipmentServicesForDivision,
  type EquipmentMarketingService,
} from "@/lib/seo/equipment-divisions";
import { DIVISION_SEO } from "@/lib/seo/site";
import { breadcrumbSchema, faqSchema, localBusinessSchema, serviceSchema } from "@/lib/seo/schema";
import { listPublishedProjects } from "@/lib/db/published-projects";
import { HUB_ONLY_INTENT_SECTIONS, LAND_CLEARING_HUB_FAQS, landClearingBookHref } from "@/lib/land-clearing/intents";

export async function EquipmentDivisionHub({
  division,
}: {
  division: EquipmentMarketingService["division"];
}) {
  const d = DIVISION_SEO[division];
  const copy = DIVISION_HUB_COPY[division];
  const services = equipmentServicesForDivision(division);
  const projects = await listPublishedProjects({ divisionId: division, limit: 4 });

  const crumbs = [
    { name: "Morris Services", href: "/" },
    { name: d.name },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F5F2]">
      <JsonLd
        data={[
          localBusinessSchema(division),
          serviceSchema({
            name: d.name,
            description: d.description,
            path: d.path,
            division,
          }),
          breadcrumbSchema([
            { name: "Morris Services", path: "/" },
            { name: d.name, path: d.path },
          ]),
          ...(division === "land_clearing" ? [faqSchema([...LAND_CLEARING_HUB_FAQS])] : []),
        ]}
      />
      <PublicHeader variant="umbrella" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 pb-28 sm:py-12">
        <MarketingBreadcrumbs items={crumbs} />
        <div className="mt-6 grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-primary">
              Morris Service Group LLC
            </p>
            <h1 className="mt-2 font-heading text-4xl font-medium tracking-tight sm:text-5xl">
              {copy.h1}
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{copy.lede}</p>
            <ConversionCtaGroup
              divisionId={division}
              estimateHref={
                division === "land_clearing" ? landClearingBookHref({ goal: "general_land_clearing" }) : undefined
              }
              className="mt-8"
            />
          </div>
          <div className="lg:col-span-2">
            <PlaceholderMedia
              label={
                division === "land_clearing"
                  ? "Decorative panel only. Land-clearing photos will be added from completed Morris properties."
                  : "Decorative panel only. Equipment photos will be added from completed Morris jobs."
              }
            />
          </div>
        </div>

        {division === "land_clearing" && (
          <div className="mt-14">
            <LandClearingGoalSelector />
          </div>
        )}

        <section className="mt-14">
          <h2 className="font-heading text-3xl font-medium tracking-tight">Services</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Choose the job that sounds closest. Photos and a short video help us confirm the fit.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {services.map((s) => (
              <Link
                key={s.slug}
                href={`${d.path}/${s.slug}`}
                className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition hover:border-brand-primary/25 hover:shadow-md"
              >
                <h3 className="text-lg font-semibold tracking-tight">{s.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.description}</p>
              </Link>
            ))}
          </div>
        </section>

        {division === "land_clearing" && (
          <section className="mt-14 space-y-8">
            <h2 className="font-heading text-2xl font-medium tracking-tight">
              Other property goals we discuss
            </h2>
            {HUB_ONLY_INTENT_SECTIONS.map((section) => (
              <article
                key={section.id}
                id={section.id}
                className="scroll-mt-24 rounded-2xl border border-black/5 bg-white p-5 shadow-sm"
              >
                <h3 className="text-lg font-semibold tracking-tight">{section.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{section.body}</p>
                <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  {section.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="font-medium text-brand-primary hover:underline"
                    >
                      {link.label}
                    </Link>
                  ))}
                  <Link
                    href={landClearingBookHref({ goal: section.goal })}
                    className="font-medium text-brand-primary hover:underline"
                  >
                    Request an estimate
                  </Link>
                </p>
              </article>
            ))}
          </section>
        )}

        {copy.secondary.length > 0 && (
          <section className="mt-14">
            <h2 className="font-heading text-2xl font-medium">Also requested</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Related work we often discuss on the same estimate.
            </p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {copy.secondary.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </section>
        )}

        {division === "site_work" && (
          <section className="mt-14 rounded-2xl border border-black/5 bg-white p-6">
            <h2 className="font-heading text-2xl font-medium">Not offered yet</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Excavation, trenching, drainage, and culvert installation are not current services.
              More property and equipment work will be added as our fleet grows.
            </p>
          </section>
        )}

        {division === "land_clearing" && (
          <OnePropertyOneCompany className="mt-14" />
        )}

        {division === "land_clearing" && <EquipmentWeUse />}

        {projects.length > 0 ? (
          <ProjectTrustStrip projects={projects} title="Published projects" />
        ) : (
          <section className="mt-14">
            <h2 className="font-heading text-2xl font-medium">Projects</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Project photos and case studies will be added as completed Morris projects are
              documented. See{" "}
              <Link href="/projects" className="font-medium text-brand-primary hover:underline">
                projects
              </Link>{" "}
              when real jobs are published.
            </p>
          </section>
        )}

        {division === "land_clearing" && (
          <section className="mt-14">
            <h2 className="font-heading text-2xl font-medium">FAQ</h2>
            <FaqAccordion items={[...LAND_CLEARING_HUB_FAQS]} className="mt-4" />
          </section>
        )}

        <RelatedLinks
          title="Service area and related divisions"
          links={[
            { href: "/service-area", label: "Service area" },
            { href: "/junk-removal/areas/warrenton", label: "Warrenton" },
            { href: "/junk-removal/areas/warren-county", label: "Warren County" },
            ...(division !== "land_clearing"
              ? [{ href: "/land-clearing", label: "Land Clearing" }]
              : []),
            ...(division !== "site_work" ? [{ href: "/site-work", label: "Site Work" }] : []),
            ...(division !== "equipment_services"
              ? [{ href: "/equipment-services", label: "Equipment Services" }]
              : []),
            { href: "/hauling", label: "Morris Hauling" },
            { href: "/junk-removal", label: "Morris Junk Removal" },
          ]}
        />

        <EquipmentLegalNotice className="mt-14" />
      </main>
      <PublicFooter variant="umbrella" />
      <StickyMobileConcierge divisionId={division} />
    </div>
  );
}
