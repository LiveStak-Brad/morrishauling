"use client";

import { trackMarketingEvent } from "@/lib/seo/analytics";
import type { SocialPlatformId, SocialSurface } from "@/lib/social/config";

export function trackSocialFollow(input: {
  platform: SocialPlatformId;
  surface: SocialSurface;
  eventName?: "social_click" | "social_follow";
}) {
  const eventName = input.eventName ?? "social_follow";
  trackMarketingEvent(eventName, {
    division: "junk_removal",
    label: `${input.surface}:${input.platform}`,
    platform: input.platform,
    surface: input.surface,
  });

  // Fire-and-forget persistence for admin dashboard (privacy-safe fields only).
  if (typeof window === "undefined") return;
  void fetch("/api/public/social-click", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      platform: input.platform,
      surface: input.surface,
      path: window.location.pathname,
      referrer: document.referrer ? new URL(document.referrer).hostname : undefined,
      device: window.matchMedia("(max-width: 767px)").matches ? "mobile" : "desktop",
    }),
    keepalive: true,
  }).catch(() => undefined);
}
