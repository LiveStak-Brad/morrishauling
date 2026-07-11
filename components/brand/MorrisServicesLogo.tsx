"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** Always Morris Services parent logo — never the Junk Removal asset. */
export const MORRIS_SERVICES_LOGO_SRC = "/MorrisServicesLogo.png?v=5";

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
      src={MORRIS_SERVICES_LOGO_SRC}
      alt="Morris Services"
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
