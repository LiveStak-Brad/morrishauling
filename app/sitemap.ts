import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/lib/seo/site";
import { areasForDivision } from "@/lib/seo/locations";
import { servicesForDivision } from "@/lib/seo/services";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: SITE_ORIGIN, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_ORIGIN}/junk-removal`, lastModified: now, changeFrequency: "weekly", priority: 0.95 },
    { url: `${SITE_ORIGIN}/hauling`, lastModified: now, changeFrequency: "weekly", priority: 0.95 },
    { url: `${SITE_ORIGIN}/services`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_ORIGIN}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_ORIGIN}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_ORIGIN}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_ORIGIN}/book`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_ORIGIN}/careers`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${SITE_ORIGIN}/careers/jobs`, lastModified: now, changeFrequency: "weekly", priority: 0.55 },
    { url: `${SITE_ORIGIN}/junk-removal/services`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${SITE_ORIGIN}/hauling/services`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${SITE_ORIGIN}/junk-removal/areas`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_ORIGIN}/hauling/areas`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
  ];

  const junkServices = servicesForDivision("junk_removal").map((s) => ({
    url: `${SITE_ORIGIN}/junk-removal/services/${s.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.75,
  }));
  const haulingServices = servicesForDivision("hauling").map((s) => ({
    url: `${SITE_ORIGIN}/hauling/services/${s.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.75,
  }));
  const junkAreas = areasForDivision("junk_removal").map((a) => ({
    url: `${SITE_ORIGIN}/junk-removal/areas/${a.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));
  const haulingAreas = areasForDivision("hauling").map((a) => ({
    url: `${SITE_ORIGIN}/hauling/areas/${a.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...junkServices, ...haulingServices, ...junkAreas, ...haulingAreas];
}
