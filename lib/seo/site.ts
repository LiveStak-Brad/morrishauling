/** Canonical public site SEO constants — truthful only. */

import { socialPlatformById, socialSameAsUrls } from "@/lib/social/config";

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
  serviceAreaLabel: "Warren, Lincoln, St. Charles, Franklin & Jefferson Counties, Missouri",
  primaryCounties: [
    "Warren County",
    "Lincoln County",
    "St. Charles County",
    "Franklin County",
    "Jefferson County",
  ] as const,
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
} as const;

export type SeoDivisionId = keyof typeof DIVISION_SEO;
