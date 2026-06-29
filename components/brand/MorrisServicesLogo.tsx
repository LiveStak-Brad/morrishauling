"use client";

import Image from "next/image";
import Link from "next/link";
import { morrisServicesConfig } from "@/lib/morris-services-config";
import { cn } from "@/lib/utils";

/** Intrinsic dimensions after background removal (public/MorrisServicesLogo.png). */
const LOGO_WIDTH = 1334;
const LOGO_HEIGHT = 820;

const panelClasses = {
  sm: "rounded-xl bg-white px-3 py-2 shadow-md ring-1 ring-black/5",
  md: "rounded-2xl bg-white px-5 py-4 shadow-lg ring-1 ring-black/5",
  lg: "rounded-3xl bg-white px-6 py-6 shadow-2xl ring-1 ring-black/5 sm:px-10 sm:py-8",
} as const;

interface MorrisServicesLogoProps {
  className?: string;
  height?: number;
  priority?: boolean;
  href?: string;
  /** Light panel behind logo for contrast on dark or busy backgrounds */
  panel?: keyof typeof panelClasses;
}

export function MorrisServicesLogo({
  className,
  height = 64,
  priority = false,
  href = "/",
  panel,
}: MorrisServicesLogoProps) {
  const image = (
    <Image
      src={morrisServicesConfig.logo}
      alt={morrisServicesConfig.publicBrandName}
      width={LOGO_WIDTH}
      height={LOGO_HEIGHT}
      priority={priority}
      unoptimized
      className={cn("block h-auto w-auto object-contain", className)}
      style={{ maxHeight: height }}
      sizes={`(max-width: 768px) ${Math.round(height * 3)}px, ${Math.round(height * 3.5)}px`}
    />
  );

  const content = panel ? (
    <span className={cn("inline-flex items-center justify-center", panelClasses[panel])}>{image}</span>
  ) : (
    image
  );

  if (!href) return content;

  return (
    <Link href={href} className="inline-flex shrink-0 transition-opacity hover:opacity-90">
      {content}
    </Link>
  );
}
