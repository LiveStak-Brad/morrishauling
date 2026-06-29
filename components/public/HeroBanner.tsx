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
 * Full-bleed marketing banner — lets the artwork breathe.
 * Overlays are bottom-weighted so "MORRIS" at the top stays visible.
 */
export function HeroBanner({ children, className }: HeroBannerProps) {
  const { company } = useCompany();
  const bannerSrc = company.heroBanner ?? "/banner.png";

  return (
    <div
      className={cn(
        "relative flex min-h-[min(92vh,820px)] flex-col overflow-hidden bg-[#1a1a1a]",
        className
      )}
    >
      <Image
        src={bannerSrc}
        alt={`${company.companyName} — trucks ready to haul`}
        fill
        priority
        className="object-cover object-[center_18%] sm:object-[center_22%]"
        sizes="100vw"
      />

      {/* Bottom fade only — no top wash that clips the brand name */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
      >
        <div className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-black/85 via-black/45 to-transparent" />
        <div className="absolute inset-y-0 right-0 w-[45%] bg-gradient-to-l from-black/50 to-transparent max-md:w-full max-md:from-black/60 max-md:via-transparent" />
      </div>

      <div className="relative z-10 flex min-h-[inherit] flex-col">{children}</div>
    </div>
  );
}

/** Text-only trust strip — no duplicate banner image */
export function ServiceAreaStrip({ className }: { className?: string }) {
  const { company } = useCompany();

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-2xl border border-brand-primary/15",
        "bg-gradient-to-r from-brand-primary/5 via-white to-brand-primary/5",
        "px-5 py-4 text-center sm:flex-row sm:justify-between sm:text-left",
        className
      )}
    >
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-brand-primary">
          Service area
        </p>
        <p className="mt-0.5 font-semibold">
          {company.serviceArea.label ?? "Warren, Lincoln & St. Charles Counties, MO"}
        </p>
      </div>
      <a
        href={`tel:${company.phone.replace(/\D/g, "")}`}
        className="text-lg font-bold text-brand-primary hover:underline"
      >
        {company.phone}
      </a>
    </div>
  );
}
