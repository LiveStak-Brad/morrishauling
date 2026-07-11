"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin, Phone, Shield } from "lucide-react";
import { MorrisServicesLogo } from "@/components/brand/MorrisServicesLogo";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { CompanyStatusBadge } from "@/components/public/CompanyStatusBadge";
import { StickyMobileConcierge } from "@/components/public/StickyMobileConcierge";
import { FacebookFollow } from "@/components/seo/FacebookFollow";
import { useDivisionPublicStatus } from "@/components/public/useDivisionPublicStatus";
import { ButtonLink } from "@/components/ui/button-link";
import { morrisServicesConfig } from "@/lib/morris-services-config";
import {
  HAULING_PROTOCOL,
  MORRIS_STANDARD_PILLARS,
  SERVICE_AREA,
} from "@/lib/public-copy";
import { trackMarketingEvent } from "@/lib/seo/analytics";

export function MorrisServicesHomePage() {
  const junk = morrisServicesConfig.operatingCompanies[0];
  const hauling = morrisServicesConfig.haulingDivision;
  const { status: junkStatus } = useDivisionPublicStatus("junk_removal");
  const { status: haulingStatus } = useDivisionPublicStatus("hauling");
  const junkCanBook = junkStatus?.acceptsBookings || junkStatus?.acceptsEstimateRequests;
  const haulingCanBook =
    haulingStatus?.acceptsBookings || haulingStatus?.acceptsEstimateRequests;

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
            {morrisServicesConfig.publicBrandName}
          </p>

          <div
            className="mt-6 w-full max-w-2xl animate-slide-up opacity-0 sm:mt-8"
            style={{ animationFillMode: "forwards", animationDelay: "0.05s" }}
          >
            <MorrisServicesLogo
              height={220}
              href={undefined}
              priority
              className="mx-auto w-full max-h-36 sm:max-h-44 md:max-h-52"
            />
          </div>

          <h1
            className="mt-8 max-w-3xl font-heading text-4xl font-medium leading-[1.1] tracking-tight text-foreground opacity-0 animate-slide-up sm:mt-10 sm:text-5xl md:text-6xl"
            style={{ animationFillMode: "forwards", animationDelay: "0.12s" }}
          >
            {morrisServicesConfig.promise}
          </h1>
          <p
            className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground opacity-0 animate-slide-up sm:text-lg"
            style={{ animationFillMode: "forwards", animationDelay: "0.18s" }}
          >
            {morrisServicesConfig.tagline} Junk Removal and Hauling across {SERVICE_AREA}.
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
              Request an estimate
              <ArrowRight className="ml-2 h-5 w-5" />
            </ButtonLink>
            <ButtonLink
              href="/#companies"
              size="lg"
              variant="outline"
              className="h-12 min-h-[48px] w-full rounded-full border-foreground/15 bg-white/70 sm:w-auto"
            >
              Choose a service
            </ButtonLink>
          </div>

          <p
            className="mt-6 flex items-center gap-2 text-sm text-muted-foreground opacity-0 animate-fade-in"
            style={{ animationFillMode: "forwards", animationDelay: "0.35s" }}
          >
            <MapPin className="h-4 w-4 text-brand-primary" aria-hidden />
            {SERVICE_AREA}
          </p>
        </div>
      </section>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-14 sm:pt-16 md:pb-20 md:pt-20">
        <section id="how-it-works" className="scroll-mt-24">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-primary">
            How Morris works
          </p>
          <h2 className="mt-3 max-w-2xl font-heading text-3xl font-medium tracking-tight sm:text-4xl">
            A calm protocol for every craft we add.
          </h2>
          <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {HAULING_PROTOCOL.map((item, i) => (
              <li
                key={item.step}
                className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm opacity-0 animate-slide-up"
                style={{ animationDelay: `${0.05 * i}s`, animationFillMode: "forwards" }}
              >
                <span className="font-mono text-xs font-semibold text-brand-primary">{item.step}</span>
                <h3 className="mt-3 text-base font-semibold tracking-tight">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="companies" className="mt-20 scroll-mt-24 sm:mt-24">
          <div className="mb-8 flex flex-col gap-2 sm:mb-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-primary">
              Operating now
            </p>
            <h2 className="font-heading text-3xl font-medium tracking-tight sm:text-4xl">
              One parent company. Focused operating divisions.
            </h2>
            <p className="max-w-2xl text-muted-foreground">
              Morris Service Group LLC is the parent. Morris Junk Removal owns junk removal
              searches. Morris Hauling owns equipment and material transport. Future crafts will
              join the same family — without competing for the same keywords.
            </p>
          </div>

          <div className="overflow-hidden rounded-[1.75rem] border border-black/5 bg-white shadow-[0_24px_80px_-40px_rgba(10,10,10,0.35)]">
            <div className="grid lg:grid-cols-12">
              <div className="flex flex-col items-center justify-center bg-gradient-to-br from-brand-primary/8 via-white to-[#F7F5F2] p-8 text-center lg:col-span-5 lg:p-12">
                <Image
                  src="/logo.png?v=4"
                  alt={junk.name}
                  width={1146}
                  height={758}
                  priority
                  unoptimized
                  className="h-auto w-full max-w-[16rem] object-contain sm:max-w-[18rem] md:max-w-[20rem]"
                  sizes="320px"
                />
                <CompanyStatusBadge
                  divisionStatus={junkStatus?.launchStatus ?? "setup"}
                  label={junkStatus?.statusLabel}
                  className="mt-6"
                />
                <p className="mt-4 font-heading text-2xl font-medium text-foreground sm:text-3xl">
                  {junk.tagline}
                </p>
              </div>

              <div className="flex flex-col justify-center border-t border-black/5 p-6 sm:p-8 lg:col-span-7 lg:border-l lg:border-t-0 lg:p-10 xl:p-12">
                <h3 className="text-xl font-semibold tracking-tight sm:text-2xl">{junk.name}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                  Residential and commercial junk removal, estate and garage cleanouts, furniture,
                  appliances, and full property clearances — under the Morris Standard.
                </p>
                <ul className="mt-6 grid gap-2 sm:grid-cols-2">
                  {junk.services.slice(0, 8).map((service) => (
                    <li key={service} className="flex items-center gap-2 text-sm text-foreground/90">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary" aria-hidden />
                      {service}
                    </li>
                  ))}
                </ul>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <ButtonLink href={junk.hubPath} className="h-11 rounded-full px-6">
                    Enter Junk Removal
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </ButtonLink>
                  <ButtonLink
                    href={junkCanBook ? junkStatus?.bookPath ?? "/book?division=junk_removal" : "/contact"}
                    variant="outline"
                    className="h-11 rounded-full px-6"
                  >
                    {junkCanBook ? junkStatus?.bookingCtaLabel ?? "Request estimate" : "Contact us"}
                  </ButtonLink>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="overflow-hidden rounded-[1.5rem] border border-black/5 bg-white shadow-sm sm:flex sm:items-center sm:justify-between">
            <div className="flex flex-col items-center gap-4 p-6 sm:flex-row sm:items-center sm:gap-6 sm:p-8">
              <Image
                src="/haulinglogo.png?v=1"
                alt={hauling.name}
                width={1139}
                height={754}
                unoptimized
                className="h-auto w-full max-w-[9rem] object-contain sm:max-w-[10rem]"
                sizes="160px"
              />
              <div className="text-center sm:text-left">
                <CompanyStatusBadge
                  divisionStatus={haulingStatus?.launchStatus ?? "setup"}
                  label={haulingStatus?.statusLabel}
                />
                <h3 className="mt-3 text-xl font-semibold tracking-tight">{hauling.name}</h3>
                <p className="mt-2 max-w-xl text-sm text-muted-foreground">{hauling.tagline}</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 border-t border-black/5 px-6 pb-6 sm:border-t-0 sm:px-8 sm:pb-0 sm:pr-8">
              <ButtonLink href={hauling.hubPath} className="h-11 w-full rounded-full sm:w-auto">
                Enter Hauling
                <ArrowRight className="ml-2 h-4 w-4" />
              </ButtonLink>
              <ButtonLink
                href={
                  haulingCanBook
                    ? haulingStatus?.bookPath ?? "/book?division=hauling"
                    : "/contact"
                }
                variant="outline"
                className="h-11 w-full rounded-full sm:w-auto"
              >
                {haulingCanBook
                  ? haulingStatus?.bookingCtaLabel ?? "Request estimate"
                  : "Contact us"}
              </ButtonLink>
            </div>
          </div>
        </section>

        <section id="standard" className="mt-20 scroll-mt-24 sm:mt-24">
          <div className="rounded-[1.75rem] border border-black/5 bg-[#0A0A0A] px-6 py-10 text-white sm:px-10 sm:py-14 md:px-14">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/50">
              <Shield className="h-3.5 w-3.5 text-brand-primary" aria-hidden />
              The Morris Standard
            </div>
            <h2 className="mt-4 max-w-2xl font-heading text-3xl font-medium tracking-tight sm:text-4xl">
              Trust you can inspect — not slogans you have to believe.
            </h2>
            <div className="mt-10 grid gap-8 md:grid-cols-3">
              {MORRIS_STANDARD_PILLARS.map((pillar) => (
                <div key={pillar.title}>
                  <h3 className="text-lg font-semibold">{pillar.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/65">{pillar.description}</p>
                </div>
              ))}
            </div>
            <ButtonLink
              href="/about"
              variant="outline"
              className="mt-10 h-11 rounded-full border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              Read our story
              <ArrowRight className="ml-2 h-4 w-4" />
            </ButtonLink>
          </div>
        </section>

        <section className="mt-20 sm:mt-24">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-primary">
            The Morris Atlas
          </p>
          <h2 className="mt-3 font-heading text-3xl font-medium tracking-tight sm:text-4xl">
            More crafts. Same seal.
          </h2>
          <p className="mt-3 max-w-xl text-muted-foreground">
            We open one division at a time — fully — before the next.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            <Link
              href="/junk-removal"
              className="rounded-full bg-brand-primary px-4 py-2 text-sm font-semibold text-white"
            >
              Junk Removal · booking
            </Link>
            <Link
              href="/hauling"
              className="rounded-full bg-brand-primary/90 px-4 py-2 text-sm font-semibold text-white"
            >
              Hauling · booking
            </Link>
            {morrisServicesConfig.futureCompanies.map((co) => (
              <span
                key={co.name}
                className="rounded-full border border-black/10 bg-white/80 px-4 py-2 text-sm text-muted-foreground"
              >
                {co.craft}
              </span>
            ))}
          </div>
        </section>

        <section className="mt-20 sm:mt-24">
          <div className="flex flex-col items-start justify-between gap-8 rounded-[1.75rem] border border-black/5 bg-white p-8 shadow-sm sm:flex-row sm:items-center sm:p-10">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-primary">
                Concierge
              </p>
              <h2 className="mt-3 font-heading text-2xl font-medium tracking-tight sm:text-3xl">
                Ready for an estimate or have a question?
              </h2>
              <p className="mt-2 max-w-md text-muted-foreground">
                Call for scheduling, commercial accounts, or careers.
              </p>
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
                Request an estimate
              </ButtonLink>
            </div>
          </div>
        </section>

        <section className="mt-12">
          <FacebookFollow />
        </section>

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
