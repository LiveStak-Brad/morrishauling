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
  withShadow?: boolean;
}

export function HaulingLogo({
  className,
  height = 72,
  width,
  priority = false,
  href,
  withShadow = true,
}: HaulingLogoProps) {
  return (
    <MorrisServicesLogo
      className={className}
      height={height}
      width={width}
      priority={priority}
      href={href}
      withShadow={withShadow}
      alt="Morris Hauling"
    />
  );
}
