export type CompanyLaunchStatus = "launching_soon" | "coming_soon" | "future_expansion";

export type OperatingCompany = {
  slug: string;
  name: string;
  status: CompanyLaunchStatus;
  tagline: string;
  services: string[];
  hubPath: string;
};

export type FutureCompany = {
  name: string;
  status: "coming_soon";
};

export const morrisServicesConfig = {
  parentLegalName: "Morris Service Group LLC",
  publicBrandName: "Morris Services",
  logo: "/MorrisServicesLogo.png?v=3",
  publicWebsite: "https://morris-services.com",
  tagline: "Professional Local Service Companies",
  brandTagline: "One Company. Multiple Solutions. Real Results.",
  serviceCategoriesLine: "Residential · Commercial · Property Services",
  footerMission:
    "Our goal is to become the most trusted local service company in Missouri by building great businesses one at a time.",
  operatingCompanies: [
    {
      slug: "junk-removal",
      name: "Morris Hauling & Junk Removal",
      status: "launching_soon" as const,
      tagline: "Residential and commercial junk removal, cleanouts, and light hauling.",
      services: [
        "Residential Junk Removal",
        "Commercial Junk Removal",
        "Cleanouts",
        "Furniture Removal",
        "Appliance Removal",
        "Light Hauling",
      ],
      hubPath: "/junk-removal",
    },
  ] satisfies OperatingCompany[],
  futureCompanies: [
    { name: "Morris Window Cleaning", status: "coming_soon" as const },
    { name: "Morris Pressure Washing", status: "coming_soon" as const },
    { name: "Morris Landscaping", status: "coming_soon" as const },
    { name: "Morris Gutter Cleaning", status: "coming_soon" as const },
    { name: "Morris Snow Removal", status: "coming_soon" as const },
  ] satisfies FutureCompany[],
};
