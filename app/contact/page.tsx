"use client";

import Link from "next/link";
import { ArrowRight, Mail, Phone } from "lucide-react";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { StickyMobileConcierge } from "@/components/public/StickyMobileConcierge";
import { FacebookFollow } from "@/components/seo/FacebookFollow";
import { ButtonLink } from "@/components/ui/button-link";
import { useCompany } from "@/lib/company-context";
import { morrisServicesConfig } from "@/lib/morris-services-config";
import { SERVICE_AREA, SCHEDULING_NOTE } from "@/lib/public-copy";

export default function ContactPage() {
  const { company } = useCompany();
  const tel = company.phone.replace(/\D/g, "");
  const junk = morrisServicesConfig.operatingCompanies[0];
  const hauling = morrisServicesConfig.haulingDivision;

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#F7F5F2]">
      <PublicHeader variant="umbrella" />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 pb-28 sm:px-6 md:py-16">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-primary">
          Concierge
        </p>
        <h1 className="mt-3 font-heading text-4xl font-medium tracking-tight sm:text-5xl">
          We&apos;re here.
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
          {morrisServicesConfig.publicBrandName} — Junk Removal and Hauling across {SERVICE_AREA}.{" "}
          {SCHEDULING_NOTE}
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <a
            href={`tel:${tel}`}
            className="group flex flex-col rounded-[1.25rem] border border-black/5 bg-white p-6 shadow-sm transition hover:border-brand-primary/25 hover:shadow-md"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
              <Phone className="h-5 w-5" aria-hidden />
            </span>
            <h2 className="mt-5 text-lg font-semibold tracking-tight">Call</h2>
            <p className="mt-1 text-sm text-muted-foreground">Scheduling, quotes, and same-day questions.</p>
            <p className="mt-4 text-xl font-semibold text-brand-primary group-hover:underline">
              {company.phone}
            </p>
          </a>

          <div className="flex flex-col rounded-[1.25rem] border border-black/5 bg-white p-6 shadow-sm">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
              <Mail className="h-5 w-5" aria-hidden />
            </span>
            <h2 className="mt-5 text-lg font-semibold tracking-tight">Book online</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Request Junk Removal or Hauling, upload photos, and pick a window.
            </p>
            <ButtonLink href="/book" className="mt-5 h-11 w-full rounded-full sm:w-auto">
              Book service
              <ArrowRight className="ml-2 h-4 w-4" />
            </ButtonLink>
          </div>
        </div>

        <section className="mt-8 rounded-[1.25rem] border border-black/5 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-lg font-semibold tracking-tight">Divisions</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {junk.name} and {hauling.name} — book the craft you need.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href={junk.hubPath} className="h-11 rounded-full">
              Junk Removal
              <ArrowRight className="ml-2 h-4 w-4" />
            </ButtonLink>
            <ButtonLink href={hauling.hubPath} variant="outline" className="h-11 rounded-full">
              Hauling
            </ButtonLink>
            <ButtonLink href="/careers" variant="outline" className="h-11 rounded-full">
              Careers
            </ButtonLink>
          </div>
        </section>

        <section className="mt-8">
          <FacebookFollow />
        </section>

        <p className="mt-10 text-sm text-muted-foreground">
          Typical reply during business hours: same day. After hours: next morning.
        </p>

        <p className="mt-8 text-sm text-muted-foreground">
          <Link href="/" className="font-medium text-brand-primary hover:underline">
            ← Back to {morrisServicesConfig.publicBrandName}
          </Link>
        </p>
      </main>
      <PublicFooter />
      <StickyMobileConcierge />
    </div>
  );
}
