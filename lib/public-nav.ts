import type { DivisionId } from "@/lib/divisions";

export type PublicNavLink = {
  href: string;
  label: string;
  highlight?: boolean;
  external?: boolean;
  /** Visual indent in desktop menus (subservice under a hub). */
  nested?: boolean;
};

export type PublicNavGroup = {
  id: string;
  label: string;
  items: PublicNavLink[];
  /** Compact list for the mobile sheet. Falls back to items. */
  mobileItems?: PublicNavLink[];
};

/** Kept for promotional CTAs. Not a standalone header item. */
export const SCRAP_FRIDAYS_NAV: PublicNavLink = {
  href: "/free-scrap-fridays",
  label: "Free Scrap Pickup",
  highlight: true,
};

export const PUBLIC_NAV_GROUPS: PublicNavGroup[] = [
  {
    id: "services",
    label: "Services",
    items: [
      { href: "/junk-removal", label: "Junk Removal" },
      { href: "/free-scrap-fridays", label: "Free Scrap Pickup", highlight: true },
      { href: "/hauling", label: "Hauling" },
      { href: "/land-clearing", label: "Land Clearing" },
      { href: "/land-clearing/forestry-mulching", label: "Forestry Mulching", nested: true },
      { href: "/land-clearing/brush-clearing", label: "Brush Clearing", nested: true },
      { href: "/land-clearing/lot-clearing", label: "Lot Clearing", nested: true },
      { href: "/land-clearing/property-reclamation", label: "Property Reclamation", nested: true },
      { href: "/land-clearing/selective-clearing", label: "Selective Clearing", nested: true },
      { href: "/site-work", label: "Site Work" },
      { href: "/site-work/rough-grading", label: "Rough Grading", nested: true },
      { href: "/site-work/site-preparation", label: "Site Preparation", nested: true },
      { href: "/site-work/gravel-spreading", label: "Gravel Spreading", nested: true },
      { href: "/site-work/driveway-grading", label: "Driveway Grading", nested: true },
      { href: "/equipment-services", label: "Equipment Services" },
      { href: "/equipment-services/skid-steer-services", label: "Skid Steer Services", nested: true },
      { href: "/equipment-services/bobcat-services", label: "Bobcat Services", nested: true },
      { href: "/equipment-services/grapple-services", label: "Grapple Services", nested: true },
      { href: "/equipment-services/material-handling", label: "Material Handling", nested: true },
      { href: "/services", label: "All Services" },
    ],
    mobileItems: [
      { href: "/junk-removal", label: "Junk Removal" },
      { href: "/free-scrap-fridays", label: "Free Scrap Pickup", highlight: true },
      { href: "/hauling", label: "Hauling" },
      { href: "/land-clearing", label: "Land Clearing" },
      { href: "/site-work", label: "Site Work" },
      { href: "/equipment-services", label: "Equipment Services" },
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
      { href: "/projects", label: "Projects" },
      { href: "/contact", label: "Contact" },
      { href: "/careers", label: "Careers" },
    ],
  },
];

export const FOOTER_SERVICE_LINKS: PublicNavLink[] = [
  { href: "/junk-removal", label: "Junk Removal" },
  { href: "/free-scrap-fridays", label: "Free Scrap Pickup" },
  { href: "/hauling", label: "Hauling" },
  { href: "/land-clearing", label: "Land Clearing" },
  { href: "/land-clearing/forestry-mulching", label: "Forestry Mulching" },
  { href: "/site-work", label: "Site Work" },
  { href: "/equipment-services", label: "Equipment Services" },
];

export const FOOTER_JUNK_LINKS: PublicNavLink[] = [
  { href: "/junk-removal/services", label: "Junk removal services" },
  { href: "/junk-removal/demolition", label: "Demolition & structure removal" },
  { href: "/junk-removal/areas", label: "Junk removal areas" },
  { href: "/junk-removal/responsible-disposal", label: "Responsible disposal" },
  { href: "/junk-removal/resources", label: "Resource center" },
  { href: "/junk-removal/faq", label: "FAQs" },
  { href: "/junk-removal/latest", label: "Latest jobs" },
  { href: "/junk-removal/gallery", label: "Before & after gallery" },
  { href: "/junk-removal/items", label: "What we can take" },
];

export const HOMEPAGE_GOAL_CARDS: Array<{
  title: string;
  href: string;
  divisionId: DivisionId;
}> = [
  { title: "Clear junk or debris", href: "/junk-removal", divisionId: "junk_removal" },
  { title: "Move equipment or material", href: "/hauling", divisionId: "hauling" },
  { title: "Clear brush or overgrown land", href: "/land-clearing", divisionId: "land_clearing" },
  { title: "Grade or prepare property", href: "/site-work", divisionId: "site_work" },
  { title: "Need a machine or operator", href: "/equipment-services", divisionId: "equipment_services" },
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
  const items = [...group.items, ...(group.mobileItems ?? [])];
  return items.some((item) => navLinkIsActive(pathname, item.href));
}

export function navItemsForViewport(group: PublicNavGroup, mobile: boolean): PublicNavLink[] {
  if (mobile && group.mobileItems) return group.mobileItems;
  return group.items;
}
