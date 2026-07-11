"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** Always Morris Hauling haulinglogo.png — never parent or Junk Removal assets. */
export const HAULING_LOGO_SRC = "/haulinglogo.png?v=1";

/** Intrinsic size after transparent trim (public/haulinglogo.png). */
const LOGO_WIDTH = 1139;
const LOGO_HEIGHT = 754;

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
  const displayWidth = width ?? Math.round(height * (LOGO_WIDTH / LOGO_HEIGHT));

  const image = (
    <Image
      src={HAULING_LOGO_SRC}
      alt="Morris Hauling"
      width={LOGO_WIDTH}
      height={LOGO_HEIGHT}
      priority={priority}
      unoptimized
      className={cn("block h-auto w-auto object-contain", className)}
      style={{ maxHeight: height, maxWidth: displayWidth }}
      sizes={`${Math.max(displayWidth, height)}px`}
    />
  );

  if (!href) return image;

  return (
    <Link href={href} className="inline-flex shrink-0 items-center group">
      <span className="transition-transform duration-300 group-hover:scale-[1.03]">
        {image}
      </span>
    </Link>
  );
}
