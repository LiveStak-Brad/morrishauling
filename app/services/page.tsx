"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { CompanyBreadcrumbBar } from "@/components/public/CompanyBreadcrumbBar";
import { StickyMobileConcierge } from "@/components/public/StickyMobileConcierge";
import { ButtonLink } from "@/components/ui/button-link";
import { useCompany } from "@/lib/company-context";
import { SERVICES_INTRO } from "@/lib/public-copy";
import { BOOKING_CATEGORIES } from "@/lib/booking-categories";
import { cn } from "@/lib/utils";

export default function ServicesPage() {
  const { company } = useCompany();

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#F7F5F2]">
      <PublicHeader variant="company" />
      <CompanyBreadcrumbBar />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 pb-28 sm:px-6 md:py-14">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-primary">
          Services
        </p>
        <h1 className="mt-3 font-heading text-4xl font-medium tracking-tight sm:text-5xl">
          What we restore
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          {SERVICES_INTRO}
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {company.services.map((s, i) => (
            <article
              key={s.id}
              className="group rounded-[1.25rem] border border-black/5 bg-white p-6 shadow-sm transition hover:border-brand-primary/20 hover:shadow-md opacity-0 animate-slide-up"
              style={{ animationDelay: `${i * 0.05}s`, animationFillMode: "forwards" }}
            >
              <h2 className="text-lg font-semibold tracking-tight">{s.name}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.description}</p>
              <Link
                href={`/book?division=junk_removal`}
                className="mt-4 inline-flex items-center text-sm font-semibold text-brand-primary opacity-0 transition group-hover:opacity-100"
              >
                Book this service
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>

        <section className="mt-14">
          <h2 className="font-heading text-2xl font-medium tracking-tight">Common clear-outs</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Tap a category to start booking with that intent selected.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {BOOKING_CATEGORIES.slice(0, 8).map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.id}
                  href={`/book?division=junk_removal&category=${cat.id}`}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-2xl border border-black/5 bg-white p-4 text-center shadow-sm transition hover:border-brand-primary/25"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl text-white",
                      cat.iconBg
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-semibold">{cat.name}</span>
                </Link>
              );
            })}
          </div>
        </section>

        <div className="mt-12 flex flex-col gap-3 rounded-[1.25rem] bg-[#0A0A0A] p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <h2 className="text-lg font-semibold">Ready to clear the space?</h2>
            <p className="mt-1 text-sm text-white/65">Book online — photos, estimate, and scheduling in one flow.</p>
          </div>
          <ButtonLink
            href="/book?division=junk_removal"
            className="h-11 shrink-0 rounded-full bg-white text-brand-primary hover:bg-white/90"
          >
            Book now
            <ArrowRight className="ml-2 h-4 w-4" />
          </ButtonLink>
        </div>
      </main>
      <PublicFooter variant="company" />
      <StickyMobileConcierge />
    </div>
  );
}
