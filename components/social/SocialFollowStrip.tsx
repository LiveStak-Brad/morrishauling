"use client";

import { SocialFollowButtons } from "@/components/social/SocialFollowButtons";
import { WARRENTON_JUNK_SOCIAL } from "@/lib/social/config";
import { cn } from "@/lib/utils";

const FOLLOW_FOR = [
  "Real Jobs",
  "Before & Afters",
  "Trailer Loads",
  "Pricing",
  "Business Updates",
  "Community Events",
] as const;

/** Secondary CTA — never competes with primary estimate CTAs. */
export function SocialFollowStrip({
  className,
  compact = false,
  surface = "follow_strip",
}: {
  className?: string;
  compact?: boolean;
  surface?: "follow_strip" | "homepage_social" | "footer_social";
}) {
  return (
    <aside
      className={cn(
        "rounded-2xl border border-black/5 bg-gradient-to-br from-white via-[#F7F5F2] to-white",
        compact ? "p-4 sm:p-5" : "p-5 sm:p-7",
        className
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-primary">
        Follow the work
      </p>
      <h2
        className={cn(
          "mt-2 font-heading font-medium tracking-tight text-foreground",
          compact ? "text-lg sm:text-xl" : "text-xl sm:text-2xl"
        )}
      >
        {compact
          ? `Want to see real local jobs before booking?`
          : `Join people following ${WARRENTON_JUNK_SOCIAL.handle}`}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        {compact ? (
          <>
            Follow {WARRENTON_JUNK_SOCIAL.handle} on Facebook, Instagram, TikTok, YouTube, and X —
            operated by {WARRENTON_JUNK_SOCIAL.operator}.
          </>
        ) : (
          <>
            Follow us for real jobs, before &amp; afters, trailer loads, pricing examples, business
            updates, and community moments from Warrenton and nearby Missouri communities.
          </>
        )}
      </p>
      {!compact && (
        <ul className="mt-3 flex flex-wrap gap-2" aria-label="What you'll see">
          {FOLLOW_FOR.map((item) => (
            <li
              key={item}
              className="rounded-full border border-black/8 bg-white px-2.5 py-1 text-[11px] font-medium text-foreground/80"
            >
              {item}
            </li>
          ))}
        </ul>
      )}
      <SocialFollowButtons
        surface={surface}
        className="mt-4"
        variant="outline"
        size={compact ? "sm" : "md"}
        showLabels={!compact}
      />
      <p className="mt-3 text-xs text-muted-foreground">
        Operated by {WARRENTON_JUNK_SOCIAL.operator}
      </p>
    </aside>
  );
}
