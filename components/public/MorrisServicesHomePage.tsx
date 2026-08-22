"use client";

import Link from "next/link";
import { ArrowRight, MapPin, Phone, Shield } from "lucide-react";
import { MorrisServicesLogo } from "@/components/brand/MorrisServicesLogo";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { CompanyStatusBadge } from "@/components/public/CompanyStatusBadge";
import { StickyMobileConcierge } from "@/components/public/StickyMobileConcierge";
import { SocialHomeSection } from "@/components/social/SocialHomeSection";
import { LatestFromWarrentonJunk } from "@/components/social/LatestFromWarrentonJunk";
import { useAllDivisionPublicStatuses } from "@/components/public/useDivisionPublicStatus";
import { ButtonLink } from "@/components/ui/button-link";
import { morrisServicesConfig, PUBLIC_DIVISION_CARDS } from "@/lib/morris-services-config";
import {
  MORRIS_STANDARD_PILLARS,
  PARENT_PROTOCOL,
  SERVICE_AREA,
  SERVICE_COVERAGE_NOTE,
} from "@/lib/public-copy";
import { HOMEPAGE_GOAL_CARDS } from "@/lib/public-nav";
import { trackMarketingEvent } from "@/lib/seo/analytics";
import { MorrisProtocolSteps } from "@/components/public/MorrisProtocolSteps";
import type { DivisionId } from "@/lib/divisions";

