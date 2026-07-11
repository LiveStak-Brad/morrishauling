"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { CompanyBreadcrumbBar } from "@/components/public/CompanyBreadcrumbBar";
import { BookingFlow } from "@/components/public/BookingFlow";
import { GuestEstimateRequestForm } from "@/components/public/GuestEstimateRequestForm";
import { ButtonLink } from "@/components/ui/button-link";
import { Button } from "@/components/ui/button";
import { useCompany } from "@/lib/company-context";
import { isBookingSubmissionAllowed } from "@/lib/public-site";
import { useAuth } from "@/components/auth/AuthProvider";
import type { DivisionId } from "@/lib/divisions";
import { Phone } from "lucide-react";

function BookPageContent() {
  const { company } = useCompany();
  const { profile } = useAuth();
  const searchParams = useSearchParams();
  const divisionParam = searchParams.get("division");
  const divisionId: DivisionId =
    divisionParam === "hauling" ? "hauling" : "junk_removal";
  const open = isBookingSubmissionAllowed();
  const [mode, setMode] = useState<"guest" | "full">(
    profile ? "full" : "guest"
  );

  if (!open) {
    return (
      <div className="flex min-h-screen flex-col bg-[#F7F5F2]">
        <PublicHeader variant="company" />
        <CompanyBreadcrumbBar />
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 pb-28">
          <h1 className="font-heading text-4xl font-medium tracking-tight">
            Booking temporarily unavailable
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Please call us to schedule Junk Removal or Hauling.
          </p>
          <a
            href={`tel:${company.phone.replace(/\D/g, "")}`}
            className="mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand-primary px-8 font-semibold text-white"
          >
            <Phone className="h-5 w-5" aria-hidden />
            {company.phone}
          </a>
          <ButtonLink href="/contact" variant="outline" className="mt-4 h-11 rounded-full">
            Contact options
          </ButtonLink>
        </main>
        <PublicFooter variant="company" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 morris-hero-pattern pointer-events-none" />
      <PublicHeader variant="company" />
      <CompanyBreadcrumbBar />
      <main className="relative mx-auto w-full max-w-lg flex-1 px-4 py-6 pb-32 md:max-w-3xl">
        <div className="mb-6">
          <h1 className="font-heading text-3xl font-medium tracking-tight md:text-4xl">
            Book service
          </h1>
          <p className="mt-2 text-muted-foreground">
            Request an estimate without an account, or sign in for the full booking wizard with
            photos and scheduling.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              variant={mode === "guest" ? "default" : "outline"}
              className="rounded-full"
              onClick={() => setMode("guest")}
            >
              Guest estimate request
            </Button>
            <Button
              type="button"
              variant={mode === "full" ? "default" : "outline"}
              className="rounded-full"
              onClick={() => setMode("full")}
            >
              Full booking wizard
            </Button>
          </div>
        </div>
        {mode === "guest" ? (
          <GuestEstimateRequestForm divisionId={divisionId} />
        ) : (
          <BookingFlow />
        )}
      </main>
      <PublicFooter variant="company" />
    </div>
  );
}

export default function BookPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F7F5F2] text-muted-foreground">
          Loading…
        </div>
      }
    >
      <BookPageContent />
    </Suspense>
  );
}
