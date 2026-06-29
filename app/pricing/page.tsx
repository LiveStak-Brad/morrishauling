"use client";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { CompanyBreadcrumbBar } from "@/components/public/CompanyBreadcrumbBar";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { useCompany } from "@/lib/company-context";
import { useEffectivePricing } from "@/hooks/useEffectivePricing";
import { PRELAUNCH_PRICING_NOTE, PRELAUNCH_SERVICE_AREA } from "@/lib/public-copy";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PricingPage() {
  const { company, companyId } = useCompany();
  const { estimateConfig, loading } = useEffectivePricing(companyId);
  const { pricingRules } = estimateConfig;

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <PublicHeader variant="company" />
      <CompanyBreadcrumbBar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 pb-24 sm:px-6">
        <h1 className="mb-2 text-2xl font-bold sm:text-3xl">Pricing &amp; estimates</h1>
        <p className="mb-4 text-sm text-muted-foreground sm:text-base">
          Planned rate structure for {company.companyName}. Figures below are for launch planning —
          not live quotes.
        </p>

        <PremiumCard className="mb-6 border-amber-200/60 bg-amber-50/80 p-4 text-sm text-amber-950">
          <p className="font-semibold">Pre-launch pricing</p>
          <p className="mt-1 leading-relaxed">{PRELAUNCH_PRICING_NOTE}</p>
          <p className="mt-2 text-xs text-amber-900/80">
            Preparing to serve {PRELAUNCH_SERVICE_AREA}. Final on-site pricing will be confirmed when
            we launch.
          </p>
        </PremiumCard>

        {loading ? (
          <p className="text-muted-foreground">Loading planned rates…</p>
        ) : (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Load size tiers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {pricingRules.loadTiers.map((t) => (
                  <div
                    key={t.tier}
                    className="flex flex-col gap-1 border-b pb-3 last:border-0 sm:flex-row sm:items-center sm:justify-between sm:pb-2"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">{t.label}</p>
                      <p className="text-xs text-muted-foreground">~{t.trailerPercent}% trailer</p>
                    </div>
                    <Badge variant="secondary" className="w-fit shrink-0">
                      from ${t.basePrice}
                    </Badge>
                  </div>
                ))}
                <p className="text-sm text-muted-foreground">
                  Minimum charge: ${pricingRules.minCharge} · Dump fee: ${pricingRules.dumpFee}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Access modifiers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {pricingRules.modifiers.map((m) => (
                  <div key={m.id} className="flex justify-between gap-4 text-sm">
                    <span className="min-w-0">{m.label}</span>
                    <span className="shrink-0 font-medium">
                      {m.amount >= 0 ? "+" : ""}${m.amount}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}

        <p className="mt-6 text-sm italic text-muted-foreground">{estimateConfig.estimateDisclaimer}</p>
      </main>
      <PublicFooter variant="company" />
    </div>
  );
}
