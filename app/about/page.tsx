"use client";

import Link from "next/link";
import { ArrowRight, Building2 } from "lucide-react";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { SectionHeader } from "@/components/morris/SectionHeader";
import { ButtonLink } from "@/components/ui/button-link";
import { morrisServicesConfig } from "@/lib/morris-services-config";
import { PRELAUNCH_HAULING_INTRO } from "@/lib/public-copy";

export default function AboutPage() {
  const hauling = morrisServicesConfig.operatingCompanies[0];

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-background">
      <PublicHeader variant="umbrella" />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 pb-24 sm:px-6 md:py-14">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Building2 className="h-3.5 w-3.5" />
          About
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">About {morrisServicesConfig.publicBrandName}</h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
          {morrisServicesConfig.footerMission}
        </p>

        <SectionHeader
          className="mt-10"
          title="Our first service company"
          subtitle="Preparing for launch in Missouri"
          size="lg"
        />
        <PremiumCard className="p-6">
          <h2 className="text-xl font-bold">{hauling.name}</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {PRELAUNCH_HAULING_INTRO}
          </p>
          <ButtonLink href={hauling.hubPath} className="mt-6 h-11 w-full rounded-xl sm:w-auto">
            Visit {hauling.name}
            <ArrowRight className="ml-2 h-4 w-4" />
          </ButtonLink>
        </PremiumCard>

        <p className="mt-8 text-sm text-muted-foreground">
          <Link href="/" className="font-medium text-brand-primary hover:underline">
            ← Back to {morrisServicesConfig.publicBrandName}
          </Link>
        </p>
      </main>
      <PublicFooter />
    </div>
  );
}
