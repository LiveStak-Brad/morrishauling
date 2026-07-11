/** Stock / marketing image registry — replace with authentic Morris photos later. */

export type MarketingImage = {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** Unsplash or other license note for internal reference */
  credit: string;
  representative: true;
};

export const MARKETING_IMAGES: Record<string, MarketingImage> = {
  "garage-cleanout-residential": {
    src: "/marketing/garage-cleanout-residential.jpg",
    alt: "Residential garage with storage items ready for a cleanout",
    width: 1600,
    height: 1067,
    credit: "Unsplash — representative service atmosphere, not a Morris job",
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
