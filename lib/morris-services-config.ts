import type { DivisionId } from "@/lib/divisions";

export type CompanyLaunchStatus = "open" | "launching_soon" | "coming_soon" | "future_expansion";

export type PublicDivisionCard = {
  divisionId: DivisionId;
  name: string;
  description: string;
  hubPath: string;
};

export type OperatingCompany = {
  slug: string;
  name: string;
  status: CompanyLaunchStatus;
  tagline: string;
  services: string[];
  hubPath: string;
  logo: string;
};

export type FutureCompany = {
  name: string;
  status: "coming_soon";
  craft: string;
  hubPath?: string;
};

export const morrisServicesConfig = {
  parentLegalName: "Morris Service Group LLC",
  publicBrandName: "Morris Services",
  logo: "/MorrisServicesLogo.png?v=6",
  publicWebsite: "https://morris-services.com",
  /** Primary emotional promise */
  promise: "Property work, handled.",
  /** System positioning */
  tagline: "Property services. Equipment services. One Morris standard.",
  brandTagline: "One relationship. Every service.",
  serviceCategoriesLine: "Junk Removal · Hauling · Land Clearing · Site Work · Equipment Services",
  heroSupport:
    "Professional junk removal, hauling, land clearing, site work and equipment services across our Missouri service area.",
  footerMission:
    "Property services and equipment services under one Morris standard — for homeowners, landowners, contractors, and property managers across our Missouri service area.",
  operatingCompanies: [
    {
      slug: "junk-removal",
      name: "Morris Junk Removal",
      status: "open" as const,
      tagline: "Clear the space. Keep the peace.",
      logo: "/MorrisServicesLogo.png?v=6",
      services: [
        "Residential Junk Removal",
        "Commercial Junk Removal",
        "Estate Cleanouts",
        "Garage Cleanouts",
        "Storage Units",
        "Foreclosures",
        "Furniture Removal",
        "Appliance Removal",
        "Hot Tub Removal",
        "Construction Debris",
        "Full Property Cleanouts",
      ],
      hubPath: "/junk-removal",
    },
  ] satisfies OperatingCompany[],
  /** Independent hauling division — live alongside Junk Removal */
  haulingDivision: {
    name: "Morris Hauling",
    status: "open" as const,
    craft: "Transport",
    hubPath: "/hauling",
    logo: "/MorrisServicesLogo.png?v=6",
    tagline: "Equipment, materials, and scheduled transport.",
    services: [
      "Equipment Hauling",
      "Material Delivery",
      "Trailer Transport",
      "Machinery Transport",
      "Building Materials",
      "General Freight",
      "Scheduled Transport",
      "Contractor Deliveries",
    ],
  },
  propertyDivisions: [
    {
      slug: "land-clearing",
      name: "Morris Land Clearing",
      status: "open" as const,
      tagline: "Forestry mulching, brush clearing, lot clearing and property reclamation.",
      logo: "/MorrisServicesLogo.png?v=6",
      services: [
        "Forestry Mulching",
        "Brush Clearing",
        "Lot Clearing",
        "Property Reclamation",
        "Honeysuckle Clearing",
        "Fence-Line Clearing",
      ],
      hubPath: "/land-clearing",
      divisionId: "land_clearing" as const,
    },
    {
      slug: "site-work",
      name: "Morris Site Work",
      status: "open" as const,
      tagline: "Grading, site preparation, dirt work, gravel and property improvement.",
      logo: "/MorrisServicesLogo.png?v=6",
      services: [
        "Rough Grading",
        "Site Preparation",
        "Gravel Spreading",
        "Dirt Moving",
        "Backfilling",
        "Driveway Grading",
      ],
      hubPath: "/site-work",
      divisionId: "site_work" as const,
    },
    {
      slug: "equipment-services",
      name: "Morris Equipment Services",
      status: "open" as const,
      tagline: "Skid steer, grapple, bucket, fork and machine-assisted property services.",
      logo: "/MorrisServicesLogo.png?v=6",
      services: [
        "Skid Steer Services",
        "Bobcat Services",
        "Grapple Services",
        "Material Handling",
      ],
      hubPath: "/equipment-services",
      divisionId: "equipment_services" as const,
    },
  ],
  /**
   * Internal roadmap only — do not present these as available public services.
   * Home-service crafts (cleaning, lawn, handyman) are no longer the expansion path.
   */
  futureCompanies: [] satisfies FutureCompany[],
  futureCapabilities: [
    "Excavation",
    "Drainage",
    "Additional land-management equipment",
  ] as const,
};

export const PUBLIC_DIVISION_CARDS: PublicDivisionCard[] = [
  {
    divisionId: "junk_removal",
    name: "Morris Junk Removal",
    description: "Residential and commercial junk removal, cleanouts and property cleanup.",
    hubPath: "/junk-removal",
  },
  {
    divisionId: "hauling",
    name: "Morris Hauling",
    description: "Equipment, machinery, materials and scheduled transport.",
    hubPath: "/hauling",
  },
  {
    divisionId: "land_clearing",
    name: "Morris Land Clearing",
    description: "Forestry mulching, brush clearing, lot clearing and property reclamation.",
    hubPath: "/land-clearing",
  },
  {
    divisionId: "site_work",
    name: "Morris Site Work",
    description: "Grading, site preparation, dirt work, gravel and property improvement.",
    hubPath: "/site-work",
  },
  {
    divisionId: "equipment_services",
    name: "Morris Equipment Services",
    description: "Skid steer, grapple, bucket, fork and machine-assisted property services.",
    hubPath: "/equipment-services",
  },
];
