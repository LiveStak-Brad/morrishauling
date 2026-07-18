"use client";

import { RelatedLinks } from "@/components/seo/ConversionCta";
import { buildRelatedAuthorityLinks, type RelatedLink } from "@/lib/authority/related-links";

/** 3–6 contextual internal links for authority / SEO pages. */
export function RelatedAuthorityLinks({
  title = "Keep exploring",
  serviceSlug,
  areaSlug,
  excludePath,
  prefer,
  limit = 6,
}: {
  title?: string;
  serviceSlug?: string;
  areaSlug?: string;
  excludePath?: string;
  prefer?: RelatedLink[];
  limit?: number;
}) {
  const links = buildRelatedAuthorityLinks({
    serviceSlug,
    areaSlug,
    excludePath,
    prefer,
    limit,
  });
  if (links.length === 0) return null;
  return <RelatedLinks title={title} links={links} />;
}
