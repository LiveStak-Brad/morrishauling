"use client";

import Image from "next/image";
import {
  ArrowRight,
  Building2,
  MapPin,
  Rocket,
  Sparkles,
  Sprout,
  Snowflake,
  Droplets,
  Home,
  Layers,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { MorrisServicesLogo } from "@/components/brand/MorrisServicesLogo";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { CompanyStatusBadge } from "@/components/public/CompanyStatusBadge";
import { ButtonLink } from "@/components/ui/button-link";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { SectionHeader } from "@/components/morris/SectionHeader";
import { morrisServicesConfig } from "@/lib/morris-services-config";
import { PRELAUNCH_HAULING_INTRO, PRELAUNCH_SCHEDULING_NOTE } from "@/lib/public-copy";
import { cn } from "@/lib/utils";

const futureCompanyIcons: Record<string, LucideIcon> = {
  "Morris Window Cleaning": Layers,
  "Morris Pressure Washing": Droplets,
  "Morris Landscaping": Sprout,
  "Morris Gutter Cleaning": Home,
  "Morris Snow Removal": Snowflake,
};

export function MorrisServicesHomePage() {
  const hauling = morrisServicesConfig.operatingCompanies[0];

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-background">
      <PublicHeader variant="umbrella" />

      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-brand-primary/35 text-white">
        <div className="morris-hero-pattern pointer-events-none absolute inset-0 opacity-70" aria-hidden />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(155,27,48,0.22)_0%,transparent_55%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-24 top-1/4 h-72 w-72 rounded-full bg-brand-primary/15 blur-3xl"
          aria-hidden
        />

        <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center px-4 py-14 text-center sm:py-16 md:py-20 lg:py-28">
          <div
            className="w-full max-w-2xl animate-slide-up opacity-0"
            style={{ animationFillMode: "forwards" }}
          >
            <MorrisServicesLogo
              height={180}
              href={undefined}
              priority
              className="mx-auto w-full max-h-44 sm:max-h-52 md:max-h-60 lg:max-h-72"
            />
          </div>

          <p className="mt-6 max-w-2xl text-sm font-semibold uppercase tracking-[0.18em] text-brand-primary sm:mt-8 sm:text-base">
            {morrisServicesConfig.brandTagline}
          </p>
          <h1 className="sr-only">{morrisServicesConfig.publicBrandName}</h1>
          <p className="mt-4 max-w-2xl text-lg font-medium leading-snug text-white/90 sm:text-xl md:text-2xl">
            {morrisServicesConfig.tagline}
          </p>
          <p className="mt-2 max-w-xl text-sm text-white/65 sm:text-base">
            {morrisServicesConfig.serviceCategoriesLine}
          </p>

          <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-medium text-white/80 sm:px-4 sm:text-xs">
            <Building2 className="h-3.5 w-3.5 shrink-0 text-brand-primary" />
            <span className="truncate">{morrisServicesConfig.parentLegalName}</span>
          </div>

          <div className="mt-8 flex w-full max-w-md flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
            <ButtonLink
              href="/#companies"
              size="lg"
              className="h-12 min-h-[48px] w-full rounded-xl bg-brand-primary px-8 text-base font-semibold shadow-lg hover:bg-brand-primary/90 sm:w-auto"
            >
              Explore Services
              <ArrowRight className="ml-2 h-5 w-5" />
            </ButtonLink>
            <ButtonLink
              href="/about"
              size="lg"
              variant="outline"
              className="h-12 min-h-[48px] w-full rounded-xl border-white/35 bg-white/10 text-base font-semibold text-white hover:bg-white/20 hover:text-white sm:w-auto"
            >
              About Us
            </ButtonLink>
          </div>

          <div className="mt-10 grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            {[
              { icon: Rocket, label: "1 company preparing for launch" },
              { icon: MapPin, label: "Missouri service area" },
              { icon: Sparkles, label: "More brands on the horizon" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-xs font-medium text-white/85 backdrop-blur-sm sm:text-sm"
              >
                <Icon className="h-4 w-4 shrink-0 text-brand-primary" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:py-12 md:py-16">
        <section id="companies" className="scroll-mt-20 sm:scroll-mt-24">
          <SectionHeader
            title="Launching Soon"
            subtitle="Morris Hauling & Junk Removal is the first service company under Morris Services"
            size="lg"
          />
          <PremiumCard className="overflow-hidden border-brand-primary/20 p-0" glow>
            <div className="grid lg:grid-cols-5">
              <div className="flex flex-col items-center bg-gradient-to-br from-brand-primary/12 via-brand-primary/5 to-transparent p-6 text-center sm:p-8 lg:col-span-2 lg:items-start lg:text-left">
                <div className="relative mb-5">
                  <div className="absolute -inset-2 rounded-full bg-brand-primary/20 blur-xl" aria-hidden />
                  <Image
                    src="/logo.png"
                    alt={hauling.name}
                    width={120}
                    height={120}
                    className="relative h-24 w-24 rounded-full object-cover object-center ring-4 ring-white shadow-lg sm:h-28 sm:w-28"
                  />
                </div>
                <CompanyStatusBadge status="launching_soon" className="mb-4" />
                <h2 className="text-xl font-bold sm:text-2xl md:text-3xl">{hauling.name}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">{hauling.tagline}</p>
                <ul className="mt-5 w-full space-y-2 sm:mt-6">
                  {hauling.services.map((service) => (
                    <li key={service} className="flex items-center gap-2 text-sm">
                      <Sparkles className="h-4 w-4 shrink-0 text-brand-primary" />
                      {service}
                    </li>
                  ))}
                </ul>
                <ButtonLink href={hauling.hubPath} className="mt-6 h-11 w-full rounded-xl sm:mt-8 sm:w-auto">
                  Visit Website
                  <ArrowRight className="ml-2 h-4 w-4" />
                </ButtonLink>
              </div>
              <div className="flex flex-col justify-center border-t border-border bg-muted/20 p-6 sm:p-8 lg:col-span-3 lg:border-l lg:border-t-0 lg:p-10">
                <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">What to expect</p>
                <p className="mt-3 text-base font-medium leading-relaxed sm:text-lg">{PRELAUNCH_HAULING_INTRO}</p>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {PRELAUNCH_SCHEDULING_NOTE} Online booking preview and an early customer interest list are
                  available before launch.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {["Booking preview", "Early interest list", "Careers"].map((chip) => (
                    <span
                      key={chip}
                      className="rounded-full border border-brand-primary/20 bg-brand-primary/5 px-3 py-1 text-xs font-semibold text-brand-primary"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </PremiumCard>
        </section>

        <section className="mt-12 sm:mt-16 md:mt-20">
          <SectionHeader
            title="Growing Every Year"
            subtitle="Future Morris Services companies — realistic expansions on the horizon"
            size="lg"
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {morrisServicesConfig.futureCompanies.map((co, i) => {
              const Icon = futureCompanyIcons[co.name] ?? Building2;
              return (
                <PremiumCard
                  key={co.name}
                  className={cn(
                    "p-5 opacity-0 animate-slide-up sm:p-6",
                    "border-dashed border-border bg-muted/20"
                  )}
                  style={{ animationDelay: `${i * 0.05}s`, animationFillMode: "forwards" }}
                >
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-primary/10">
                    <Icon className="h-5 w-5 text-brand-primary" />
                  </div>
                  <CompanyStatusBadge status="coming_soon" className="mb-3" />
                  <h3 className="text-lg font-bold">{co.name}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    A future Morris Services company. No booking or pricing available yet.
                  </p>
                </PremiumCard>
              );
            })}
          </div>
        </section>

        <PremiumCard className="mt-12 overflow-hidden border-brand-primary/15 bg-gradient-to-r from-brand-primary/5 via-white to-brand-primary/5 p-6 sm:mt-16 sm:p-8 md:mt-20">
          <div className="flex flex-col items-center gap-6 text-center md:flex-row md:text-left">
            <MorrisServicesLogo height={80} href={undefined} className="shrink-0 max-h-16 md:max-h-20" />
            <div className="flex-1">
              <p className="text-lg font-bold sm:text-xl">{morrisServicesConfig.footerMission}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Questions before launch?{" "}
                <ButtonLink href="/contact" variant="link" className="h-auto p-0 text-brand-primary">
                  Get in touch
                </ButtonLink>
              </p>
            </div>
            <ButtonLink href="/contact" className="h-11 shrink-0 rounded-xl px-6">
              Contact Us
              <ArrowRight className="ml-2 h-4 w-4" />
            </ButtonLink>
          </div>
        </PremiumCard>
      </main>

      <PublicFooter />
    </div>
  );
}
