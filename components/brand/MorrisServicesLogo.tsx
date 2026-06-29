"use client";

import Image from "next/image";
import Link from "next/link";
import { morrisServicesConfig } from "@/lib/morris-services-config";
import { cn } from "@/lib/utils";

/** Intrinsic dimensions (public/MorrisServicesLogo.png). */
const LOGO_WIDTH = 1334;
const LOGO_HEIGHT = 820;

interface MorrisServicesLogoProps {
  className?: string;
  height?: number;
  priority?: boolean;
  href?: string;
}

export function MorrisServicesLogo({
  className,
  height = 64,
  priority = false,
  href = "/",
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

  if (!href) return image;

  return (
    <Link href={href} className="inline-flex shrink-0 transition-opacity hover:opacity-90">
      {image}
    </Link>
  );
}
