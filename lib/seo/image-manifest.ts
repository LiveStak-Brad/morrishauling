/** Typed image manifest for SEO — interim AI/branded assets swap to real photos without layout changes. */

export type ImageSlot = "hero" | "section" | "og" | "social";

export type ImageManifestStatus =
  | "Existing"
  | "NeedsGenerated"
  | "NeedsReplaced"
  | "Complete";

export type ImageManifestEntry = {
  id: string;
  pagePath: string;
  slot: ImageSlot;
  /** Public path under /public */
  src: string;
  filename: string;
  alt: string;
  title: string;
  caption: string;
  width: number;
  height: number;
  lazy: boolean;
  preload: boolean;
  status: ImageManifestStatus;
  /** When set, ops should replace with authentic Morris job photography. */
  replaceWithRealPhotosNote?: string;
  /** Key used by MarketingImage / MARKETING_IMAGES */
  imageKey?: string;
};

const REAL = "Replace with real project photos when available";

function branded(
  partial: Omit<ImageManifestEntry, "width" | "height" | "lazy" | "preload" | "src" | "filename"> & {
    filename: string;
    width?: number;
    height?: number;
    lazy?: boolean;
    preload?: boolean;
  }
): ImageManifestEntry {
  // Prefer optimized WebP on disk (generated from interim PNG masters).
  const filename = partial.filename.replace(/\.png$/i, ".webp");
  return {
    width: 1600,
    height: 900,
    lazy: partial.slot !== "hero",
    preload: partial.slot === "hero",
    ...partial,
    filename,
    src: `/marketing/branded/${filename}`,
  };
}

