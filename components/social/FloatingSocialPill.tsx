"use client";

import { useState } from "react";
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

/** Expandable follow pill — sits above mobile concierge; never covers Call/Estimate. */
export function FloatingSocialPill({ className }: { className?: string }) {
  const { dismissed, dismiss } = useDismissed(SOCIAL_DISMISS_KEYS.floatingPill);
  const [open, setOpen] = useState(false);

  if (dismissed) return null;

  const platforms = enabledSocialPlatforms();

  return (
    <div
      className={cn(
        "fixed bottom-[4.75rem] right-3 z-[45] md:bottom-6 md:right-6",
        className
      )}
    >
      <div
        className={cn(
          "overflow-hidden border border-black/10 bg-white/95 shadow-lg backdrop-blur-xl transition-all",
          open ? "rounded-2xl" : "rounded-full"
        )}
      >
        {open ? (
          <div className="flex flex-col gap-1 p-2" role="menu" aria-label="Follow @WarrentonJunk">
            {platforms.map((platform) => (
              <a
                key={platform.id}
                role="menuitem"
                href={platform.profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={platform.accessibleLabel}
                onClick={() =>
                  trackSocialFollow({ platform: platform.id, surface: "floating_social" })
                }
                className="inline-flex h-11 min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              >
                <SocialIcon platform={platform.id} className="h-4 w-4" />
                {platform.name}
              </a>
            ))}
            <button
              type="button"
              onClick={dismiss}
              className="mt-1 inline-flex h-9 items-center justify-center rounded-xl text-xs font-medium text-muted-foreground hover:bg-muted"
            >
              Dismiss
            </button>
          </div>
        ) : (
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex h-11 items-center gap-2 px-4 text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              aria-expanded={false}
              aria-haspopup="menu"
            >
              Follow {WARRENTON_JUNK_SOCIAL.handle}
            </button>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Dismiss follow shortcut"
              className="mr-1 inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
