"use client";

import { ArrowRight } from "lucide-react";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { CompanyBreadcrumbBar } from "@/components/public/CompanyBreadcrumbBar";
import { StickyMobileConcierge } from "@/components/public/StickyMobileConcierge";
import { ButtonLink } from "@/components/ui/button-link";
import { useCompany } from "@/lib/company-context";
import { useEffectivePricing } from "@/hooks/useEffectivePricing";
import { PRICING_NOTE, SERVICE_AREA } from "@/lib/public-copy";
import { cn } from "@/lib/utils";
import { SocialFollowStrip } from "@/components/social/SocialFollowStrip";
import { RelatedAuthorityLinks } from "@/components/authority/RelatedAuthorityLinks";
import { AuthoritySpotlightClient } from "@/components/authority/AuthoritySpotlightClient";

const EXAMPLE_JOBS = [
  {
    title: "Half-garage clear-out",
    detail: "Furniture, boxes, and yard waste — driveway access.",
    hint: "Often lands near a mid load tier before modifiers.",
  },
  {
    title: "Appliance haul",
    detail: "Fridge or washer from a main floor — freon rules may apply.",
    hint: "Smaller volume; specialty disposal can change the total.",
  },
  {
    title: "Estate cleanout",
    detail: "Full property, stairs, longer walk — scoped carefully.",
    hint: "Access modifiers and time matter as much as volume.",
  },
];

export default function PricingPage() {
  const { company, companyId } = useCompany();
  const { estimateConfig, loading } = useEffectivePricing(companyId);
  const { pricingRules } = estimateConfig;

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#F7F5F2]">
      <PublicHeader variant="company" />
      <CompanyBreadcrumbBar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 pb-28 sm:px-6 md:py-14">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-primary">
          Pricing
        </p>
        <h1 className="mt-3 font-heading text-4xl font-medium tracking-tight sm:text-5xl">
          How pricing works
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Transparent rates for {company.companyName}. Your estimate is based on volume, access, and
          disposal — confirmed before we load.
        </p>

        <div className="mt-8 rounded-[1.25rem] border border-black/5 bg-white p-5 shadow-sm sm:p-6">
          <p className="font-semibold text-brand-primary">Clear estimates</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{PRICING_NOTE}</p>
          <p className="mt-2 text-xs text-muted-foreground">Serving {SERVICE_AREA}.</p>
        </div>

        <section className="mt-12">
          <h2 className="font-heading text-2xl font-medium tracking-tight">Three things that set the price</h2>
          <ol className="mt-6 space-y-4">
            {[
              {
                n: "01",
                t: "How full the truck is",
                d: "Volume is the backbone — we price by load tier, not mystery bundles.",
              },
              {
                n: "02",
                t: "How hard it is to reach",
                d: "Stairs, long carries, and tight access add labor. We show those modifiers.",
              },
              {
                n: "03",
                t: "What it costs to dispose",
                d: "Dump fees and specialty items (appliances, etc.) are part of an honest total.",
              },
            ].map((item) => (
              <li key={item.n} className="flex gap-4 rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
                <span className="font-mono text-xs font-semibold text-brand-primary">{item.n}</span>
                <div>
                  <h3 className="font-semibold tracking-tight">{item.t}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{item.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-12">
          <h2 className="font-heading text-2xl font-medium tracking-tight">Example jobs</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Illustrative — your quote depends on photos, access, and materials.
          </p>
          <div className="mt-6 space-y-3">
            {EXAMPLE_JOBS.map((job) => (
              <div key={job.title} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
                <h3 className="font-semibold">{job.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{job.detail}</p>
                <p className="mt-2 text-xs font-medium text-brand-primary">{job.hint}</p>
              </div>
            ))}
          </div>
        </section>

        {loading ? (
          <p className="mt-12 text-muted-foreground">Loading rates…</p>
        ) : (
          <>
            <section className="mt-12">
              <h2 className="font-heading text-2xl font-medium tracking-tight">Load size tiers</h2>
              <div className="mt-6 overflow-hidden rounded-[1.25rem] border border-black/5 bg-white shadow-sm">
                {pricingRules.loadTiers.map((t, i) => (
                  <div
                    key={t.tier}
                    className={cn(
                      "flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between",
                      i < pricingRules.loadTiers.length - 1 && "border-b border-black/5"
                    )}
                  >
                    <div>
                      <p className="font-medium">{t.label}</p>
                      <p className="text-xs text-muted-foreground">~{t.trailerPercent}% trailer</p>
                    </div>
                    <p className="text-sm font-semibold text-brand-primary">from ${t.basePrice}</p>
                  </div>
                ))}
                <div className="border-t border-black/5 bg-[#F7F5F2] px-5 py-3 text-sm text-muted-foreground">
                  Minimum ${pricingRules.minCharge} · Dump fee ${pricingRules.dumpFee}
                </div>
              </div>
            </section>

            <section className="mt-10">
              <h2 className="font-heading text-2xl font-medium tracking-tight">Access modifiers</h2>
              <div className="mt-6 overflow-hidden rounded-[1.25rem] border border-black/5 bg-white shadow-sm">
                {pricingRules.modifiers.map((m, i) => (
                  <div
                    key={m.id}
                    className={cn(
                      "flex justify-between gap-4 px-5 py-3.5 text-sm",
                      i < pricingRules.modifiers.length - 1 && "border-b border-black/5"
                    )}
                  >
                    <span>{m.label}</span>
                    <span className="shrink-0 font-semibold">
                      {m.amount >= 0 ? "+" : ""}${m.amount}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        <p className="mt-8 text-sm italic text-muted-foreground">{estimateConfig.estimateDisclaimer}</p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/book?division=junk_removal" className="h-11 rounded-full">
            Get an estimate
            <ArrowRight className="ml-2 h-4 w-4" />
          </ButtonLink>
          <ButtonLink href="/book" variant="outline" className="h-11 rounded-full">
            Book service
          </ButtonLink>
        </div>

        <AuthoritySpotlightClient
          surface="tip_of_week"
          href="/junk-removal/resources"
          className="mt-10"
        />
        <SocialFollowStrip className="mt-10" compact />
        <RelatedAuthorityLinks excludePath="/pricing" />
      </main>
      <PublicFooter variant="company" />
      <StickyMobileConcierge />
    </div>
  );
}
