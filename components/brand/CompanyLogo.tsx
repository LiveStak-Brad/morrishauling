"use client";

import Image from "next/image";
import Link from "next/link";
import { useCompany } from "@/lib/company-context";
import { cn } from "@/lib/utils";

interface CompanyLogoProps {
  className?: string;
  height?: number;
  width?: number;
  priority?: boolean;
  href?: string;
  onDark?: boolean;
  withBackdrop?: boolean;
}

/** Square PNG badges with white corners — clip to circle to drop the box */
function useCircularLogoMask(logoSrc: string) {
  return logoSrc.endsWith(".png");
}

export function CompanyLogo({
  className,
  height = 48,
  width = 200,
  priority = false,
  href,
  onDark = false,
  withBackdrop = false,
}: CompanyLogoProps) {
  const { company } = useCompany();
  const circular = useCircularLogoMask(company.logo);
  const size = height;

  const image = circular ? (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full",
        onDark && "shadow-[0_4px_18px_rgba(0,0,0,0.5)] ring-2 ring-white/30",
        className
      )}
      style={{ width: size, height: size }}
    >
      <Image
        src={company.logo}
        alt={company.companyName}
        fill
        priority={priority}
        className="object-cover object-center scale-[1.06]"
        sizes={`${size}px`}
      />
    </div>
  ) : (
    <Image
      src={company.logo}
      alt={company.companyName}
      width={width}
      height={height}
      priority={priority}
      className={cn(
        "h-auto w-auto object-contain",
        !withBackdrop && "mix-blend-multiply",
        className
      )}
      style={{ maxHeight: height }}
    />
  );

  const content =
    withBackdrop && !onDark && !circular ? (
      <div
        className={cn(
          "inline-flex items-center justify-center rounded-2xl",
          "bg-white/70 px-3 py-2 shadow-sm ring-1 ring-black/5 backdrop-blur-sm"
        )}
      >
        {image}
      </div>
    ) : (
      image
    );

  if (!href) return content;

  return (
    <Link href={href} className="inline-flex shrink-0 items-center group">
      <span className="transition-transform duration-300 group-hover:scale-[1.03]">
        {content}
      </span>
    </Link>
  );
}
