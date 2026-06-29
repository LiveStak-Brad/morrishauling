"use client";

import Image from "next/image";
import Link from "next/link";
import { morrisServicesConfig } from "@/lib/morris-services-config";
import { cn } from "@/lib/utils";

/** Intrinsic dimensions after background removal (public/MorrisServicesLogo.png). */
const LOGO_WIDTH = 1334;
const LOGO_HEIGHT = 820;

interface MorrisServicesLogoProps {
  className?: string;
  height?: number;
  priority?: boolean;
  href?: string;
  /** On dark surfaces: multiply knocks out light PNG canvas */
  onDark?: boolean;
}

export function MorrisServicesLogo({
  className,
  height = 64,
  priority = false,
  href = "/",
  onDark = false,
}: MorrisServicesLogoProps) {
  const image = (
    <Image
      src={morrisServicesConfig.logo}
      alt={morrisServicesConfig.publicBrandName}
      width={LOGO_WIDTH}
      height={LOGO_HEIGHT}
      priority={priority}
      unoptimized
      className={cn(
        "h-auto w-auto object-contain",
        onDark && "mix-blend-screen contrast-[1.08] brightness-[1.06]",
        className
      )}
      style={{ maxHeight: height }}
      sizes={`(max-width: 768px) ${Math.round(height * 3)}px, ${Math.round(height * 3.5)}px`}
    />
  );

  const content = onDark ? (
    <span className="inline-flex leading-none [&_img]:block">{image}</span>
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
