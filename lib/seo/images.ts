/** Marketing image registry — branded/manifest keys preferred; stock demoted from primary heroes.
 * Internal license/source records: `lib/seo/image-licenses.ts` (not rendered publicly).
 */

import { IMAGE_MANIFEST, getManifestByImageKey } from "@/lib/seo/image-manifest";

export type MarketingImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** Unsplash or other license note for internal reference */
  credit: string;
  /** When true, image is stock/representative — not Morris equipment or a completed Morris job */
  representative: boolean;
  /** Authenticity note for ops when swapping real photos */
  replaceWithRealPhotosNote?: string;
};

/** Company-owned / existing assets (preferred over stock). */
const OWNED_IMAGES: Record<string, MarketingImage> = {
  "gooseneck-hauling": {
    src: "/gooseneckhaulingphoto.jpg",
    alt: "Gooseneck flatbed trailer used for equipment and material hauling",
    width: 640,
    height: 480,
    credit: "Company-provided gooseneck trailer photo (public/gooseneckhaulingphoto.jpg)",
    representative: false,
  },
  "junk-removal-truck": {
    src: "/junk.jpg",
    alt: "Pickup truck bed loaded with household junk during a residential removal job",
    width: 900,
    height: 1200,
    credit: "Company-provided junk removal photo (public/junk.jpg)",
    representative: false,
  },
  "furniture-removal": {
    src: "/furniture.jpeg",
    alt: "Dressers, armchair, and mattress staged outside for furniture removal",
    width: 1600,
    height: 800,
    credit: "Company-provided furniture removal photo (public/furniture.jpeg)",
    representative: false,
  },
};

/** Stock / atmosphere images — demoted; do not use as primary heroes when a branded key exists. */
const STOCK_IMAGES: Record<string, MarketingImage> = {
  "dumpster-furniture-curbside": {
    src: "/marketing/dumpster-furniture-curbside.jpg",
    alt: "Roll-off dumpster filled with debris beside a sofa left at the curb for removal",
    width: 1600,
    height: 1067,
    credit: "Pexels — representative junk removal scene, not a Morris job or equipment",
    representative: true,
    replaceWithRealPhotosNote: "Replace with real project photos when available",
  },
  "dump-trailer-loaded-junk": {
    src: "/marketing/dump-trailer-loaded-junk.jpg",
    alt: "Open trailer loaded with furniture and household items ready for haul-away",
    width: 1600,
    height: 1067,
    credit: "Unsplash (Nico Knaack) — representative junk load, not a Morris trailer or job",
    representative: true,
    replaceWithRealPhotosNote: "Replace with real project photos when available",
  },
  "midwest-home-exterior": {
    src: "/marketing/midwest-home-exterior.jpg",
    alt: "Suburban home exterior representing Midwestern residential service areas",
    width: 1600,
    height: 1067,
    credit: "Unsplash — representative atmosphere, not Morris property",
    representative: true,
    replaceWithRealPhotosNote: "Replace with real project photos when available",
  },
  "organized-moving-boxes": {
    src: "/marketing/organized-moving-boxes.jpg",
    alt: "Stacked moving boxes in a clean interior space",
    width: 1600,
    height: 1067,
    credit: "Unsplash — representative atmosphere",
    representative: true,
    replaceWithRealPhotosNote: "Replace with real project photos when available",
  },
  "construction-materials-site": {
    src: "/marketing/construction-materials-site.jpg",
    alt: "Construction materials at a job site",
    width: 1600,
    height: 1067,
    credit: "Unsplash — representative atmosphere, not Morris equipment",
    representative: true,
    replaceWithRealPhotosNote: "Replace with real project photos when available",
  },
  "contractor-equipment-yard": {
    src: "/marketing/contractor-equipment-yard.jpg",
    alt: "Compact construction equipment in a yard",
    width: 1600,
    height: 1067,
    credit: "Unsplash — representative atmosphere, not Morris-owned fleet",
    representative: true,
    replaceWithRealPhotosNote: "Replace with real project photos when available",
  },
  "clean-living-room": {
    src: "/marketing/clean-living-room.jpg",
    alt: "Bright living room interior after clutter is cleared",
    width: 1600,
    height: 1067,
    credit: "Unsplash — representative atmosphere",
    representative: true,
    replaceWithRealPhotosNote: "Replace with real project photos when available",
  },
  "appliance-kitchen-ready": {
    src: "/marketing/appliance-kitchen-ready.jpg",
    alt: "Kitchen appliances in a residential setting",
    width: 1600,
    height: 1067,
    credit: "Unsplash — representative atmosphere",
    representative: true,
    replaceWithRealPhotosNote: "Replace with real project photos when available",
  },
};

function manifestToMarketing(): Record<string, MarketingImage> {
  const out: Record<string, MarketingImage> = {};
  for (const entry of IMAGE_MANIFEST) {
    if (!entry.imageKey) continue;
    // Skip pure stock demotion entries that already live in STOCK_IMAGES
    if (entry.imageKey in STOCK_IMAGES) continue;
    out[entry.imageKey] = {
      src: entry.src,
      alt: entry.alt,
      width: entry.width,
      height: entry.height,
      credit:
        entry.status === "Complete" || entry.status === "Existing"
          ? "Morris Service Group LLC branded / owned asset"
          : "Branded interim marketing asset — replace with real Morris photos when available",
      representative: entry.status === "NeedsGenerated" || entry.status === "NeedsReplaced",
      replaceWithRealPhotosNote: entry.replaceWithRealPhotosNote,
    };
  }
  return out;
}

export const MARKETING_IMAGES: Record<string, MarketingImage> = {
  ...STOCK_IMAGES,
  ...OWNED_IMAGES,
  ...manifestToMarketing(),
};

export function getMarketingImage(key: string): MarketingImage | undefined {
  const fromRegistry = MARKETING_IMAGES[key];
  if (fromRegistry) return fromRegistry;
  const manifest = getManifestByImageKey(key);
  if (!manifest) return undefined;
  return {
    src: manifest.src,
    alt: manifest.alt,
    width: manifest.width,
    height: manifest.height,
    credit: "Branded interim marketing asset",
    representative: true,
    replaceWithRealPhotosNote: manifest.replaceWithRealPhotosNote,
  };
}

/** Prefer branded hub key; fall back to owned company photo. */
export function resolveHeroImageKey(preferred: string, fallback = "junk-removal-truck"): string {
  return getMarketingImage(preferred) ? preferred : fallback;
}

/**
 * Equipment heroes should prefer real Morris photos so we never display
 * AI trailers/trucks with fake or third-party phone numbers and ads.
 */
export const OWNED_EQUIPMENT_IMAGE_KEYS = [
  "junk-removal-truck",
  "gooseneck-hauling",
  "furniture-removal",
] as const;
