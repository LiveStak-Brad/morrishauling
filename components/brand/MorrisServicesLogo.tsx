"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** Canonical Morris Service Group mark — transparent circle (public/MorrisServicesLogo.png). */
export const MORRIS_SERVICES_LOGO_SRC = "/MorrisServicesLogo.png?v=6";

/** Intrinsic size after white-background removal / circular crop. */
const LOGO_WIDTH = 1232;
const LOGO_HEIGHT = 1240;

interface MorrisServicesLogoProps {
  className?: string;
  height?: number;
  width?: number;
  priority?: boolean;
  href?: string;
  alt?: string;
  onDark?: boolean;
}

export function MorrisServicesLogo({
  className,
  height = 64,
  width,
  priority = false,
  href = "/",
  alt = "Morris Service Group LLC",
  onDark = false,
}: MorrisServicesLogoProps) {
  const displayWidth = width ?? Math.round(height * (LOGO_WIDTH / LOGO_HEIGHT));

  const image = (
    <Image
      src={MORRIS_SERVICES_LOGO_SRC}
      alt={alt}
      width={LOGO_WIDTH}
      height={LOGO_HEIGHT}
      priority={priority}
      unoptimized
      className={cn(
        "block h-auto w-auto object-contain",
        onDark && "brightness-110",
        className
      )}
      style={{ maxHeight: height, maxWidth: displayWidth }}
      sizes={`${Math.max(displayWidth, height)}px`}
    />
  );

  if (!href) return image;

  return (
    <Link href={href} className="inline-flex shrink-0 items-center transition-opacity hover:opacity-90">
      <span className="transition-transform duration-300 hover:scale-[1.03]">{image}</span>
    </Link>
  );
}
