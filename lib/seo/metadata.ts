import type { Metadata } from "next";
import { SITE_ORIGIN } from "@/lib/seo/site";

export function absoluteUrl(path: string): string {
  if (path.startsWith("http")) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_ORIGIN}${p}`;
}

export function buildPageMetadata(input: {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
  ogTitle?: string;
  /** Social/OG description; defaults to `description`. */
  ogDescription?: string;
  ogImageWidth?: number;
  ogImageHeight?: number;
  ogImageAlt?: string;
  noIndex?: boolean;
  keywords?: string[];
}): Metadata {
  const url = absoluteUrl(input.path);
  const image = absoluteUrl(input.ogImage ?? "/og/og-morris-services.png");
  const ogTitle = input.ogTitle ?? input.title;
  const socialDescription = input.ogDescription ?? input.description;
  const imageWidth = input.ogImageWidth ?? 1200;
  const imageHeight = input.ogImageHeight ?? 630;
  const imageAlt = input.ogImageAlt ?? ogTitle;

  return {
    title: { absolute: input.title },
    description: input.description,
    keywords: input.keywords,
    alternates: { canonical: url },
    robots: input.noIndex
      ? { index: false, follow: false, googleBot: { index: false, follow: false } }
      : { index: true, follow: true },
    openGraph: {
      type: "website",
      locale: "en_US",
      url,
      siteName: "Morris Services",
      title: ogTitle,
      description: socialDescription,
      images: [{ url: image, width: imageWidth, height: imageHeight, alt: imageAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: socialDescription,
      images: [image],
    },
  };
}
