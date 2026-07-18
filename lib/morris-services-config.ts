export type CompanyLaunchStatus = "open" | "launching_soon" | "coming_soon" | "future_expansion";

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
  promise: "Your home, restored.",
  /** System positioning */
  tagline: "The standard for home services.",
  brandTagline: "One relationship. Every craft.",
  serviceCategoriesLine: "Residential · Commercial · Property care",
  footerMission:
    "We build trusted local service companies one craft at a time — starting in Warren, Lincoln & St. Charles Counties.",
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
  /**
   * Roadmap order: lightest startup cost / easiest to operate first.
   * Authority content (lib/authority) is division-tagged so these crafts can reuse
   * gallery/videos/community without redesign. Social stays @WarrentonJunk.
   * Seasonal driveway clearing can live under Lawn Care when that division opens.
   */
  futureCompanies: [
    { name: "Morris Cleaning", status: "coming_soon" as const, craft: "Cleaning" },
    { name: "Morris Window Cleaning", status: "coming_soon" as const, craft: "Window Cleaning" },
    { name: "Morris Power Washing", status: "coming_soon" as const, craft: "Power Washing" },
    { name: "Morris Lawn Care", status: "coming_soon" as const, craft: "Lawn Care" },
    { name: "Morris Handyman", status: "coming_soon" as const, craft: "Handyman" },
  ] satisfies FutureCompany[],
};
