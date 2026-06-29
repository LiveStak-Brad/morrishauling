"use client";

import { PublicHeader } from "@/components/public/PublicHeader";
import { useCompany } from "@/lib/company-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PricingPage() {
  const { company } = useCompany();
  const { pricingRules } = company;

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8 pb-24 md:max-w-3xl">
        <h1 className="mb-2 text-2xl font-bold">Pricing & estimates</h1>
        <p className="mb-6 text-muted-foreground">
          Load-based pricing from {company.companyName}. Final price confirmed on-site.
        </p>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Load size tiers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pricingRules.loadTiers.map((t) => (
              <div key={t.tier} className="flex items-center justify-between border-b pb-2 last:border-0">
                <div>
                  <p className="font-medium">{t.label}</p>
                  <p className="text-xs text-muted-foreground">~{t.trailerPercent}% trailer</p>
                </div>
                <Badge variant="secondary">from ${t.basePrice}</Badge>
              </div>
            ))}
            <p className="text-sm text-muted-foreground">
              Minimum charge: ${pricingRules.minCharge} · Dump fee: ${pricingRules.dumpFee}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Access modifiers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pricingRules.modifiers.map((m) => (
              <div key={m.id} className="flex justify-between text-sm">
                <span>{m.label}</span>
                <span>{m.amount >= 0 ? "+" : ""}${m.amount}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <p className="mt-6 text-sm text-muted-foreground italic">
          {company.estimateDisclaimer}
        </p>
      </main>
    </div>
  );
}
