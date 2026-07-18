"use client";

import { MorrisServicesLogo } from "@/components/brand/MorrisServicesLogo";

/**
 * Site-wide brand mark (Morris Service Group circle).
 * Kept as CompanyLogo for existing imports on Junk Removal / admin / invoices.
 */
export { MORRIS_SERVICES_LOGO_SRC as JUNK_REMOVAL_LOGO_SRC } from "@/components/brand/MorrisServicesLogo";

interface CompanyLogoProps {
  className?: string;
  height?: number;
  width?: number;
  priority?: boolean;
  href?: string;
  onDark?: boolean;
  withBackdrop?: boolean;
}

export function CompanyLogo({
  className,
  height = 64,
  width,
  priority = false,
  href,
  onDark = false,
}: CompanyLogoProps) {
  return (
    <MorrisServicesLogo
      className={className}
      height={height}
      width={width}
      priority={priority}
      href={href}
      onDark={onDark}
      alt="Morris Junk Removal"
    />
  );
}
