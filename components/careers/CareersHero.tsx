"use client";

import { CompanyLogo } from "@/components/brand/CompanyLogo";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { PRELAUNCH_SERVICE_AREA, PRELAUNCH_CAREERS_NOTE } from "@/lib/public-copy";
import { scrollToApplySection } from "@/lib/careers/resolve-postings";

export function CareersHero() {
  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-[#0A0A0A] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(155,27,48,0.35),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(155,27,48,0.2),transparent_50%)]" />
      <div className="relative mx-auto max-w-6xl px-4 py-14 sm:py-20">
        <div className="flex flex-col items-center text-center gap-6">
          <CompanyLogo height={72} width={72} onDark priority href="/junk-removal" />
          <div className="max-w-3xl space-y-4">
            <p className="text-sm font-medium uppercase tracking-widest text-red-300/90">
              Join Our Team
            </p>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Build a Career With Morris Hauling
            </h1>
            <p className="text-lg text-white/80 sm:text-xl leading-relaxed">
              We&apos;re building a reliable, professional hauling and junk removal team —
              preparing to serve {PRELAUNCH_SERVICE_AREA}.
            </p>
            <p className="text-sm text-white/65 leading-relaxed max-w-2xl mx-auto">
              {PRELAUNCH_CAREERS_NOTE}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <ButtonLink href="#positions" size="lg" className="bg-brand-primary text-white hover:bg-brand-primary/90">
              View Roles
            </ButtonLink>
            <Button
              type="button"
              size="lg"
              className="bg-white text-[#0A0A0A] hover:bg-white/90 font-semibold shadow-md"
              onClick={() => scrollToApplySection()}
            >
              Apply Now
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
