export type PublicNavLink = {
  href: string;
  label: string;
  highlight?: boolean;
  external?: boolean;
};

export type PublicNavGroup = {
  id: string;
  label: string;
  items: PublicNavLink[];
};

/** Top-level Free Scrap Fridays — high-visibility marketing funnel. */
export const SCRAP_FRIDAYS_NAV: PublicNavLink = {
  href: "/free-scrap-fridays",
  label: "Scrap Pickup",
};

export const PUBLIC_NAV_GROUPS: PublicNavGroup[] = [
  {
    id: "services",
    label: "Services",
    items: [
      { href: "/junk-removal", label: "Junk Removal" },
      {
        href: "/free-scrap-fridays",
        label: "Scrap Pickup",
        highlight: true,
      },
      { href: "/hauling", label: "Hauling" },
      { href: "/land-clearing", label: "Land Clearing" },
      { href: "/land-clearing/forestry-mulching", label: "Forestry Mulching" },
      { href: "/land-clearing/brush-clearing", label: "Brush Clearing" },
      { href: "/site-work", label: "Site Work" },
      { href: "/site-work/rough-grading", label: "Rough Grading" },
      { href: "/equipment-services", label: "Equipment Services" },
      { href: "/equipment-services/skid-steer-services", label: "Skid Steer Services" },
      { href: "/equipment-services/bobcat-services", label: "Bobcat Services" },
      { href: "/junk-removal/demolition", label: "Demolition" },
      { href: "/projects", label: "Projects" },
      { href: "/services", label: "All Services" },
    ],
  },
  {
    id: "areas",
    label: "Areas",
    items: [
      { href: "/service-area", label: "Service Areas" },
      { href: "/junk-removal/areas/warrenton", label: "Warrenton" },
      { href: "/junk-removal/areas/warren-county", label: "Warren County" },
      { href: "/junk-removal/areas/wright-city", label: "Wright City" },
      { href: "/junk-removal/areas/foristell", label: "Foristell" },
      { href: "/junk-removal/areas", label: "View All Areas" },
    ],
  },
  {
    id: "resources",
    label: "Resources",
    items: [
      { href: "/junk-removal/resources", label: "Resource Center" },
      { href: "/pricing", label: "Pricing" },
      { href: "/junk-removal/guides", label: "Guides" },
      { href: "/junk-removal/faq", label: "FAQs" },
      {
        href: "/junk-removal/tools/load-size-estimator",
        label: "Load Size Estimator",
      },
      {
        href: "/junk-removal/tools/can-we-take-this",
        label: "Can We Take This?",
      },
      {
        href: "/junk-removal/responsible-disposal",
        label: "Recycling Information",
      },
    ],
  },
  {
    id: "media",
    label: "Media",
    items: [
      { href: "/junk-removal/videos", label: "Videos" },
      { href: "/junk-removal/gallery", label: "Before & After" },
      { href: "/junk-removal/latest", label: "Our Jobs" },
      { href: "/junk-removal/community", label: "Community" },
    ],
  },
  {
    id: "company",
    label: "Company",
    items: [
      { href: "/about", label: "About" },
      { href: "/#standard", label: "The Morris Standard" },
      { href: "/contact", label: "Contact" },
      { href: "/careers", label: "Careers" },
    ],
  },
];

export function navLinkIsActive(pathname: string, href: string): boolean {
  const path = href.split("?")[0].split("#")[0];
  if (!path || path === "/") return pathname === "/";
  if (path === "/junk-removal") return pathname === "/junk-removal";
  if (path === "/hauling") return pathname === "/hauling";
  if (path === "/land-clearing") return pathname === "/land-clearing";
  if (path === "/site-work") return pathname === "/site-work";
  if (path === "/equipment-services") return pathname === "/equipment-services";
  if (path === "/services") return pathname === "/services";
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function navGroupIsActive(pathname: string, group: PublicNavGroup): boolean {
  return group.items.some((item) => navLinkIsActive(pathname, item.href));
}
