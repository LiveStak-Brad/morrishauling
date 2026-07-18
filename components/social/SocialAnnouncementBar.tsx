"use client";

import { X } from "lucide-react";
import { SocialIcon } from "@/components/social/SocialIcons";
import {
  SOCIAL_DISMISS_KEYS,
  WARRENTON_JUNK_SOCIAL,
  enabledSocialPlatforms,
} from "@/lib/social/config";
import { useDismissed } from "@/lib/social/use-dismissed";
import { trackSocialFollow } from "@/lib/social/track";
import { cn } from "@/lib/utils";

export function SocialAnnouncementBar({ className }: { className?: string }) {
  const { dismissed, dismiss } = useDismissed(SOCIAL_DISMISS_KEYS.announcementBar);

  if (dismissed) return null;

  const platforms = enabledSocialPlatforms();

  return (
    <div
      className={cn(
        "relative z-[60] border-b border-black/10 bg-[#0A0A0A] text-white",
        className
      )}
      role="region"
      aria-label="Follow @WarrentonJunk"
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-3 py-2 sm:px-4">
        <p className="min-w-0 flex-1 text-[11px] font-medium leading-snug sm:text-xs md:text-sm">
          <span aria-hidden className="mr-1.5">
            🚛
          </span>
          <span className="text-white/90">
            Watch <span className="font-semibold text-white">REAL</span> Junk Removal Jobs Every
            Week — Follow{" "}
            <span className="font-semibold text-brand-primary">{WARRENTON_JUNK_SOCIAL.handle}</span>
          </span>
        </p>
        <div className="flex shrink-0 items-center gap-1" aria-label="Social profiles">
          {platforms.map((platform) => (
            <a
              key={platform.id}
              href={platform.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={platform.accessibleLabel}
              onClick={() =>
                trackSocialFollow({ platform: platform.id, surface: "announcement_bar" })
              }
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            >
              <SocialIcon platform={platform.id} className="h-3.5 w-3.5" />
            </a>
          ))}
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss announcement"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
