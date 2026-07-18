"use client";

import { ChevronDown } from "lucide-react";
import { SocialIcon } from "@/components/social/SocialIcons";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WARRENTON_JUNK_SOCIAL, enabledSocialPlatforms } from "@/lib/social/config";
import { trackSocialFollow } from "@/lib/social/track";
import { cn } from "@/lib/utils";

export function SocialNavDropdown({ onDark }: { onDark?: boolean }) {
  const platforms = enabledSocialPlatforms();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-primary",
          onDark
            ? "text-white/90 hover:bg-white/10 hover:text-white"
            : "hover:bg-muted"
        )}
      >
        Follow our jobs
        <ChevronDown className="h-3.5 w-3.5 opacity-70" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="min-w-[12rem]">
        {platforms.map((platform) => (
          <DropdownMenuItem
            key={platform.id}
            onClick={() => {
              trackSocialFollow({ platform: platform.id, surface: "header_social" });
              window.open(platform.profileUrl, "_blank", "noopener,noreferrer");
            }}
            className="cursor-pointer gap-2"
          >
            <SocialIcon platform={platform.id} className="h-4 w-4" />
            {platform.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SocialMobileNavSection({ onDark }: { onDark?: boolean }) {
  const platforms = enabledSocialPlatforms();

  return (
    <div className="mt-4 border-t border-border/60 pt-4">
      <p
        className={cn(
          "px-4 text-[11px] font-semibold uppercase tracking-[0.16em]",
          onDark ? "text-white/50" : "text-muted-foreground"
        )}
      >
        Follow our jobs · {WARRENTON_JUNK_SOCIAL.handle}
      </p>
      <div className="mt-2 flex flex-col gap-1">
        {platforms.map((platform) => (
          <a
            key={platform.id}
            href={platform.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={platform.accessibleLabel}
            onClick={() =>
              trackSocialFollow({ platform: platform.id, surface: "nav_mobile" })
            }
            className={cn(
              "inline-flex min-h-12 items-center gap-3 rounded-xl px-4 text-sm font-semibold transition-colors",
              onDark
                ? "text-white/90 hover:bg-white/10"
                : "hover:bg-muted"
            )}
          >
            <SocialIcon platform={platform.id} className="h-5 w-5" />
            {platform.name}
          </a>
        ))}
      </div>
    </div>
  );
}
