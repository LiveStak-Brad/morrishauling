"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { CompanyBreadcrumbBar } from "@/components/public/CompanyBreadcrumbBar";
import { StickyMobileConcierge } from "@/components/public/StickyMobileConcierge";
import { CompanyStatusBadge } from "@/components/public/CompanyStatusBadge";
import { ButtonLink } from "@/components/ui/button-link";
import { useAllDivisionPublicStatuses } from "@/components/public/useDivisionPublicStatus";
import { SERVICES_INTRO } from "@/lib/public-copy";
import { PUBLIC_DIVISION_CARDS } from "@/lib/morris-services-config";
import { morrisConfig } from "@/lib/morris-config";
import { LAND_CLEARING_SERVICES, SITE_WORK_SERVICES, EQUIPMENT_SERVICES_PAGES } from "@/lib/seo/equipment-divisions";
import { DIVISION_SEO } from "@/lib/seo/site";
import type { DivisionId } from "@/lib/divisions";
import { publicCatalogServices } from "@/lib/equipment/catalog";

const DIVISION_LINKS: Record<
  DivisionId,
  { href: string; label: string }[]
> = {
  junk_removal: [
    { href: "/junk-removal", label: "Junk Removal hub" },
    { href: "/free-scrap-fridays", label: "Free Scrap Pickup" },
    { href: "/junk-removal/services", label: "Detailed junk services" },
    ...morrisConfig.services.slice(0, 6).map((s) => ({
      href: "/book?division=junk_removal",
      label: s.name,
    })),
  ],
  hauling: [
    { href: "/hauling", label: "Hauling hub" },
    { href: "/hauling/services", label: "Hauling services" },
    { href: "/book?division=hauling", label: "Request a hauling estimate" },
  ],
  land_clearing: publicCatalogServices("land_clearing").map((s) => ({
    href: `${DIVISION_SEO.land_clearing.path}/${s.slug}`,
    label: LAND_CLEARING_SERVICES.find((p) => p.slug === s.slug)?.shortName ?? s.name,
  })),
  site_work: publicCatalogServices("site_work").map((s) => ({
    href: `${DIVISION_SEO.site_work.path}/${s.slug}`,
    label: SITE_WORK_SERVICES.find((p) => p.slug === s.slug)?.shortName ?? s.name,
  })),
  equipment_services: publicCatalogServices("equipment_services").map((s) => ({
    href: `${DIVISION_SEO.equipment_services.path}/${s.slug}`,
    label: EQUIPMENT_SERVICES_PAGES.find((p) => p.slug === s.slug)?.shortName ?? s.name,
  })),
};

export default function ServicesPage() {
  const { byId } = useAllDivisionPublicStatuses();

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#F7F5F2]">
      <PublicHeader variant="umbrella" />
      <CompanyBreadcrumbBar currentLabel="Services" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 pb-28 sm:px-6 md:py-14">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-primary">
          Services
        </p>
        <h1 className="mt-3 font-heading text-4xl font-medium tracking-tight sm:text-5xl">
          What Morris does
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          {SERVICES_INTRO}
        </p>

        <div className="mt-10 space-y-6">
          {PUBLIC_DIVISION_CARDS.map((div) => {
            const status = byId[div.divisionId];
            const canRequest = status?.acceptsBookings || status?.acceptsEstimateRequests;
            return (
              <article
                key={div.divisionId}
                className="rounded-[1.5rem] border border-black/5 bg-white p-6 shadow-sm sm:p-8"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    {status ? (
                      <CompanyStatusBadge
                        divisionStatus={status.launchStatus}
                        label={status.statusLabel}
                      />
                    ) : null}
                    <h2 className="mt-3 text-2xl font-semibold tracking-tight">{div.name}</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                      {div.description}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                    <ButtonLink href={div.hubPath} className="h-11 rounded-full">
                      Visit hub
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </ButtonLink>
                    <ButtonLink
                      href={canRequest ? status?.bookPath ?? `/book?division=${div.divisionId}` : "/contact"}
                      variant="outline"
                      className="h-11 rounded-full"
                    >
                      {status?.bookingCtaLabel ?? "Request an Estimate"}
                    </ButtonLink>
                  </div>
                </div>
                <ul className="mt-6 grid gap-2 sm:grid-cols-2">
                  {DIVISION_LINKS[div.divisionId].map((item) => (
                    <li key={`${div.divisionId}-${item.href}-${item.label}`}>
                      <Link
                        href={item.href}
                        className="text-sm font-medium text-brand-primary hover:underline"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
                {div.divisionId === "junk_removal" ? (
                  <p className="mt-4 rounded-xl bg-[#F7F5F2] px-4 py-3 text-sm text-muted-foreground">
                    <Link href="/free-scrap-fridays" className="font-semibold text-brand-primary hover:underline">
                      Free Scrap Pickup
                    </Link>{" "}
                    is a highlighted Junk Removal program — same Friday route, same careful crew.
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>
      </main>
      <PublicFooter variant="umbrella" />
      <StickyMobileConcierge />
    </div>
  );
}
