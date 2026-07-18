"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Phone } from "lucide-react";
import { HaulingLogo } from "@/components/brand/HaulingLogo";
import { CompanyLogo } from "@/components/brand/CompanyLogo";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { CompanyBreadcrumbBar } from "@/components/public/CompanyBreadcrumbBar";
import { CompanyStatusBadge } from "@/components/public/CompanyStatusBadge";
import { StickyMobileConcierge } from "@/components/public/StickyMobileConcierge";
import { useDivisionPublicStatus } from "@/components/public/useDivisionPublicStatus";
import { ButtonLink } from "@/components/ui/button-link";
import { FaqAccordion } from "@/components/seo/FaqAccordion";
import { SocialFollowStrip } from "@/components/social/SocialFollowStrip";
import { JsonLd } from "@/components/seo/JsonLd";
import { MarketingImage } from "@/components/seo/MarketingImage";
import { useCompany } from "@/lib/company-context";
import { morrisServicesConfig } from "@/lib/morris-services-config";
import { SERVICE_AREA } from "@/lib/public-copy";
import { HAULING_DIVISION_FAQS, HAULING_LIMITATIONS } from "@/lib/seo/faqs";
import { servicesForDivision } from "@/lib/seo/services";
import { faqSchema, localBusinessSchema } from "@/lib/seo/schema";
import { trackMarketingEvent } from "@/lib/seo/analytics";

