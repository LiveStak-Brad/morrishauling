"use client";

import { CompanyLogo } from "@/components/brand/CompanyLogo";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { PRELAUNCH_SERVICE_AREA, PRELAUNCH_CAREERS_NOTE } from "@/lib/public-copy";
import { scrollToApplySection } from "@/lib/careers/resolve-postings";

export function CareersHero() {
  return (
    <section className="relative overflow-hidden border-b border-white/10 bg-[#0A0A0A] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(155,27,48,0.4),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(155,27,48,0.18),transparent_50%)]" />
      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-24">
        <div className="flex flex-col items-center gap-7 text-center">
          <CompanyLogo height={140} onDark priority href="/junk-removal" className="max-h-32" />
          <div className="max-w-3xl space-y-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-red-300/90">
              Join the crew
            </p>
            <h1 className="font-heading text-4xl font-medium tracking-tight sm:text-5xl md:text-6xl">
              Build a career with Morris Junk Removal
            </h1>
            <p className="text-lg leading-relaxed text-white/80 sm:text-xl">
              Reliable people. Clear standards. Room to grow — preparing to serve{" "}
              {PRELAUNCH_SERVICE_AREA}.
            </p>
            <p className="mx-auto max-w-2xl text-sm leading-relaxed text-white/60">
              {PRELAUNCH_CAREERS_NOTE}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 pt-1">
            <ButtonLink
              href="#positions"
              size="lg"
              className="h-12 rounded-full bg-brand-primary px-8 text-white hover:bg-brand-primary/90"
            >
              View roles
            </ButtonLink>
            <Button
              type="button"
              size="lg"
              className="h-12 rounded-full bg-white px-8 font-semibold text-[#0A0A0A] shadow-md hover:bg-white/90"
              onClick={() => scrollToApplySection()}
            >
              Apply now
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
