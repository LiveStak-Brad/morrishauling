/** Stock / marketing image registry — replace with authentic Morris photos later.
 * Internal license/source records: `lib/seo/image-licenses.ts` (not rendered publicly).
 */

export type MarketingImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** Unsplash or other license note for internal reference */
  credit: string;
  /** When true, image is stock/representative — not Morris equipment or a completed Morris job */
  representative: boolean;
};

export const MARKETING_IMAGES: Record<string, MarketingImage> = {
  "dumpster-furniture-curbside": {
    src: "/marketing/dumpster-furniture-curbside.jpg",
    alt: "Roll-off dumpster filled with debris beside a sofa left at the curb for removal",
    width: 1600,
    height: 1067,
    credit: "Pexels — representative junk removal scene, not a Morris job or equipment",
    representative: true,
  },
  "dump-trailer-loaded-junk": {
    src: "/marketing/dump-trailer-loaded-junk.jpg",
    alt: "Open trailer loaded with furniture and household items ready for haul-away",
    width: 1600,
    height: 1067,
    credit: "Unsplash (Nico Knaack) — representative junk load, not a Morris trailer or job",
    representative: true,
  },
  "midwest-home-exterior": {
    src: "/marketing/midwest-home-exterior.jpg",
    alt: "Suburban home exterior representing Midwestern residential service areas",
    width: 1600,
    height: 1067,
    credit: "Unsplash — representative atmosphere, not Morris property",
    representative: true,
  },
  "organized-moving-boxes": {
    src: "/marketing/organized-moving-boxes.jpg",
    alt: "Stacked moving boxes in a clean interior space",
    width: 1600,
    height: 1067,
    credit: "Unsplash — representative atmosphere",
    representative: true,
  },
  "construction-materials-site": {
    src: "/marketing/construction-materials-site.jpg",
    alt: "Construction materials at a job site",
    width: 1600,
    height: 1067,
    credit: "Unsplash — representative atmosphere, not Morris equipment",
    representative: true,
  },
  "contractor-equipment-yard": {
    src: "/marketing/contractor-equipment-yard.jpg",
    alt: "Compact construction equipment in a yard",
    width: 1600,
    height: 1067,
    credit: "Unsplash — representative atmosphere, not Morris-owned fleet",
    representative: true,
  },
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
  "clean-living-room": {
    src: "/marketing/clean-living-room.jpg",
    alt: "Bright living room interior after clutter is cleared",
    width: 1600,
    height: 1067,
    credit: "Unsplash — representative atmosphere",
    representative: true,
  },
  "appliance-kitchen-ready": {
    src: "/marketing/appliance-kitchen-ready.jpg",
    alt: "Kitchen appliances in a residential setting",
    width: 1600,
    height: 1067,
    credit: "Unsplash — representative atmosphere",
    representative: true,
  },
};

export function getMarketingImage(key: string): MarketingImage | undefined {
  return MARKETING_IMAGES[key];
}
