/** Canonical public site SEO constants — truthful only. */

import { socialPlatformById, socialSameAsUrls } from "@/lib/social/config";
import {
  ALL_PUBLIC_COUNTIES,
  COMPANY_PRIMARY_COUNTIES,
  EXTENDED_SERVICE_COUNTIES,
  serviceAreaSeoLabel,
} from "@/lib/service-coverage";

export const SITE_ORIGIN = "https://www.morris-services.com";

export const SEO_ORG = {
  legalName: "Morris Service Group LLC",
  brandName: "Morris Services",
  url: SITE_ORIGIN,
  logo: `${SITE_ORIGIN}/MorrisServicesLogo.png?v=6`,
  phone: "(636) 751-4645",
  phoneTel: "+16367514645",
  email: "hello@morris-services.com",
  /** Prefer lib/social/config for new code — derived from SocialConfig */
  facebook: socialPlatformById("facebook")!.profileUrl,
  sameAs: socialSameAsUrls(),
  serviceAreaLabel: serviceAreaSeoLabel(),
  primaryCounties: COMPANY_PRIMARY_COUNTIES.map((c) => c.name),
  extendedCounties: EXTENDED_SERVICE_COUNTIES.map((c) => c.name),
  servedCounties: ALL_PUBLIC_COUNTIES.map((c) => c.name),
} as const;

export const DIVISION_SEO = {
  junk_removal: {
    id: "junk_removal" as const,
    name: "Morris Junk Removal",
    shortName: "Junk Removal",
    path: "/junk-removal",
    bookPath: "/book?division=junk_removal",
    logo: `${SITE_ORIGIN}/MorrisServicesLogo.png?v=6`,
    ogImage: "/og/og-junk-removal.png",
    tagline: "Clear the space. Keep the peace.",
    description:
      "Junk removal, furniture and appliance pickup, garage and estate cleanouts for Warren, Lincoln, St. Charles and nearby Missouri counties.",
  },
  hauling: {
    id: "hauling" as const,
    name: "Morris Hauling",
    shortName: "Hauling",
    path: "/hauling",
    bookPath: "/book?division=hauling",
    logo: `${SITE_ORIGIN}/MorrisServicesLogo.png?v=6`,
    ogImage: "/og/og-hauling.png",
    tagline: "Equipment, materials, and scheduled transport.",
    description:
      "Local equipment hauling, machinery transport, material delivery, and contractor hauling across Warren County and nearby Missouri communities.",
  },
  land_clearing: {
    id: "land_clearing" as const,
    name: "Morris Land Clearing",
    shortName: "Land Clearing",
    path: "/land-clearing",
    bookPath: "/book?division=land_clearing",
    logo: `${SITE_ORIGIN}/MorrisServicesLogo.png?v=6`,
    ogImage: "/og/og-morris-services.png",
    tagline: "Reclaim the ground. Leave it usable.",
    description:
      "Forestry mulching, brush clearing, lot clearing, and overgrown property reclamation for Warren County and nearby Missouri communities.",
  },
  site_work: {
    id: "site_work" as const,
    name: "Morris Site Work",
    shortName: "Site Work",
    path: "/site-work",
    bookPath: "/book?division=site_work",
    logo: `${SITE_ORIGIN}/MorrisServicesLogo.png?v=6`,
    ogImage: "/og/og-morris-services.png",
    tagline: "Grade it. Place it. Get the site ready.",
    description:
      "Rough grading, site preparation, gravel spreading, dirt moving, and driveway grading across Warren County and nearby Missouri communities.",
  },
  equipment_services: {
    id: "equipment_services" as const,
    name: "Morris Equipment Services",
    shortName: "Equipment Services",
    path: "/equipment-services",
    bookPath: "/book?division=equipment_services",
    logo: `${SITE_ORIGIN}/MorrisServicesLogo.png?v=6`,
    ogImage: "/og/og-morris-services.png",
    tagline: "A compact machine and an operator — for the outcome you need.",
    description:
      "Professional skid steer and Bobcat services, grapple work, and material handling in Warren County and nearby Missouri communities. Independent contractor.",
  },
} as const;

export type SeoDivisionId = keyof typeof DIVISION_SEO;
