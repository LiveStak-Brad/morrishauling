"use client";

import Link from "next/link";
import { Eye, Phone } from "lucide-react";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { ButtonLink } from "@/components/ui/button-link";
import { morrisServicesConfig } from "@/lib/morris-services-config";
import { PRELAUNCH_SCHEDULING_NOTE, PRELAUNCH_SERVICE_AREA } from "@/lib/public-copy";
import { useCompany } from "@/lib/company-context";

export default function ContactPage() {
  const { company } = useCompany();
  const hauling = morrisServicesConfig.operatingCompanies[0];

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-background">
      <PublicHeader variant="umbrella" />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 pb-24 sm:px-6 md:py-14">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Contact</h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          {morrisServicesConfig.publicBrandName} and {hauling.name} are preparing for launch in{" "}
          {PRELAUNCH_SERVICE_AREA}. {PRELAUNCH_SCHEDULING_NOTE}
        </p>

        <PremiumCard className="mt-8 p-6">
          <p className="font-semibold text-lg">Early customer interest</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Questions before launch or want to be notified when online booking opens? Call us.
          </p>
          <a
            href={`tel:${company.phone}`}
            className="mt-4 inline-flex min-h-[48px] items-center gap-3 text-lg font-semibold text-brand-primary hover:underline"
          >
            <Phone className="h-5 w-5 shrink-0" />
            {company.phone}
          </a>
        </PremiumCard>

        <PremiumCard className="mt-4 border-dashed p-6">
          <p className="font-semibold">{hauling.name}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Visit the hauling website for service details, careers, and booking preview.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <ButtonLink href={hauling.hubPath} className="h-11 w-full rounded-xl sm:w-auto">
              Visit hauling website
            </ButtonLink>
            <ButtonLink href="/book?preview=1" variant="outline" className="h-11 w-full rounded-xl sm:w-auto">
              <Eye className="mr-2 h-4 w-4" />
              Booking preview
            </ButtonLink>
          </div>
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
