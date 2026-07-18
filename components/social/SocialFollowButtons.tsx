"use client";

import { SocialIcon } from "@/components/social/SocialIcons";
import { enabledSocialPlatforms, type SocialSurface } from "@/lib/social/config";
import { trackSocialFollow } from "@/lib/social/track";
import { cn } from "@/lib/utils";

export function SocialFollowButtons({
  surface,
  className,
  variant = "filled",
  size = "md",
  showLabels = true,
}: {
  surface: SocialSurface;
  className?: string;
  variant?: "filled" | "outline" | "icon";
  size?: "sm" | "md";
  showLabels?: boolean;
}) {
  const platforms = enabledSocialPlatforms();
  const h = size === "sm" ? "h-10 min-h-10 px-3 text-xs" : "h-11 min-h-11 px-4 text-sm";

  return (
    <div className={cn("flex flex-wrap gap-2", className)} role="list">
      {platforms.map((platform) => (
        <a
          key={platform.id}
          role="listitem"
          href={platform.profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={platform.accessibleLabel}
          onClick={() =>
            trackSocialFollow({
              platform: platform.id,
              surface,
              eventName: platform.analyticsEvent,
            })
          }
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2",
            h,
            variant === "filled" &&
              "bg-brand-primary text-white shadow-sm hover:bg-brand-primary/90",
            variant === "outline" &&
              "border border-black/10 bg-white text-foreground hover:bg-muted/50",
            variant === "icon" &&
              "h-10 w-10 min-h-10 min-w-10 border border-black/10 bg-white p-0 text-foreground hover:bg-muted/50"
          )}
        >
          <SocialIcon platform={platform.id} className="h-4 w-4" />
          {variant !== "icon" && showLabels ? <span>{platform.ctaLabel}</span> : null}
          {variant !== "icon" && !showLabels ? <span>{platform.name}</span> : null}
        </a>
      ))}
    </div>
  );
}
