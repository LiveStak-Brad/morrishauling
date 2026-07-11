"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** Always Morris Junk Removal logo.png — never the Morris Services parent asset. */
export const JUNK_REMOVAL_LOGO_SRC = "/logo.png?v=4";

/** Intrinsic size after transparent trim (public/logo.png). */
const LOGO_WIDTH = 1146;
const LOGO_HEIGHT = 758;

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
  withBackdrop = false,
}: CompanyLogoProps) {
  const displayWidth = width ?? Math.round(height * (LOGO_WIDTH / LOGO_HEIGHT));

  const image = (
    <Image
      src={JUNK_REMOVAL_LOGO_SRC}
      alt="Morris Junk Removal"
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

  const content =
    withBackdrop && !onDark ? (
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
