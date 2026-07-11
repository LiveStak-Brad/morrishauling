"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, Phone } from "lucide-react";
import { CompanyLogo } from "@/components/brand/CompanyLogo";
import { HaulingLogo } from "@/components/brand/HaulingLogo";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { CompanyBreadcrumbBar } from "@/components/public/CompanyBreadcrumbBar";
import { CompanyStatusBadge } from "@/components/public/CompanyStatusBadge";
import { StickyMobileConcierge } from "@/components/public/StickyMobileConcierge";
import { useDivisionPublicStatus } from "@/components/public/useDivisionPublicStatus";
import { useCompany } from "@/lib/company-context";
import { morrisServicesConfig } from "@/lib/morris-services-config";
import {
  HAULING_PROTOCOL,
  JUNK_REMOVAL_SERVICES,
  SERVICE_AREA,
} from "@/lib/public-copy";
import { ButtonLink } from "@/components/ui/button-link";
import { cn } from "@/lib/utils";

/** Flagship division home — status from /admin/divisions (DB). */
export function JunkRemovalHomePage() {
  const { company } = useCompany();
  const tel = company.phone.replace(/\D/g, "");
  const { status: divisionStatus } = useDivisionPublicStatus("junk_removal");
  const canBook =
    divisionStatus?.acceptsBookings || divisionStatus?.acceptsEstimateRequests;
  const bookHref = divisionStatus?.bookPath ?? "/book?division=junk_removal";
  const bookLabel = divisionStatus?.bookingCtaLabel ?? "Request estimate";

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#F7F5F2]">
      <CompanyBreadcrumbBar />
      <PublicHeader variant="company" />

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
            <CompanyLogo
              height={280}
              priority
              href={undefined}
              className="mx-auto w-full max-h-44 sm:max-h-56 md:max-h-64"
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
            Clear the space.
            <br />
            Keep the peace.
          </h1>
          <p
            className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground opacity-0 animate-slide-up sm:text-lg"
            style={{ animationFillMode: "forwards", animationDelay: "0.18s" }}
          >
            Professional junk removal and property cleanouts for {SERVICE_AREA}.
          </p>

          <div
            className="mt-8 flex w-full max-w-md flex-col gap-3 opacity-0 animate-slide-up sm:mt-10 sm:max-w-none sm:flex-row sm:justify-center"
            style={{ animationFillMode: "forwards", animationDelay: "0.24s" }}
          >
            <ButtonLink
              href={canBook ? bookHref : "/contact"}
              size="lg"
              className="h-12 min-h-[48px] w-full rounded-full bg-brand-primary px-8 text-base font-semibold shadow-lg shadow-brand-primary/20 hover:bg-brand-primary/90 sm:w-auto"
            >
              {canBook ? bookLabel : "Contact us"}
              <ArrowRight className="ml-2 h-5 w-5" />
            </ButtonLink>
            <ButtonLink
              href="/services"
              size="lg"
              variant="outline"
              className="h-12 min-h-[48px] w-full rounded-full border-foreground/15 bg-white/70 sm:w-auto"
            >
              View services
            </ButtonLink>
          </div>

          <a
            href={`tel:${tel}`}
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-primary opacity-0 animate-fade-in hover:underline"
            style={{ animationFillMode: "forwards", animationDelay: "0.32s" }}
          >
            <Phone className="h-4 w-4" aria-hidden />
            {company.phone}
          </a>
        </div>
      </section>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-10 md:pb-16 md:pt-14">
        <section className="mt-2 flex flex-col items-center justify-between gap-4 rounded-2xl border border-black/5 bg-white px-5 py-4 shadow-sm sm:flex-row sm:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-primary">Service area</p>
            <p className="mt-0.5 text-sm font-semibold sm:text-base">
              {company.serviceArea.label ?? SERVICE_AREA}
            </p>
          </div>
          <a href={`tel:${tel}`} className="text-base font-bold text-brand-primary hover:underline sm:text-lg">
            {company.phone}
          </a>
        </section>

        <section className="mt-16 sm:mt-20">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-primary">
            The Morris Clear-Out
          </p>
          <h2 className="mt-3 max-w-2xl font-heading text-3xl font-medium tracking-tight sm:text-4xl">
            From clutter to calm — in five deliberate steps.
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

        <section className="mt-16 sm:mt-20">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-primary">
                What we clear
              </p>
              <h2 className="mt-2 font-heading text-3xl font-medium tracking-tight">
                Junk Removal services
              </h2>
            </div>
            <ButtonLink href="/services" variant="link" className="h-auto p-0 font-semibold text-brand-primary">
              View all services →
            </ButtonLink>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {JUNK_REMOVAL_SERVICES.map((name, i) => (
              <li
                key={name}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border border-black/5 bg-white px-4 py-3.5 text-sm font-medium shadow-sm opacity-0 animate-slide-up"
                )}
                style={{ animationDelay: `${i * 0.03}s`, animationFillMode: "forwards" }}
              >
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary" aria-hidden />
                {name}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-16 grid gap-4 sm:mt-20 md:grid-cols-3">
          {[
            {
              title: "See the price before we load",
              desc: "Volume, labor, and disposal explained up front — so you decide with a clear head.",
            },
            {
              title: "Crews that treat your home as a home",
              desc: "Careful loading, respectful presence, and a walkthrough before we leave.",
            },
            {
              title: "Local, on purpose",
              desc: `Built for ${SERVICE_AREA} — under the Morris Services seal.`,
            },
          ].map((item, i) => (
            <div
              key={item.title}
              className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm opacity-0 animate-slide-up"
              style={{ animationDelay: `${i * 0.08}s`, animationFillMode: "forwards" }}
            >
              <h3 className="text-lg font-semibold tracking-tight">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </section>

        <section className="mt-16 sm:mt-20">
          <div className="overflow-hidden rounded-[1.75rem] morris-gradient-bg p-8 text-white sm:p-10 md:p-12">
            <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
              <div className="max-w-lg">
                <p className="text-sm font-semibold text-white/70">Ready when you are</p>
                <h2 className="mt-2 font-heading text-3xl font-medium tracking-tight md:text-4xl">
                  {canBook ? "Start your clear-out online" : "Reach out when you are ready"}
                </h2>
                <ul className="mt-5 space-y-2.5">
                  {[
                    "Upload photos and get a clear estimate",
                    "Choose morning, afternoon, or flexible",
                    "Track progress in your customer portal",
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

        <section className="mt-16 rounded-[1.5rem] border border-dashed border-black/10 bg-white/60 p-6 sm:mt-20 sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-8">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
            <HaulingLogo height={100} className="max-h-20" href="/hauling" />
            <div className="text-center sm:text-left">
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-primary">
                Sister division
              </p>
              <h3 className="mt-1 text-lg font-semibold">Need equipment or materials moved?</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Morris Hauling handles transport between locations — book separately from junk removal.
              </p>
            </div>
          </div>
          <ButtonLink href="/hauling" variant="outline" className="mt-4 h-11 w-full rounded-full sm:mt-0 sm:w-auto">
            Morris Hauling
            <ArrowRight className="ml-2 h-4 w-4" />
          </ButtonLink>
        </section>

        <section className="py-12 text-center">
          <CompanyLogo height={140} className="mx-auto max-h-28 sm:max-h-32" href="/junk-removal" />
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

      <PublicFooter variant="company" />
      <StickyMobileConcierge />
    </div>
  );
}