export const IMAGE_MANIFEST: ImageManifestEntry[] = [
  // —— P0 hubs ——
  branded({
    id: "home-hero",
    pagePath: "/",
    slot: "hero",
    filename: "home-hero-warrenton-mo.png",
    alt: "Morris Service Group LLC dump trailer ready for residential junk removal near Warrenton, Missouri",
    title: "Morris Junk Removal — Warrenton MO",
    caption: "Local junk removal and hauling from our Warren County base.",
    status: "NeedsReplaced",
    replaceWithRealPhotosNote: REAL,
    imageKey: "home-hero",
  }),
  {
    id: "home-og",
    pagePath: "/",
    slot: "og",
    src: "/og/og-morris-services.png",
    filename: "og-morris-services.png",
    alt: "Morris Service Group LLC — Junk Removal and Hauling in Missouri",
    title: "Morris Services",
    caption: "Open Graph share image for Morris Services.",
    width: 1200,
    height: 630,
    lazy: true,
    preload: false,
    status: "Existing",
  },
  branded({
    id: "junk-hub-hero",
    pagePath: "/junk-removal",
    slot: "hero",
    filename: "junk-removal-warrenton-mo.png",
    alt: "Professional junk removal dump trailer staged for a residential cleanout in Warrenton, Missouri",
    title: "Junk Removal Warrenton MO",
    caption: "Residential and commercial junk removal across Warren County.",
    status: "NeedsReplaced",
    replaceWithRealPhotosNote: REAL,
    imageKey: "junk-hub-hero",
  }),
  branded({
    id: "hauling-hub-hero",
    pagePath: "/hauling",
    slot: "hero",
    filename: "equipment-hauling-warren-county.png",
    alt: "Gooseneck trailer staged for equipment hauling in Warren County, Missouri",
    title: "Equipment Hauling Warren County",
    caption: "Scheduled equipment and material transport.",
    status: "NeedsReplaced",
    replaceWithRealPhotosNote: REAL,
    imageKey: "hauling-hub-hero",
  }),
  branded({
    id: "fsf-hero",
    pagePath: "/free-scrap-fridays",
    slot: "hero",
    filename: "free-scrap-pickup-warrenton.png",
    alt: "Free scrap metal pickup community program in Warrenton, Missouri — Free Scrap Fridays",
    title: "Free Scrap Fridays Warrenton",
    caption: "Community scrap pickup — Scrappy-friendly promotional art.",
    status: "NeedsReplaced",
    imageKey: "fsf-hero",
  }),
  branded({
    id: "pricing-hero",
    pagePath: "/pricing",
    slot: "hero",
    filename: "junk-removal-pricing-warrenton.png",
    alt: "Photo estimate process for junk removal pricing near Warrenton, Missouri",
    title: "Junk Removal Pricing",
    caption: "Clear estimates from photos and access details.",
    status: "NeedsReplaced",
    replaceWithRealPhotosNote: REAL,
    imageKey: "pricing-hero",
  }),
  branded({
    id: "book-hero",
    pagePath: "/book",
    slot: "hero",
    filename: "book-junk-removal-estimate-mo.png",
    alt: "Request a junk removal or hauling estimate with Morris Service Group LLC",
    title: "Book an Estimate",
    caption: "Photo-based estimates for junk removal and hauling.",
    status: "NeedsReplaced",
    replaceWithRealPhotosNote: REAL,
    imageKey: "book-hero",
  }),
  branded({
    id: "service-area-hero",
    pagePath: "/service-area",
    slot: "hero",
    filename: "service-area-warren-county-mo.png",
    alt: "Morris Service Group LLC service area covering Warren County and nearby Missouri communities",
    title: "Service Area Missouri",
    caption: "Local coverage from our Warrenton base.",
    status: "NeedsReplaced",
    replaceWithRealPhotosNote: REAL,
    imageKey: "service-area-hero",
  }),
  branded({
    id: "demolition-hub-hero",
    pagePath: "/junk-removal/demolition",
    slot: "hero",
    filename: "structure-removal-warren-county.png",
    alt: "Structure removal and debris loading assessment in Warren County, Missouri",
    title: "Demolition & Structure Removal",
    caption: "Honest scoping for shed, deck, fence, and structure projects.",
    status: "NeedsReplaced",
    replaceWithRealPhotosNote: REAL,
    imageKey: "demolition-hub-hero",
  }),

  // —— P1 demolition pages ——
  branded({
    id: "demolition-interior",
    pagePath: "/junk-removal/demolition/interior-demolition",
    slot: "hero",
    filename: "interior-demolition-warren-county.png",
    alt: "Interior demolition debris staged for haul-away in Warren County, Missouri",
    title: "Interior Demolition",
    caption: "Selective interior tear-out debris and haul-away.",
    status: "NeedsReplaced",
    replaceWithRealPhotosNote: REAL,
    imageKey: "demolition-interior",
  }),
  branded({
    id: "demolition-shed",
    pagePath: "/junk-removal/demolition/shed-demolition",
    slot: "hero",
    filename: "shed-demolition-warren-county.png",
    alt: "Small shed tear-down and debris pile ready for junk removal near Warrenton",
    title: "Shed Demolition",
    caption: "Light shed tear-down scoped project-by-project.",
    status: "NeedsReplaced",
    replaceWithRealPhotosNote: REAL,
    imageKey: "demolition-shed",
  }),
  branded({
    id: "demolition-deck",
    pagePath: "/junk-removal/demolition/deck-demolition",
    slot: "hero",
    filename: "deck-demolition-warren-county.png",
    alt: "Deck board and lumber debris from deck removal in Warren County",
    title: "Deck Demolition",
    caption: "Deck tear-down debris haul-away.",
    status: "NeedsReplaced",
    replaceWithRealPhotosNote: REAL,
    imageKey: "demolition-deck",
  }),
  branded({
    id: "demolition-fence",
    pagePath: "/junk-removal/demolition/fence-removal",
    slot: "hero",
    filename: "fence-removal-warren-county.png",
    alt: "Fence panels and posts stacked for haul-away after fence removal",
    title: "Fence Removal",
    caption: "Fence panel and post debris removal.",
    status: "NeedsReplaced",
    replaceWithRealPhotosNote: REAL,
    imageKey: "demolition-fence",
  }),
  branded({
    id: "demolition-garage",
    pagePath: "/junk-removal/demolition/garage-demolition",
    slot: "hero",
    filename: "garage-demolition-warren-county.png",
    alt: "Garage structure assessment for demolition and debris haul-away in Missouri",
    title: "Garage Demolition",
    caption: "Garage projects scoped honestly before work begins.",
    status: "NeedsReplaced",
    replaceWithRealPhotosNote: REAL,
    imageKey: "demolition-garage",
  }),
  branded({
    id: "demolition-barn",
    pagePath: "/junk-removal/demolition/barn-demolition",
    slot: "hero",
    filename: "barn-demolition-warren-county.png",
    alt: "Rural barn structure review for demolition planning in Warren County",
    title: "Barn Demolition",
    caption: "Barn projects often need extra planning and equipment.",
    status: "NeedsReplaced",
    replaceWithRealPhotosNote: REAL,
    imageKey: "demolition-barn",
  }),
  branded({
    id: "demolition-pole-barn",
    pagePath: "/junk-removal/demolition/pole-barn-demolition",
    slot: "hero",
    filename: "pole-barn-demolition-warren-county.png",
    alt: "Pole barn structure and metal debris assessment for removal",
    title: "Pole Barn Demolition",
    caption: "Pole barn scoping with honest equipment limits.",
    status: "NeedsReplaced",
    replaceWithRealPhotosNote: REAL,
    imageKey: "demolition-pole-barn",
  }),
  branded({
    id: "demolition-mobile-home",
    pagePath: "/junk-removal/demolition/mobile-home-demolition",
    slot: "hero",
    filename: "mobile-home-demolition-missouri.png",
    alt: "Mobile home removal planning and debris haul-away assessment in Missouri",
    title: "Mobile Home Demolition",
    caption: "Complex scopes reviewed project-by-project.",
    status: "NeedsReplaced",
    replaceWithRealPhotosNote: REAL,
    imageKey: "demolition-mobile-home",
  }),
  branded({
    id: "demolition-concrete",
    pagePath: "/junk-removal/demolition/concrete-removal",
    slot: "hero",
    filename: "concrete-removal-warren-county.png",
    alt: "Broken concrete and patio debris staged for haul-away in Warren County",
    title: "Concrete Removal",
    caption: "Concrete debris haul-away when loadable with our equipment.",
    status: "NeedsReplaced",
    replaceWithRealPhotosNote: REAL,
    imageKey: "demolition-concrete",
  }),
  branded({
    id: "demolition-structure",
    pagePath: "/junk-removal/demolition/structure-removal",
    slot: "hero",
    filename: "structure-removal-assessment-mo.png",
    alt: "Small structure removal assessment with dump trailer for debris haul-away",
    title: "Structure Removal",
    caption: "Honest evaluation of small structure removal scopes.",
    status: "NeedsReplaced",
    replaceWithRealPhotosNote: REAL,
    imageKey: "demolition-structure",
  }),

  // —— P2 top cities ——
  branded({
    id: "area-warrenton",
    pagePath: "/junk-removal/areas/warrenton",
    slot: "hero",
    filename: "garage-cleanout-warrenton-mo.png",
    alt: "Residential garage cleanout scene representing junk removal in Warrenton, Missouri",
    title: "Junk Removal Warrenton",
    caption: "Home-base junk removal for Warrenton neighborhoods.",
    status: "NeedsReplaced",
    replaceWithRealPhotosNote: REAL,
    imageKey: "area-warrenton",
  }),
  branded({
    id: "area-wright-city",
    pagePath: "/junk-removal/areas/wright-city",
    slot: "hero",
    filename: "junk-removal-wright-city-mo.png",
    alt: "Midwest residential property ready for junk removal in Wright City, Missouri",
    title: "Junk Removal Wright City",
    caption: "Wright City cleanouts and haul-away.",
    status: "NeedsReplaced",
    replaceWithRealPhotosNote: REAL,
    imageKey: "area-wright-city",
  }),
  branded({
    id: "area-troy",
    pagePath: "/junk-removal/areas/troy",
    slot: "hero",
    filename: "junk-removal-troy-mo.png",
    alt: "Rural driveway and home exterior representing junk removal near Troy, Missouri",
    title: "Junk Removal Troy",
    caption: "Troy and Lincoln County junk removal.",
    status: "NeedsReplaced",
    replaceWithRealPhotosNote: REAL,
    imageKey: "area-troy",
  }),
  branded({
    id: "area-wentzville",
    pagePath: "/junk-removal/areas/wentzville",
    slot: "hero",
    filename: "junk-removal-wentzville-mo.png",
    alt: "Suburban home driveway scene for junk removal in Wentzville, Missouri",
    title: "Junk Removal Wentzville",
    caption: "Wentzville residential and commercial cleanouts.",
    status: "NeedsReplaced",
    replaceWithRealPhotosNote: REAL,
    imageKey: "area-wentzville",
  }),
  branded({
    id: "area-foristell",
    pagePath: "/junk-removal/areas/foristell",
    slot: "hero",
    filename: "junk-removal-foristell-mo.png",
    alt: "Acreage property access for junk removal near Foristell, Missouri",
    title: "Junk Removal Foristell",
    caption: "Foristell properties between Warren and St. Charles counties.",
    status: "NeedsReplaced",
    replaceWithRealPhotosNote: REAL,
    imageKey: "area-foristell",
  }),
  branded({
    id: "area-washington",
    pagePath: "/junk-removal/areas/washington",
    slot: "hero",
    filename: "junk-removal-washington-mo.png",
    alt: "Franklin County residential scene for junk removal in Washington, Missouri",
    title: "Junk Removal Washington MO",
    caption: "Washington Missouri junk removal.",
    status: "NeedsReplaced",
    replaceWithRealPhotosNote: REAL,
    imageKey: "area-washington",
  }),
  branded({
    id: "area-ofallon",
    pagePath: "/junk-removal/areas/ofallon",
    slot: "hero",
    filename: "junk-removal-ofallon-mo.png",
    alt: "Suburban subdivision driveway for junk removal in O’Fallon, Missouri",
    title: "Junk Removal O’Fallon",
    caption: "O’Fallon cleanouts with HOA and access notes.",
    status: "NeedsReplaced",
    replaceWithRealPhotosNote: REAL,
    imageKey: "area-ofallon",
  }),

  // Authenticity-sensitive stock demotion markers (not primary heroes)
  {
    id: "stock-dumpster-furniture",
    pagePath: "/_stock",
    slot: "section",
    src: "/marketing/dumpster-furniture-curbside.jpg",
    filename: "dumpster-furniture-curbside.jpg",
    alt: "Representative dumpster and furniture scene — not a Morris job",
    title: "Stock — demoted",
    caption: "Demoted from primary hero use.",
    width: 1600,
    height: 1067,
    lazy: true,
    preload: false,
    status: "NeedsReplaced",
    replaceWithRealPhotosNote: REAL,
    imageKey: "dumpster-furniture-curbside",
  },
];

export function getManifestForPage(pagePath: string): ImageManifestEntry[] {
  return IMAGE_MANIFEST.filter((e) => e.pagePath === pagePath);
}

export function getManifestByImageKey(imageKey: string): ImageManifestEntry | undefined {
  return IMAGE_MANIFEST.find((e) => e.imageKey === imageKey);
}

export function getManifestById(id: string): ImageManifestEntry | undefined {
  return IMAGE_MANIFEST.find((e) => e.id === id);
}
