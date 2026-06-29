"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  MapPin,
  Rocket,
  Truck,
  CheckCircle2,
  ClipboardList,
  Settings2,
} from "lucide-react";
import { CompanyLogo } from "@/components/brand/CompanyLogo";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { CompanyBreadcrumbBar } from "@/components/public/CompanyBreadcrumbBar";
import { CompanyStatusBadge } from "@/components/public/CompanyStatusBadge";
import { HeroBanner, ServiceAreaStrip } from "@/components/public/HeroBanner";
import { useCompany } from "@/lib/company-context";
import { morrisServicesConfig } from "@/lib/morris-services-config";
import {
  PRELAUNCH_HAULING_INTRO,
  PRELAUNCH_SCHEDULING_NOTE,
  PRELAUNCH_SERVICE_AREA,
} from "@/lib/public-copy";
import { ButtonLink } from "@/components/ui/button-link";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { SectionHeader } from "@/components/morris/SectionHeader";
import { BOOKING_CATEGORIES } from "@/lib/booking-categories";
import { cn } from "@/lib/utils";

export function HaulingHomePage() {
  const { company } = useCompany();

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-background">
      <CompanyBreadcrumbBar />
      <HeroBanner>
        <PublicHeader variant="company" floating="desktop" />
        <section className="relative mx-auto flex w-full max-w-6xl flex-col px-4 pb-6 pt-3 lg:mt-auto lg:pb-12 lg:pt-28">
          <div
            className="w-full md:ml-auto md:max-w-md lg:max-w-lg animate-slide-up opacity-0"
            style={{ animationFillMode: "forwards" }}
          >
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/70 md:mb-3">
              A {morrisServicesConfig.publicBrandName} Company
            </p>
            <div className="rounded-2xl bg-[#1a1a1a]/90 p-4 ring-1 ring-white/15 backdrop-blur-md sm:p-5 md:bg-black/50 md:p-6">
              <div className="mb-4">
                <CompanyStatusBadge
                  status="launching_soon"
                  className="border-amber-400/40 bg-amber-500/15 text-amber-100"
                />
              </div>

              <p className="text-base font-semibold leading-snug text-white sm:text-lg md:text-xl">
                Launching soon — preparing to serve {PRELAUNCH_SERVICE_AREA}.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-white/80 sm:mt-3">{PRELAUNCH_SCHEDULING_NOTE}</p>

              <div className="mt-4 flex flex-col gap-2.5 sm:mt-5 sm:flex-row sm:gap-3">
                <ButtonLink
                  href="/book"
                  size="lg"
                  className="h-12 min-h-[48px] w-full flex-1 rounded-xl bg-brand-primary text-base font-semibold shadow-lg hover:bg-brand-primary/90 sm:h-12"
                >
                  Booking &amp; early interest
                  <ArrowRight className="ml-2 h-5 w-5" />
                </ButtonLink>
                <ButtonLink
                  href="/book?preview=1"
                  size="lg"
                  variant="outline"
                  className="h-12 min-h-[48px] w-full rounded-xl border-white/35 bg-white/10 text-base font-semibold text-white hover:bg-white/20 hover:text-white sm:h-12 sm:w-auto sm:flex-1"
                >
                  Online booking preview
                </ButtonLink>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 sm:mt-4">
              {[
                { value: "Soon", label: "Launching", icon: Rocket },
                { value: "MO", label: "Service area", icon: MapPin },
                { value: "Preview", label: "Online booking", icon: CalendarClock },
              ].map((stat, i) => (
                <div
                  key={stat.label}
                  className="animate-slide-up rounded-xl bg-black/40 px-2 py-2.5 text-center ring-1 ring-white/10 backdrop-blur-sm opacity-0"
                  style={{
                    animationDelay: `${0.08 + i * 0.05}s`,
                    animationFillMode: "forwards",
                  }}
                >
                  <stat.icon className="mx-auto mb-1 h-4 w-4 text-white/70" />
                  <p className="text-sm font-bold text-white">{stat.value}</p>
                  <p className="text-[9px] font-medium uppercase tracking-wide text-white/65">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </HeroBanner>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 md:pb-16">
        <section className="py-6">
          <PremiumCard className="border-amber-200/60 bg-amber-50/80 p-4 text-sm text-amber-950">
            <p className="font-semibold">Prelaunch notice</p>
            <p className="mt-1 leading-relaxed">{PRELAUNCH_HAULING_INTRO}</p>
          </PremiumCard>
        </section>

        <section className="py-2">
          <ServiceAreaStrip />
        </section>

        <section className="py-8">
          <SectionHeader
            title="What we're building"
            subtitle={`Professional junk removal planned for ${PRELAUNCH_SERVICE_AREA}`}
            size="lg"
          />
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                icon: ClipboardList,
                title: "Transparent estimates",
                desc: "Upfront pricing tools and booking flows are being prepared before we go live.",
                color: "from-orange-500/20 to-orange-600/5",
              },
              {
                icon: Settings2,
                title: "Scheduling & dispatch",
                desc: "A professional scheduling and dispatch system is being built for launch day operations.",
                color: "from-blue-500/20 to-blue-600/5",
              },
              {
                icon: MapPin,
                title: "Local focus",
                desc: `Preparing to serve ${PRELAUNCH_SERVICE_AREA}.`,
                color: "from-green-500/20 to-green-600/5",
              },
            ].map((item, i) => (
              <PremiumCard
                key={item.title}
                className={cn(
                  "bg-gradient-to-br p-6",
                  item.color,
                  "animate-slide-up opacity-0"
                )}
                style={{ animationDelay: `${i * 0.08}s`, animationFillMode: "forwards" } as React.CSSProperties}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-primary text-white shadow-md">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
              </PremiumCard>
            ))}
          </div>
        </section>

        <section className="py-6">
          <SectionHeader
            title="Planned services"
            subtitle="Preview service categories in our online booking experience"
            action={
              <ButtonLink href="/book?preview=1" variant="link" className="font-semibold text-brand-primary">
                Preview booking →
              </ButtonLink>
            }
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {BOOKING_CATEGORIES.slice(0, 8).map((cat, i) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.id}
                  href={`/book?preview=1&category=${cat.id}`}
                  className={cn(
                    "group flex flex-col items-center gap-2 rounded-2xl border border-transparent p-4 text-center transition-all",
                    "bg-gradient-to-br hover:border-brand-primary/20 hover:shadow-md",
                    cat.gradient,
                    "animate-scale-in opacity-0"
                  )}
                  style={{ animationDelay: `${i * 0.04}s`, animationFillMode: "forwards" }}
                >
                  <div
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm transition-transform group-hover:scale-110",
                      cat.iconBg
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-semibold leading-tight">{cat.name}</span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="py-8">
          <PremiumCard className="overflow-hidden p-0">
            <div className="morris-gradient-bg p-8 text-white md:p-10">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    <span className="text-sm font-semibold text-white/80">Before we launch</span>
                  </div>
                  <h2 className="text-2xl font-bold md:text-3xl">Online booking preview</h2>
                  <ul className="mt-4 space-y-2">
                    {[
                      "Walk through planned estimate steps",
                      "Preview scheduling screens",
                      "Submissions disabled until launch",
                    ].map((t) => (
                      <li key={t} className="flex items-center gap-2 text-sm text-white/90">
                        <CheckCircle2 className="h-4 w-4 text-white/70" />
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
                <ButtonLink
                  href="/book?preview=1"
                  size="lg"
                  className="h-14 shrink-0 rounded-2xl bg-white px-8 font-bold text-brand-primary hover:bg-white/90"
                >
                  Preview booking
                </ButtonLink>
              </div>
            </div>
          </PremiumCard>
        </section>

        <section className="py-8 text-center">
          <CompanyLogo height={64} width={220} className="mx-auto !h-16 !w-16" />
          <p className="mt-2 text-xs font-medium text-muted-foreground">
            A {morrisServicesConfig.publicBrandName} Company
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Preparing to serve {company.serviceArea.label ?? PRELAUNCH_SERVICE_AREA} · {company.phone}
          </p>
        </section>
      </main>

      <PublicFooter variant="company" />
    </div>
  );
}