/** Morris Hauling — status from /admin/divisions (DB). */
export function HaulingHomePage() {
  const hauling = morrisServicesConfig.haulingDivision;
  const { company } = useCompany();
  const tel = company.phone.replace(/\D/g, "");
  const { status: divisionStatus } = useDivisionPublicStatus("hauling");
  const canBook =
    divisionStatus?.acceptsBookings || divisionStatus?.acceptsEstimateRequests;
  const bookHref = divisionStatus?.bookPath ?? "/book?division=hauling";
  const bookLabel = divisionStatus?.bookingCtaLabel ?? "Request estimate";
  const haulingServices = servicesForDivision("hauling");

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#F7F5F2]">
      <JsonLd data={[localBusinessSchema("hauling"), faqSchema(HAULING_DIVISION_FAQS)]} />
      <CompanyBreadcrumbBar />
      <PublicHeader variant="umbrella" />

      <section className="relative overflow-hidden border-b border-black/5">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(155,27,48,0.12), transparent 55%), linear-gradient(180deg, #fff 0%, #F7F5F2 100%)",
          }}
          aria-hidden
        />
        <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center px-4 pb-14 pt-10 text-center sm:pb-18 sm:pt-12 md:pb-20 md:pt-14">
          <p className="animate-fade-in text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-primary opacity-0 sm:text-xs">
            A {morrisServicesConfig.publicBrandName} Company
          </p>

          <div
            className="mt-6 w-full max-w-2xl opacity-0 animate-slide-up sm:mt-8"
            style={{ animationFillMode: "forwards", animationDelay: "0.05s" }}
          >
            <HaulingLogo
              height={360}
              priority
              href={undefined}
              className="mx-auto w-full max-h-48 sm:max-h-60 md:max-h-72"
            />
          </div>

          <CompanyStatusBadge
            divisionStatus={divisionStatus?.launchStatus ?? "setup"}
            label={divisionStatus?.statusLabel}
            className="mt-6"
          />

          <h1
            className="mt-5 max-w-3xl font-heading text-4xl font-medium leading-[1.1] tracking-tight text-foreground opacity-0 animate-slide-up sm:mt-6 sm:text-5xl md:text-6xl"
            style={{ animationFillMode: "forwards", animationDelay: "0.12s" }}
          >
            Hauling Services in Warren County, Missouri
          </h1>
          <p
            className="mt-3 max-w-2xl font-heading text-xl font-medium text-foreground/80 opacity-0 animate-slide-up sm:text-2xl"
            style={{ animationFillMode: "forwards", animationDelay: "0.14s" }}
          >
            Equipment &amp; vehicle transport — not junk removal.
          </p>
          <p
            className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground opacity-0 animate-slide-up sm:text-lg"
            style={{ animationFillMode: "forwards", animationDelay: "0.18s" }}
          >
            Local hauling for machinery, vehicles, trailers, and contractor deliveries across{" "}
            {SERVICE_AREA}. Loads outside safe capacity are reviewed or declined.
          </p>

          <div
            className="mt-8 flex w-full max-w-md flex-col gap-3 opacity-0 animate-slide-up sm:mt-10 sm:max-w-none sm:flex-row sm:justify-center"
            style={{ animationFillMode: "forwards", animationDelay: "0.24s" }}
          >
            <ButtonLink
              href={canBook ? bookHref : "/contact"}
              size="lg"
              className="h-12 min-h-[48px] w-full rounded-full bg-brand-primary px-8 text-base font-semibold shadow-lg shadow-brand-primary/20 hover:bg-brand-primary/90 sm:w-auto"
              onClick={() =>
                trackMarketingEvent("estimate_start", { division: "hauling", label: "hero" })
              }
            >
              {canBook ? bookLabel : "Contact us"}
              <ArrowRight className="ml-2 h-5 w-5" />
            </ButtonLink>
            <ButtonLink
              href="/hauling/services"
              size="lg"
              variant="outline"
              className="h-12 min-h-[48px] w-full rounded-full border-foreground/15 bg-white/70 sm:w-auto"
            >
              Choose a service
            </ButtonLink>
          </div>

          <a
            href={`tel:${tel}`}
            onClick={() =>
              trackMarketingEvent("phone_cta_click", { division: "hauling", label: "hero" })
            }
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-primary opacity-0 animate-fade-in hover:underline"
            style={{ animationFillMode: "forwards", animationDelay: "0.32s" }}
          >
            <Phone className="h-4 w-4" aria-hidden />
            Call {company.phone}
          </a>
        </div>
      </section>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-10 md:pb-16 md:pt-14">
        <section className="rounded-2xl border border-black/5 bg-white px-5 py-4 text-sm shadow-sm sm:px-6">
          <p className="font-semibold text-brand-primary">Separate from junk removal</p>
          <p className="mt-1 text-muted-foreground">
            {hauling.tagline} Different booking, pricing, and equipment than Morris Junk Removal.
          </p>
        </section>

        <section className="mt-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-primary">
            Services
          </p>
          <h2 className="mt-3 font-heading text-3xl font-medium tracking-tight sm:text-4xl">
            Equipment, vehicles, and contractor delivery
          </h2>
          <div className="mt-8 flex justify-center">
            <MarketingImage
              imageKey="gooseneck-hauling"
              className="w-full max-w-md sm:max-w-lg md:max-w-xl"
              sizes="(max-width: 640px) 90vw, (max-width: 768px) 512px, 576px"
            />
          </div>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {haulingServices.map((svc) => (
              <li key={svc.slug}>
                <Link
                  href={`/hauling/services/${svc.slug}`}
                  className="flex items-center gap-3 rounded-2xl border border-black/5 bg-white px-4 py-3.5 text-sm font-medium shadow-sm hover:border-brand-primary/30"
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary" aria-hidden />
                  {svc.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-16 grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="font-heading text-2xl font-medium">Pickup and delivery process</h2>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
              <li>Request an estimate with pickup, delivery, and load details</li>
              <li>We verify addresses and review weight, dimensions, and equipment fit</li>
              <li>You approve the plan before we schedule</li>
              <li>Crew arrives in the confirmed window and completes the haul</li>
            </ol>
          </div>
          <div>
            <h2 className="font-heading text-2xl font-medium">Load information we need</h2>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>• Approximate weight and dimensions</li>
              <li>• Whether the item runs / needs winch assistance</li>
              <li>• Loading help expectations (customer vs. Morris)</li>
              <li>• Photos of the load and access at both ends</li>
            </ul>
          </div>
        </section>

        <section className="mt-16">
          <h2 className="font-heading text-2xl font-medium">Safety and manual review</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            We do not imply that every load can be moved legally or safely. Overweight, overwidth,
            interstate, or specialized equipment may require permits or equipment we do not provide.
          </p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            {HAULING_LIMITATIONS.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </section>

        <section className="mt-16 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-heading text-3xl font-medium tracking-tight">Service area</h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Centered on Warren County with extended-area routes when capacity allows.
            </p>
          </div>
          <ButtonLink href="/hauling/areas" variant="outline" className="h-11 rounded-full">
            View service areas
          </ButtonLink>
        </section>

        <section className="mt-16">
          <h2 className="font-heading text-3xl font-medium tracking-tight">Frequently asked questions</h2>
          <FaqAccordion items={HAULING_DIVISION_FAQS} className="mt-6" />
        </section>

        <section className="mt-16 sm:mt-20">
          <div className="overflow-hidden rounded-[1.75rem] morris-gradient-bg p-8 text-white sm:p-10">
            <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
              <div className="max-w-lg">
                <p className="text-sm font-semibold text-white/70">Transport booking</p>
                <h2 className="mt-2 font-heading text-3xl font-medium tracking-tight">
                  {canBook ? "Request a hauling estimate" : "Contact us about a haul"}
                </h2>
                <ul className="mt-5 space-y-2.5">
                  {[
                    "Pickup and delivery details in one request",
                    "Mileage from verified places — not map guesses",
                    "Manual review when weight or permits need a human check",
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-2 text-sm text-white/90">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-white/70" aria-hidden />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <ButtonLink
                href={canBook ? bookHref : "/contact"}
                size="lg"
                className="h-14 shrink-0 rounded-full bg-white px-8 text-base font-bold text-brand-primary hover:bg-white/90"
              >
                {canBook ? bookLabel : "Contact us"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </ButtonLink>
            </div>
          </div>
        </section>

        <SocialFollowStrip className="mt-12" compact />

        <section className="mt-8 rounded-[1.5rem] border border-black/5 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <CompanyLogo height={96} className="max-h-24" href="/junk-removal" />
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Need junk removed?</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Morris Junk Removal handles clear-outs and disposal — book that division separately.
                </p>
              </div>
            </div>
            <ButtonLink href="/junk-removal" className="h-11 rounded-full">
              Enter Junk Removal
              <ArrowRight className="ml-2 h-4 w-4" />
            </ButtonLink>
          </div>
        </section>

        <section className="py-12 text-center">
          <HaulingLogo height={180} className="mx-auto max-h-36 sm:max-h-40" href="/hauling" />
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            A {morrisServicesConfig.publicBrandName} Company
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            <Link href="/" className="font-medium text-brand-primary hover:underline">
              ← Back to {morrisServicesConfig.publicBrandName}
            </Link>
          </p>
        </section>
      </main>

      <PublicFooter variant="umbrella" />
      <StickyMobileConcierge divisionId="hauling" />
    </div>
  );
}

/** @deprecated Use HaulingHomePage — kept for import compatibility */
export const HaulingComingSoonPage = HaulingHomePage;
