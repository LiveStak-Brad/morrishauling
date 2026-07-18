"use client";

import { MorrisServicesLogo } from "@/components/brand/MorrisServicesLogo";

/**
 * Site-wide brand mark (Morris Service Group circle).
 * Kept as HaulingLogo for existing imports on Hauling pages.
 */
export { MORRIS_SERVICES_LOGO_SRC as HAULING_LOGO_SRC } from "@/components/brand/MorrisServicesLogo";

interface HaulingLogoProps {
  className?: string;
  height?: number;
  width?: number;
  priority?: boolean;
  href?: string;
}

export function HaulingLogo({
  className,
  height = 64,
  width,
  priority = false,
  href,
}: HaulingLogoProps) {
  return (
    <MorrisServicesLogo
      className={className}
      height={height}
      width={width}
      priority={priority}
      href={href}
      alt="Morris Hauling"
    />
  );
}
