"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useCompany } from "@/lib/company-context";
import { cn } from "@/lib/utils";

/** Panoramic desktop banner intrinsic dimensions (public/banner.png). */
const DESKTOP_BANNER_WIDTH = 1962;
const DESKTOP_BANNER_HEIGHT = 802;

interface HeroBannerProps {
  children: ReactNode;
  className?: string;
}

/**
 * Responsive marketing hero.
 * Mobile / tablet: full artwork visible (object-contain), section grows with image height.
 * Desktop (lg+): full-bleed cover with bottom-weighted overlay for CTA card.
 */
export function HeroBanner({ children, className }: HeroBannerProps) {
  const { company } = useCompany();
  const desktopBanner = company.heroBanner ?? "/banner.png";
  const mobileBanner = company.heroBannerMobile ?? desktopBanner;
  const hasMobileBanner =
    Boolean(company.heroBannerMobile) && mobileBanner !== desktopBanner;

  const bannerAlt = `${company.companyName} — professional junk removal`;

  return (
    <div
      className={cn(
        "relative flex flex-col overflow-x-hidden bg-[#141414]",
        className
      )}
    >
      {/* Optional portrait-oriented mobile artwork */}
      {hasMobileBanner ? (
        <div className="relative w-full md:hidden">
          <Image
            src={mobileBanner}
            alt={bannerAlt}
            width={1080}
            height={1350}
            priority
            className="h-auto w-full max-w-full object-contain object-center"
            sizes="100vw"
          />
        </div>
      ) : null}

      {/* Phones (no dedicated mobile asset) + tablets: panoramic banner, never cropped */}
      <div
        className={cn(
          "relative flex w-full justify-center bg-[#141414] lg:hidden",
          hasMobileBanner && "hidden md:flex"
        )}
      >
        <Image
          src={desktopBanner}
          alt={bannerAlt}
          width={DESKTOP_BANNER_WIDTH}
          height={DESKTOP_BANNER_HEIGHT}
          priority={!hasMobileBanner}
          className={cn(
            "h-auto w-full max-w-full object-contain object-center",
            "md:max-h-[min(50vh,440px)] md:w-auto"
          )}
          sizes="(max-width: 1023px) 100vw"
        />
      </div>

      {/* Desktop: full-bleed background */}
      <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden>
        <Image
          src={desktopBanner}
          alt=""
          fill
          priority
          className="object-cover object-[center_22%]"
          sizes="100vw"
        />
        <div className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-black/85 via-black/45 to-transparent" />
        <div className="absolute inset-y-0 right-0 w-[45%] bg-gradient-to-l from-black/50 to-transparent" />
      </div>

      <div className="relative z-10 flex flex-col lg:min-h-[min(85vh,780px)]">{children}</div>
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
          Service area
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
