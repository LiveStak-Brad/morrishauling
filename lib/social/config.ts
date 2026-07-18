/**
 * Centralized @WarrentonJunk social brand configuration.
 * All public social URLs and labels must come from here — no hardcoded profile links elsewhere.
 */

export type SocialPlatformId = "facebook" | "instagram" | "tiktok" | "youtube" | "x";

export type SocialSurface =
  | "announcement_bar"
  | "header_social"
  | "homepage_social"
  | "footer_social"
  | "booking_social"
  | "floating_social"
  | "follow_strip"
  | "latest_content"
  | "nav_mobile";

export type SocialPlatform = {
  id: SocialPlatformId;
  name: string;
  handle: string;
  profileUrl: string;
  analyticsEvent: "social_click" | "social_follow";
  accessibleLabel: string;
  ctaLabel: string;
  enabled: boolean;
};

export const WARRENTON_JUNK_SOCIAL = {
  displayName: "Warrenton Junk Removal | Morris Service Group LLC",
  handle: "@WarrentonJunk",
  handleBare: "WarrentonJunk",
  brandShort: "Warrenton Junk Removal",
  operator: "Morris Service Group LLC",
  location: "Warrenton, Missouri",
  announcement:
    "Watch REAL Junk Removal Jobs Every Week — Follow @WarrentonJunk",
} as const;

export const SOCIAL_PLATFORMS: readonly SocialPlatform[] = [
  {
    id: "facebook",
    name: "Facebook",
    handle: WARRENTON_JUNK_SOCIAL.handle,
    profileUrl: "https://www.facebook.com/WarrentonJunk",
    analyticsEvent: "social_follow",
    accessibleLabel: "Follow @WarrentonJunk on Facebook",
    ctaLabel: "Follow on Facebook",
    enabled: true,
  },
  {
    id: "instagram",
    name: "Instagram",
    handle: WARRENTON_JUNK_SOCIAL.handle,
    profileUrl: "https://www.instagram.com/WarrentonJunk",
    analyticsEvent: "social_follow",
    accessibleLabel: "Follow @WarrentonJunk on Instagram",
    ctaLabel: "Follow on Instagram",
    enabled: true,
  },
  {
    id: "tiktok",
    name: "TikTok",
    handle: WARRENTON_JUNK_SOCIAL.handle,
    profileUrl: "https://www.tiktok.com/@WarrentonJunk",
    analyticsEvent: "social_follow",
    accessibleLabel: "Follow @WarrentonJunk on TikTok",
    ctaLabel: "Follow on TikTok",
    enabled: true,
  },
  {
    id: "youtube",
    name: "YouTube",
    handle: WARRENTON_JUNK_SOCIAL.handle,
    profileUrl: "https://www.youtube.com/@WarrentonJunk",
    analyticsEvent: "social_follow",
    accessibleLabel: "Subscribe to @WarrentonJunk on YouTube",
    ctaLabel: "Subscribe on YouTube",
    enabled: true,
  },
  {
    id: "x",
    name: "X",
    handle: WARRENTON_JUNK_SOCIAL.handle,
    profileUrl: "https://x.com/WarrentonJunk",
    analyticsEvent: "social_follow",
    accessibleLabel: "Follow @WarrentonJunk on X",
    ctaLabel: "Follow on X",
    enabled: true,
  },
] as const;

export const SOCIAL_SERVICE_COMMUNITIES = [
  "Warrenton",
  "Wright City",
  "Truesdale",
  "Foristell",
  "Jonesburg",
  "Marthasville",
  "Innsbrook",
  "Pendleton",
  "Hawk Point",
  "Troy",
  "Wentzville",
  "Warren County",
  "Lincoln County",
  "St. Charles County",
] as const;

export const SOCIAL_CONTENT_KINDS = [
  "video",
  "photo",
  "before_after",
  "trailer_load",
  "appliance_removal",
  "furniture_removal",
  "garage_cleanout",
  "estate_cleanout",
  "property_cleanout",
  "construction_debris",
  "local_tips",
] as const;

export type SocialContentKind = (typeof SOCIAL_CONTENT_KINDS)[number];

export const SOCIAL_CONTENT_KIND_LABELS: Record<SocialContentKind, string> = {
  video: "Video",
  photo: "Photo",
  before_after: "Before/After",
  trailer_load: "Trailer Load",
  appliance_removal: "Appliance Removal",
  furniture_removal: "Furniture Removal",
  garage_cleanout: "Garage Cleanout",
  estate_cleanout: "Estate Cleanout",
  property_cleanout: "Property Cleanout",
  construction_debris: "Construction Debris",
  local_tips: "Local Tips",
};

export function enabledSocialPlatforms(): SocialPlatform[] {
  return SOCIAL_PLATFORMS.filter((p) => p.enabled);
}

export function socialPlatformById(id: SocialPlatformId): SocialPlatform | undefined {
  return SOCIAL_PLATFORMS.find((p) => p.id === id);
}

/** Profile URLs for Organization / LocalBusiness sameAs */
export function socialSameAsUrls(): string[] {
  return enabledSocialPlatforms().map((p) => p.profileUrl);
}

export const SOCIAL_DISMISS_KEYS = {
  announcementBar: "morris:dismiss:warrentonjunk-bar",
  floatingPill: "morris:dismiss:warrentonjunk-float",
} as const;