export function MorrisServicesHomePage() {
  const { byId } = useAllDivisionPublicStatuses();

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#F7F5F2]">
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
        <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center px-4 pb-16 pt-10 text-center sm:pb-20 sm:pt-14 md:pb-24 md:pt-16">
          <p className="animate-fade-in text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-primary opacity-0 sm:text-xs">
            {morrisServicesConfig.parentLegalName}
          </p>

          <div
            className="mt-6 w-full max-w-2xl animate-slide-up opacity-0 sm:mt-8"
            style={{ animationFillMode: "forwards", animationDelay: "0.05s" }}
          >
            <MorrisServicesLogo
              height={360}
              href={undefined}
              priority
              className="mx-auto w-full max-h-48 sm:max-h-56 md:max-h-64"
            />
          </div>

          <h1
            className="mt-8 max-w-3xl font-heading text-4xl font-medium leading-[1.1] tracking-tight text-foreground opacity-0 animate-slide-up sm:mt-10 sm:text-5xl md:text-6xl"
            style={{ animationFillMode: "forwards", animationDelay: "0.12s" }}
          >
            {morrisServicesConfig.promise}
          </h1>
          <p
            className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground opacity-0 animate-slide-up sm:text-lg"
            style={{ animationFillMode: "forwards", animationDelay: "0.18s" }}
          >
            {morrisServicesConfig.heroSupport}
          </p>
          <p
            className="mt-3 max-w-xl text-sm font-medium text-foreground/80 opacity-0 animate-slide-up"
            style={{ animationFillMode: "forwards", animationDelay: "0.2s" }}
          >
            {morrisServicesConfig.serviceCategoriesLine.replace(/ · /g, " • ")}
          </p>

          <div
            className="mt-8 flex w-full max-w-md flex-col gap-3 opacity-0 animate-slide-up sm:mt-10 sm:max-w-none sm:flex-row sm:justify-center"
            style={{ animationFillMode: "forwards", animationDelay: "0.24s" }}
          >
            <ButtonLink
              href="/book"
              size="lg"
              className="h-12 min-h-[48px] w-full rounded-full bg-brand-primary px-8 text-base font-semibold shadow-lg shadow-brand-primary/20 hover:bg-brand-primary/90 sm:w-auto"
              onClick={() => trackMarketingEvent("estimate_start", { division: "parent", label: "hero" })}
            >
              Request an Estimate
              <ArrowRight className="ml-2 h-5 w-5" />
            </ButtonLink>
            <ButtonLink
              href="/services"
              size="lg"
              variant="outline"
              className="h-12 min-h-[48px] w-full rounded-full border-foreground/15 bg-white/70 sm:w-auto"
            >
              Explore Services
            </ButtonLink>
          </div>

          <p
            className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground opacity-0 animate-fade-in"
            style={{ animationFillMode: "forwards", animationDelay: "0.35s" }}
          >
            <MapPin className="h-4 w-4 shrink-0 text-brand-primary" aria-hidden />
            <span>{SERVICE_AREA}</span>
          </p>
        </div>
      </section>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-14 sm:pt-16 md:pb-20 md:pt-20">
        <section className="scroll-mt-24">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-primary">
            Start here
          </p>
          <h2 className="mt-2 font-heading text-3xl font-medium tracking-tight sm:text-4xl">
            What are you trying to accomplish?
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {HOMEPAGE_GOAL_CARDS.map((goal) => (
              <Link
                key={goal.href}
                href={goal.href}
                className="flex min-h-[5.5rem] flex-col justify-between rounded-2xl border border-black/5 bg-white p-4 shadow-sm transition hover:border-brand-primary/25 hover:shadow-md"
              >
                <p className="text-sm font-semibold leading-snug tracking-tight">{goal.title}</p>
                <p className="mt-3 inline-flex items-center text-xs font-semibold text-brand-primary">
                  {PUBLIC_DIVISION_CARDS.find((d) => d.divisionId === goal.divisionId)?.name.replace(
                    "Morris ",
                    ""
                  )}
                  <ArrowRight className="ml-1 h-3.5 w-3.5" aria-hidden />
                </p>
              </Link>
            ))}
          </div>
        </section>

        <MorrisProtocolSteps
          id="how-it-works"
          className="mt-16 scroll-mt-24 sm:mt-20"
          eyebrow="How Morris works"
          heading="A clear path from first photo to finished job."
          steps={PARENT_PROTOCOL}
        />

        <section id="companies" className="mt-16 scroll-mt-24 sm:mt-20">
          <div className="mb-8 flex flex-col gap-2 sm:mb-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-primary">
              Morris Service Group
            </p>
            <h2 className="font-heading text-3xl font-medium tracking-tight sm:text-4xl">
              Five services. One Morris standard.
            </h2>
            <p className="max-w-2xl text-muted-foreground">
              Morris Service Group LLC is a Missouri property and equipment contractor. Morris Junk
              Removal remains the careful residential and commercial cleanout brand. Land Clearing,
              Site Work, and Equipment Services handle heavier property work.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {PUBLIC_DIVISION_CARDS.map((div) => {
              const status = byId[div.divisionId as DivisionId];
              const canRequest =
                status?.acceptsBookings || status?.acceptsEstimateRequests || status?.acceptsInterest;
              return (
                <article
                  key={div.divisionId}
                  className="flex flex-col rounded-[1.5rem] border border-black/5 bg-white p-6 shadow-sm"
                >
                  {status ? (
                    <CompanyStatusBadge
                      className="max-w-full self-start"
                      divisionStatus={status.launchStatus}
                      label={status.statusLabel}
                    />
                  ) : (
                    <div className="h-7" aria-hidden />
                  )}
                  <h3 className="mt-4 text-xl font-semibold tracking-tight">{div.name}</h3>
                  <p className="mt-2 flex-1 text-sm text-muted-foreground">{div.description}</p>
                  <div className="mt-6 flex flex-col gap-2">
                    <ButtonLink href={div.hubPath} className="h-11 w-full rounded-full">
                      {div.name.replace("Morris ", "")}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </ButtonLink>
                    <ButtonLink
                      href={canRequest ? status?.bookPath ?? `/book?division=${div.divisionId}` : "/contact"}
                      variant="outline"
                      className="h-11 w-full rounded-full"
                    >
                      {status?.bookingCtaLabel ?? "Request an Estimate"}
                    </ButtonLink>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section id="standard" className="mt-16 scroll-mt-24 sm:mt-20">
          <div className="rounded-[1.5rem] border border-black/5 bg-[#0A0A0A] px-5 py-7 text-white sm:px-8 sm:py-10 md:px-10">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">
              <Shield className="h-3.5 w-3.5 text-brand-primary" aria-hidden />
              The Morris Standard
            </div>
            <h2 className="mt-2 max-w-2xl font-heading text-2xl font-medium tracking-tight sm:mt-3 sm:text-3xl md:text-4xl">
              Trust you can inspect — not slogans you have to believe.
            </h2>

            <ul className="mt-5 divide-y divide-white/10 sm:mt-7 sm:grid sm:grid-cols-3 sm:gap-6 sm:divide-y-0">
              {MORRIS_STANDARD_PILLARS.map((pillar) => (
                <li key={pillar.title} className="py-2.5 sm:py-0">
                  <h3 className="text-sm font-semibold leading-5 tracking-tight sm:text-base">
                    {pillar.title}
                  </h3>
                  <p className="mt-0.5 text-xs leading-snug text-white/65 sm:mt-1.5 sm:text-sm sm:leading-relaxed">
                    {pillar.description}
                  </p>
                </li>
              ))}
            </ul>

            <ButtonLink
              href="/about"
              variant="outline"
              className="mt-6 h-10 rounded-full border-white/20 bg-transparent text-sm text-white hover:bg-white/10 hover:text-white sm:mt-8 sm:h-11"
            >
              Read our story
              <ArrowRight className="ml-2 h-4 w-4" />
            </ButtonLink>
          </div>
        </section>

        <section className="mt-20 sm:mt-24">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-primary">
            The Morris Service Network
          </p>
          <h2 className="mt-3 font-heading text-3xl font-medium tracking-tight sm:text-4xl">
            Built as one contractor. Specialized where it matters.
          </h2>
          <p className="mt-3 max-w-xl text-muted-foreground">
            {morrisServicesConfig.tagline} More property and equipment services as our fleet grows.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {PUBLIC_DIVISION_CARDS.map((div) => {
              const status = byId[div.divisionId];
              return (
                <Link
                  key={div.divisionId}
                  href={div.hubPath}
                  className="rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white"
                >
                  {div.name.replace("Morris ", "")}
                  {status?.statusLabel ? ` · ${status.statusLabel}` : ""}
                </Link>
              );
            })}
          </div>
          <p className="mt-5 max-w-xl text-xs leading-relaxed text-muted-foreground">
            Looking ahead: {morrisServicesConfig.futureCapabilities.join(", ").toLowerCase()}. These
            are not offered until they are listed as available services.
          </p>
        </section>

        <section className="mt-20 sm:mt-24">
          <div className="flex flex-col items-start justify-between gap-8 rounded-[1.75rem] border border-black/5 bg-white p-8 shadow-sm sm:flex-row sm:items-center sm:p-10">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-primary">
                Talk with Morris
              </p>
              <h2 className="mt-3 font-heading text-2xl font-medium tracking-tight sm:text-3xl">
                Ready for an estimate or have a question?
              </h2>
              <p className="mt-2 max-w-md text-muted-foreground">{SERVICE_COVERAGE_NOTE}</p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto">
              <a
                href="tel:6367514645"
                onClick={() =>
                  trackMarketingEvent("phone_cta_click", { division: "parent", label: "home_cta" })
                }
                className="inline-flex h-12 min-h-[48px] items-center justify-center gap-2 rounded-full bg-brand-primary px-6 text-base font-semibold text-white shadow-md hover:bg-brand-primary/90"
              >
                <Phone className="h-5 w-5" aria-hidden />
                Call (636) 751-4645
              </a>
              <ButtonLink href="/book" variant="outline" className="h-11 rounded-full">
                Request an Estimate
              </ButtonLink>
            </div>
          </div>
        </section>

        <SocialHomeSection className="mt-16 sm:mt-20" />
        <LatestFromWarrentonJunk className="mt-12" />

        <p className="mt-12 text-center text-xs text-muted-foreground">
          {morrisServicesConfig.parentLegalName} ·{" "}
          <Link href="/about" className="underline-offset-2 hover:underline">
            About
          </Link>
        </p>
      </main>

      <PublicFooter />
      <StickyMobileConcierge />
    </div>
  );
}
