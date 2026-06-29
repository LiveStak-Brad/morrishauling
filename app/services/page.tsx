"use client";

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { CompanyBreadcrumbBar } from "@/components/public/CompanyBreadcrumbBar";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { useCompany } from "@/lib/company-context";
import { PRELAUNCH_SERVICES_INTRO } from "@/lib/public-copy";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ServicesPage() {
  const { company } = useCompany();

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
      <PublicHeader variant="company" />
      <CompanyBreadcrumbBar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 pb-24 sm:px-6">
        <h1 className="mb-4 text-2xl font-bold sm:text-3xl">Services</h1>
        <PremiumCard className="mb-6 border-amber-200/60 bg-amber-50/80 p-4 text-sm text-amber-950">
          <p className="font-semibold">Planned services at launch</p>
          <p className="mt-1 leading-relaxed">{PRELAUNCH_SERVICES_INTRO}</p>
        </PremiumCard>
        <div className="grid gap-4">
          {company.services.map((s) => (
            <Card key={s.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{s.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {s.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      <PublicFooter variant="company" />
    </div>
  );
}
