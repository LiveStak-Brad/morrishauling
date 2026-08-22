import Link from "next/link";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { StickyMobileConcierge } from "@/components/public/StickyMobileConcierge";
import { MarketingBreadcrumbs } from "@/components/seo/MarketingBreadcrumbs";
import { ConversionCtaGroup, RelatedLinks } from "@/components/seo/ConversionCta";
import { JsonLd } from "@/components/seo/JsonLd";
import { PlaceholderMedia } from "@/components/seo/PlaceholderMedia";
import { EquipmentLegalNotice } from "@/components/seo/EquipmentLegalNotice";
import {
  DIVISION_HUB_COPY,
  equipmentServicesForDivision,
  type EquipmentMarketingService,
} from "@/lib/seo/equipment-divisions";
import { DIVISION_SEO } from "@/lib/seo/site";
import { breadcrumbSchema, localBusinessSchema, serviceSchema } from "@/lib/seo/schema";
import { listPublishedProjects } from "@/lib/db/published-projects";

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
            <ConversionCtaGroup divisionId={division} className="mt-8" />
          </div>
          <div className="lg:col-span-2">
            <PlaceholderMedia
              label={
                division === "land_clearing"
                  ? "Land-clearing photography will be added from completed properties."
                  : "On-site equipment photography will be added from real jobs."
              }
            />
          </div>
        </div>

        <section className="mt-14">
          <h2 className="font-heading text-3xl font-medium tracking-tight">Services</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Each page is written for a real search and a real job type. We do not clone city names
            onto thin pages.
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

        {copy.secondary.length > 0 && (
          <section className="mt-14">
            <h2 className="font-heading text-2xl font-medium">Also requested</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              These show up in the estimate form. They do not each need a separate page.
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
            <h2 className="font-heading text-2xl font-medium">Later expansion</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Excavation, trenching, drainage, culverts, stump removal, and related excavator work
              are planned. They are not listed as available until those capabilities are enabled.
            </p>
          </section>
        )}

        {projects.length > 0 ? (
          <RelatedLinks
            title="Published projects"
            links={projects.map((p) => ({ href: `/projects/${p.slug}`, label: p.title }))}
          />
        ) : (
          <section className="mt-14">
            <h2 className="font-heading text-2xl font-medium">Projects</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Completed jobs will be published at{" "}
              <Link href="/projects" className="font-medium text-brand-primary hover:underline">
                /projects
              </Link>{" "}
              with real photos. Nothing here is fabricated.
            </p>
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
