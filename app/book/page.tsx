"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Eye, Phone } from "lucide-react";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { CompanyBreadcrumbBar } from "@/components/public/CompanyBreadcrumbBar";
import { PreLaunchBanner } from "@/components/public/PreLaunchBanner";
import { BookingFlow } from "@/components/public/BookingFlow";
import { ButtonLink } from "@/components/ui/button-link";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { useCompany } from "@/lib/company-context";
import { isBookingDemoMode, isBookingSubmissionAllowed } from "@/lib/public-site";
import { PRELAUNCH_SCHEDULING_NOTE, BOOKING_PREVIEW_BANNER } from "@/lib/public-copy";

function BookPageContent() {
  const { company } = useCompany();
  const searchParams = useSearchParams();
  const demoMode = isBookingDemoMode(searchParams);
  const liveBooking = isBookingSubmissionAllowed();

  if (liveBooking && !demoMode) {
    return (
      <div className="relative min-h-screen">
        <div className="absolute inset-0 morris-hero-pattern pointer-events-none" />
        <PublicHeader variant="company" />
        <CompanyBreadcrumbBar />
        <main className="relative mx-auto w-full max-w-lg flex-1 px-4 py-6 pb-32 md:max-w-3xl">
          <div className="mb-6">
            <h1 className="text-2xl font-bold md:text-3xl">Book your service</h1>
            <p className="mt-1 text-muted-foreground">
              Junk removal or hauling &amp; transport from {company.companyName}
            </p>
          </div>
          <BookingFlow demoMode={false} />
        </main>
        <PublicFooter variant="company" />
      </div>
    );
  }

  if (demoMode) {
    return (
      <div className="relative min-h-screen flex-col flex">
        <div className="absolute inset-0 morris-hero-pattern pointer-events-none" />
        <PublicHeader variant="company" />
        <CompanyBreadcrumbBar />
        <PreLaunchBanner variant="preview" />
        <main className="relative mx-auto w-full max-w-3xl flex-1 px-4 py-6 pb-32">
          <Link
            href="/book"
            className="mb-4 inline-flex min-h-[44px] items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to booking info
          </Link>
          <PremiumCard className="mb-6 border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
            <p className="font-semibold">{BOOKING_PREVIEW_BANNER}</p>
            <p className="mt-1 leading-relaxed">
              Walk through sample estimate and scheduling screens. No jobs will be created.
            </p>
          </PremiumCard>
          <div className="mb-6">
            <h1 className="text-2xl font-bold md:text-3xl">Preview booking experience</h1>
            <p className="mt-1 text-muted-foreground">
              Walk through estimates and scheduling — for demonstration only.
            </p>
          </div>
          <BookingFlow demoMode />
        </main>
        <PublicFooter variant="company" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader variant="company" />
      <CompanyBreadcrumbBar />
      <PreLaunchBanner />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 pb-24 sm:py-12 md:py-16">
        <h1 className="text-3xl font-bold md:text-4xl">Online booking is coming soon</h1>
        <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
          {company.companyName} is preparing for launch. {PRELAUNCH_SCHEDULING_NOTE}
        </p>

        <PremiumCard className="mt-8 p-6">
          <p className="font-semibold">Early customer interest list</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Want to hear when booking opens or have a question before launch? Call us — we&apos;re
            collecting early interest while crews, routes, and systems are finalized.
          </p>
          <div className="mt-4">
            <a
              href={`tel:${company.phone}`}
              className="inline-flex items-center gap-3 font-semibold text-brand-primary hover:underline"
            >
              <Phone className="h-5 w-5" />
              {company.phone}
            </a>
          </div>
        </PremiumCard>

        <PremiumCard className="mt-6 border-dashed p-6">
          <p className="font-semibold">Preview the booking experience</p>
          <p className="mt-2 text-sm text-muted-foreground">
            See how online estimates and scheduling will work — submissions are disabled until launch.
          </p>
          <ButtonLink href="/book?preview=1" className="mt-4 rounded-xl" variant="outline">
            <Eye className="mr-2 h-4 w-4" />
            Preview Booking Experience
          </ButtonLink>
        </PremiumCard>
      </main>
      <PublicFooter variant="company" />
    </div>
  );
}

export default function BookPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">Loading...</div>
      }
    >
      <BookPageContent />
    </Suspense>
  );
}
