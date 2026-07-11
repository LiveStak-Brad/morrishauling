/**
 * Internal stock-image license records. This metadata is not rendered publicly.
 *
 * Every image below is representative stock photography and does not depict
 * Morris-owned equipment, Morris employees, or Morris customer jobs.
 */
export type MarketingImageLicense = {
  key: string;
  localPath: string;
  sourceUrl: string | null;
  license: "Unsplash License" | "Pexels License";
  note: string;
};

const REPRESENTATIVE_NOTE =
  "Representative stock image; not Morris-owned equipment, Morris employees, or a Morris customer job.";

const UNVERIFIED_UNSPLASH_NOTE =
  "Unsplash stock — replace with authenticated Morris photo; verify source before commercial redistribution if needed. " +
  REPRESENTATIVE_NOTE;

export const MARKETING_IMAGE_LICENSES: readonly MarketingImageLicense[] = [
  {
    key: "dumpster-furniture-curbside",
    localPath: "/marketing/dumpster-furniture-curbside.jpg",
    sourceUrl: "https://www.pexels.com/photo/trash-on-street-in-city-7109515/",
    license: "Pexels License",
    note: REPRESENTATIVE_NOTE,
  },
  {
    key: "dump-trailer-loaded-junk",
    localPath: "/marketing/dump-trailer-loaded-junk.jpg",
    sourceUrl:
      "https://unsplash.com/photos/trailer-loaded-with-furniture-and-trash-on-cobblestone-street-iBXu_kVbXXQ",
    license: "Unsplash License",
    note: `Credit: Nico Knaack. ${REPRESENTATIVE_NOTE}`,
  },
  {
    key: "midwest-home-exterior",
    localPath: "/marketing/midwest-home-exterior.jpg",
    sourceUrl: null,
    license: "Unsplash License",
    note: UNVERIFIED_UNSPLASH_NOTE,
  },
  {
    key: "organized-moving-boxes",
    localPath: "/marketing/organized-moving-boxes.jpg",
    sourceUrl: null,
    license: "Unsplash License",
    note: UNVERIFIED_UNSPLASH_NOTE,
  },
  {
    key: "construction-materials-site",
    localPath: "/marketing/construction-materials-site.jpg",
    sourceUrl: null,
    license: "Unsplash License",
    note: UNVERIFIED_UNSPLASH_NOTE,
  },
  {
    key: "contractor-equipment-yard",
    localPath: "/marketing/contractor-equipment-yard.jpg",
    sourceUrl: null,
    license: "Unsplash License",
    note: UNVERIFIED_UNSPLASH_NOTE,
  },
  {
    key: "clean-living-room",
    localPath: "/marketing/clean-living-room.jpg",
    sourceUrl: null,
    license: "Unsplash License",
    note: UNVERIFIED_UNSPLASH_NOTE,
  },
  {
    key: "appliance-kitchen-ready",
    localPath: "/marketing/appliance-kitchen-ready.jpg",
    sourceUrl: null,
    license: "Unsplash License",
    note: UNVERIFIED_UNSPLASH_NOTE,
  },
];
