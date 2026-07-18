"use client";

import { SocialIcon } from "@/components/social/SocialIcons";
import {
  SOCIAL_SERVICE_COMMUNITIES,
  WARRENTON_JUNK_SOCIAL,
  enabledSocialPlatforms,
} from "@/lib/social/config";
import { SEO_ORG } from "@/lib/seo/site";
import { trackSocialFollow } from "@/lib/social/track";
import { cn } from "@/lib/utils";

export function SocialFooterBlock({
  className,
  onDark = false,
}: {
  className?: string;
  onDark?: boolean;
}) {
  const platforms = enabledSocialPlatforms();

  return (
    <section
      className={cn(
        "rounded-2xl border px-5 py-6 sm:px-7 sm:py-7",
        onDark
          ? "border-white/15 bg-white/5"
          : "border-black/5 bg-gradient-to-br from-white to-[#F7F5F2]",
        className
      )}
      aria-labelledby="footer-follow-heading"
    >
      <h2
        id="footer-follow-heading"
        className={cn(
          "font-heading text-xl font-medium tracking-tight sm:text-2xl",
          onDark ? "text-white" : "text-foreground"
        )}
      >
        Follow {WARRENTON_JUNK_SOCIAL.handle}
      </h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {platforms.map((platform) => (
          <a
            key={platform.id}
            href={platform.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={platform.accessibleLabel}
            onClick={() =>
              trackSocialFollow({ platform: platform.id, surface: "footer_social" })
            }
            className={cn(
              "inline-flex h-11 min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary",
              onDark
                ? "border border-white/20 bg-white/10 text-white hover:bg-white/20"
                : "border border-black/10 bg-white text-foreground hover:bg-muted/50"
            )}
          >
            <SocialIcon platform={platform.id} className="h-4 w-4" />
            {platform.name}
          </a>
        ))}
      </div>
      <div
        className={cn(
          "mt-5 space-y-1 text-sm",
          onDark ? "text-white/70" : "text-muted-foreground"
        )}
      >
        <p className={cn("font-semibold", onDark ? "text-white" : "text-foreground")}>
          {WARRENTON_JUNK_SOCIAL.operator}
        </p>
        <p>
          <a
            href={`tel:${SEO_ORG.phoneTel}`}
            className={cn(
              "font-semibold hover:underline",
              onDark ? "text-white" : "text-brand-primary"
            )}
          >
            {SEO_ORG.phone}
          </a>
        </p>
        <p>morris-services.com</p>
      </div>
      <div className="mt-4">
        <p
          className={cn(
            "text-[11px] font-semibold uppercase tracking-[0.16em]",
            onDark ? "text-white/50" : "text-muted-foreground"
          )}
        >
          Serving
        </p>
        <p
          className={cn(
            "mt-2 text-xs leading-relaxed sm:text-sm",
            onDark ? "text-white/65" : "text-muted-foreground"
          )}
        >
          {SOCIAL_SERVICE_COMMUNITIES.join(" · ")}
        </p>
      </div>
    </section>
  );
}
