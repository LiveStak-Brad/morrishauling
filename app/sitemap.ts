import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/lib/seo/site";
import { areasForDivision } from "@/lib/seo/locations";
import { servicesForDivision } from "@/lib/seo/services";
import { allGuideSlugs } from "@/lib/seo/guides";
import { allItemSlugs } from "@/lib/seo/items";
import { allTopicSlugs } from "@/lib/seo/topics";

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
    { url: `${SITE_ORIGIN}/junk-removal/responsible-disposal`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_ORIGIN}/junk-removal/resources`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${SITE_ORIGIN}/junk-removal/latest`, lastModified: now, changeFrequency: "weekly", priority: 0.82 },
    { url: `${SITE_ORIGIN}/junk-removal/videos`, lastModified: now, changeFrequency: "weekly", priority: 0.82 },
    { url: `${SITE_ORIGIN}/junk-removal/gallery`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_ORIGIN}/junk-removal/community`, lastModified: now, changeFrequency: "weekly", priority: 0.78 },
    { url: `${SITE_ORIGIN}/junk-removal/guides`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_ORIGIN}/junk-removal/items`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_ORIGIN}/junk-removal/topics`, lastModified: now, changeFrequency: "weekly", priority: 0.75 },
    { url: `${SITE_ORIGIN}/junk-removal/tools`, lastModified: now, changeFrequency: "monthly", priority: 0.75 },
    { url: `${SITE_ORIGIN}/junk-removal/tools/load-size-estimator`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_ORIGIN}/junk-removal/tools/can-we-take-this`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_ORIGIN}/junk-removal/tools/service-area-checker`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_ORIGIN}/junk-removal/commercial`, lastModified: now, changeFrequency: "monthly", priority: 0.75 },
    { url: `${SITE_ORIGIN}/junk-removal/seasonal`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_ORIGIN}/service-area`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
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
  const guides = allGuideSlugs().map((slug) => ({
    url: `${SITE_ORIGIN}/junk-removal/guides/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.72,
  }));
  const items = allItemSlugs().map((slug) => ({
    url: `${SITE_ORIGIN}/junk-removal/items/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.72,
  }));
  const topics = allTopicSlugs().map((slug) => ({
    url: `${SITE_ORIGIN}/junk-removal/topics/${slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.74,
  }));

  return [
    ...staticRoutes,
    ...junkServices,
    ...haulingServices,
    ...junkAreas,
    ...haulingAreas,
    ...guides,
    ...items,
    ...topics,
  ];
}
