/**
 * Local authority content model — one story can populate many website surfaces.
 * Division-aware so future Morris Service Group crafts can reuse the same system.
 */

export const AUTHORITY_SURFACES = [
  "featured_job",
  "before_after",
  "latest_video",
  "community_spotlight",
  "customer_review",
  "community_event",
  "google_review",
  "tip_of_week",
  "video_hub",
  "gallery",
  "latest_jobs",
  "shorts",
  "tiktok",
  "reels",
] as const;

export type AuthoritySurface = (typeof AUTHORITY_SURFACES)[number];

export const AUTHORITY_SURFACE_LABELS: Record<AuthoritySurface, string> = {
  featured_job: "Featured Job of the Week",
  before_after: "Recent Before & After",
  latest_video: "Latest Video",
  community_spotlight: "Community Spotlight",
  customer_review: "Customer Review Spotlight",
  community_event: "Community Events",
  google_review: "Recent Google Review",
  tip_of_week: "Junk Removal Tip of the Week",
  video_hub: "Video Hub",
  gallery: "Before & After Gallery",
  latest_jobs: "Latest Jobs",
  shorts: "YouTube Shorts",
  tiktok: "TikTok",
  reels: "Reels",
};

export const PROPERTY_TYPES = [
  "residential",
  "commercial",
  "estate",
  "garage",
  "storage_unit",
  "construction",
] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  residential: "Residential",
  commercial: "Commercial",
  estate: "Estate",
  garage: "Garage",
  storage_unit: "Storage Unit",
  construction: "Construction",
};

export const COMMUNITY_EVENT_KINDS = [
  "cookout",
  "networking",
  "partnership",
  "cleanup",
  "charity",
  "food_drive",
  "school_supply",
  "sponsor",
  "other",
] as const;

export type CommunityEventKind = (typeof COMMUNITY_EVENT_KINDS)[number];

export const COMMUNITY_EVENT_LABELS: Record<CommunityEventKind, string> = {
  cookout: "Community Cookouts",
  networking: "Networking Events",
  partnership: "Business Partnerships",
  cleanup: "Community Cleanups",
  charity: "Charity Events",
  food_drive: "Food Drives",
  school_supply: "School Supply Drives",
  sponsor: "Sponsor Opportunities",
  other: "Community",
};

/** Future-ready division tags beyond live junk/hauling ops. */
export const AUTHORITY_DIVISION_TAGS = [
  "junk_removal",
  "hauling",
  "pressure_washing",
  "window_cleaning",
  "landscaping",
  "snow_removal",
  "demolition",
  "roll_off_dumpsters",
  "dumpster_rental",
  "concrete_removal",
  "property_maintenance",
  "commercial_services",
] as const;

export type AuthorityDivisionTag = (typeof AUTHORITY_DIVISION_TAGS)[number];

export type AuthoritySocialLinks = Partial<{
  facebook: string;
  instagram: string;
  tiktok: string;
  youtube: string;
  x: string;
  google: string;
}>;

export type AuthorityStory = {
  id: string;
  division_id: AuthorityDivisionTag;
  title: string;
  description: string | null;
  summary: string | null;
  location: string | null;
  city: string | null;
  service_category: string | null;
  property_type: PropertyType | null;
  item_removed: string | null;
  event_kind: CommunityEventKind | null;
  surfaces: AuthoritySurface[];
  before_image_url: string | null;
  after_image_url: string | null;
  photo_urls: string[];
  video_url: string | null;
  youtube_id: string | null;
  thumbnail_url: string | null;
  internal_path: string | null;
  social_links: AuthoritySocialLinks;
  published: boolean;
  published_at: string | null;
  display_order: number;
  featured: boolean;
  created_at: string;
  updated_at: string;
};
