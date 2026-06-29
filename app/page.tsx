"use client";

import { ArrowRight, Building2, Sparkles } from "lucide-react";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { CompanyStatusBadge } from "@/components/public/CompanyStatusBadge";
import { ButtonLink } from "@/components/ui/button-link";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { SectionHeader } from "@/components/morris/SectionHeader";
import { morrisServicesConfig } from "@/lib/morris-services-config";
import { PRELAUNCH_HAULING_INTRO, PRELAUNCH_SCHEDULING_NOTE } from "@/lib/public-copy";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const hauling = morrisServicesConfig.operatingCompanies[0];

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-background">
      <PublicHeader variant="umbrella" />

      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-brand-primary/30 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-primary/20 via-transparent to-transparent" />
        <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center px-4 py-14 text-center sm:py-18 md:py-24 lg:py-28">
          <div className="mb-3 inline-flex max-w-full items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/90 sm:px-4 sm:text-xs">
            <Building2 className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{morrisServicesConfig.parentLegalName}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
            {morrisServicesConfig.publicBrandName}
          </h1>
          <p className="mt-3 max-w-2xl text-lg font-medium text-white/90 sm:mt-4 sm:text-xl md:text-2xl">
            {morrisServicesConfig.tagline}
          </p>
          <p className="mt-2 max-w-xl text-sm text-white/70 sm:text-base">
            {morrisServicesConfig.serviceCategoriesLine}
          </p>
          <ButtonLink
            href="/#companies"
            size="lg"
            className="mt-6 h-12 w-full min-h-[48px] rounded-xl bg-brand-primary px-8 text-base font-semibold hover:bg-brand-primary/90 sm:mt-8 sm:w-auto"
          >
            Explore Services
            <ArrowRight className="ml-2 h-5 w-5" />
          </ButtonLink>
        </div>
      </section>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:py-12 md:py-16">
        <section id="companies" className="scroll-mt-20 sm:scroll-mt-24">
          <SectionHeader
            title="Launching Soon"
            subtitle="Morris Hauling & Junk Removal is the first service company under Morris Services"
            size="lg"
          />
          <PremiumCard className="overflow-hidden border-brand-primary/20 p-0">
            <div className="grid md:grid-cols-2">
              <div className="bg-gradient-to-br from-brand-primary/10 to-brand-primary/5 p-6 sm:p-8 md:p-10">
                <CompanyStatusBadge status="launching_soon" className="mb-4" />
                <h2 className="text-xl font-bold sm:text-2xl md:text-3xl">{hauling.name}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">{hauling.tagline}</p>
                <ul className="mt-5 space-y-2 sm:mt-6">
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
              <div className="flex flex-col justify-center border-t border-border bg-muted/30 p-6 sm:p-8 md:border-l md:border-t-0 md:p-10">
                <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  What to expect
                </p>
                <p className="mt-3 text-base font-medium leading-relaxed sm:text-lg">
                  {PRELAUNCH_HAULING_INTRO}
                </p>
                <p className="mt-4 text-sm text-muted-foreground">
                  {PRELAUNCH_SCHEDULING_NOTE} Online booking preview and an early customer interest
                  list are available before launch.
                </p>
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
            {morrisServicesConfig.futureCompanies.map((co, i) => (
              <PremiumCard
                key={co.name}
                className={cn(
                  "p-5 opacity-0 animate-slide-up sm:p-6",
                  "border-dashed border-border bg-muted/20"
                )}
                style={{ animationDelay: `${i * 0.05}s`, animationFillMode: "forwards" }}
              >
                <CompanyStatusBadge status="coming_soon" className="mb-3" />
                <h3 className="text-lg font-bold">{co.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  A future Morris Services company. No booking or pricing available yet.
                </p>
              </PremiumCard>
            ))}
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
