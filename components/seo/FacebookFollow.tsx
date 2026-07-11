"use client";

import { SEO_ORG } from "@/lib/seo/site";
import { trackMarketingEvent } from "@/lib/seo/analytics";
import { cn } from "@/lib/utils";

export function FacebookFollow({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <aside
      className={cn(
        "rounded-2xl border border-border bg-white p-5 sm:p-6",
        className
      )}
    >
      {!compact && (
        <>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-primary">
            Stay connected
          </p>
          <h2 className="mt-2 font-heading text-xl font-medium tracking-tight text-foreground sm:text-2xl">
            Follow us on Facebook
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Follow {SEO_ORG.legalName} on Facebook for company updates, service announcements,
            project highlights, community involvement, seasonal tips, and future service launches.
          </p>
        </>
      )}
      <a
        href={SEO_ORG.facebook}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackMarketingEvent("facebook_follow_click", { division: "parent" })}
        className={cn(
          "inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-[#1877F2]/5 px-5 text-sm font-semibold text-[#1877F2] transition hover:bg-[#1877F2]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2",
          compact ? "" : "mt-4"
        )}
      >
        <FacebookIcon className="h-5 w-5" />
        Follow Morris Service Group
      </a>
    </aside>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M22 12.07C22 6.48 17.52 2 11.93 2S1.86 6.48 1.86 12.07c0 4.99 3.64 9.13 8.4 9.93v-7.02H7.9v-2.91h2.36V9.84c0-2.33 1.39-3.62 3.52-3.62 1.02 0 2.09.18 2.09.18v2.3h-1.18c-1.16 0-1.52.72-1.52 1.46v1.75h2.59l-.41 2.91h-2.18V22c4.76-.8 8.4-4.94 8.4-9.93z" />
    </svg>
  );
}
