"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useCompany } from "@/lib/company-context";
import { cn } from "@/lib/utils";

interface HeroBannerProps {
  children: ReactNode;
  className?: string;
}

/**
 * Responsive marketing hero.
 * Mobile: brand artwork in a dedicated top strip; copy stacks below (no overlap).
 * Desktop: full-bleed image with bottom-weighted overlay for CTA card.
 */
export function HeroBanner({ children, className }: HeroBannerProps) {
  const { company } = useCompany();
  const bannerSrc = company.heroBanner ?? "/banner.png";

  return (
    <div
      className={cn(
        "relative flex flex-col overflow-hidden bg-[#141414]",
        className
      )}
    >
      {/* Mobile / small tablet: show full brand artwork without cropping the logo */}
      <div className="relative w-full md:hidden">
        <div className="relative aspect-[4/3] w-full min-h-[210px] max-h-[min(48vh,320px)] sm:max-h-[min(50vh,360px)]">
          <Image
            src={bannerSrc}
            alt={`${company.companyName} — launching soon`}
            fill
            priority
            className="object-cover object-[center_8%] sm:object-[center_10%]"
            sizes="100vw"
          />
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#141414] via-[#141414]/80 to-transparent"
            aria-hidden
          />
        </div>
      </div>

      {/* Desktop: full-bleed background */}
      <div className="pointer-events-none absolute inset-0 hidden md:block" aria-hidden>
        <Image
          src={bannerSrc}
          alt=""
          fill
          priority
          className="object-cover object-[center_22%]"
          sizes="100vw"
        />
        <div className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-black/85 via-black/45 to-transparent" />
        <div className="absolute inset-y-0 right-0 w-[45%] bg-gradient-to-l from-black/50 to-transparent" />
      </div>

      <div className="relative z-10 flex flex-col md:min-h-[min(85vh,780px)]">{children}</div>
    </div>
  );
}

/** Text-only service area strip */
export function ServiceAreaStrip({ className }: { className?: string }) {
  const { company } = useCompany();

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-2xl border border-brand-primary/15",
        "bg-gradient-to-r from-brand-primary/5 via-white to-brand-primary/5",
        "px-4 py-4 text-center sm:flex-row sm:justify-between sm:gap-4 sm:px-5 sm:text-left",
        className
      )}
    >
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-primary">
          Planned service area
        </p>
        <p className="mt-0.5 text-sm font-semibold leading-snug sm:text-base">
          {company.serviceArea.label ?? "Warren, Lincoln & St. Charles Counties, MO"}
        </p>
      </div>
      <a
        href={`tel:${company.phone.replace(/\D/g, "")}`}
        className="shrink-0 text-base font-bold text-brand-primary hover:underline sm:text-lg"
      >
        {company.phone}
      </a>
    </div>
  );
}
