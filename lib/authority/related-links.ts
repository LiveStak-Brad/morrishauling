import { areasForDivision } from "@/lib/seo/locations";
import { servicesForDivision } from "@/lib/seo/services";

export type RelatedLink = { href: string; label: string };

const AUTHORITY_HUBS: RelatedLink[] = [
  { href: "/junk-removal/latest", label: "Latest junk removal jobs" },
  { href: "/junk-removal/videos", label: "Watch real job videos" },
  { href: "/junk-removal/gallery", label: "Before & after gallery" },
  { href: "/junk-removal/community", label: "Community involvement" },
  { href: "/junk-removal/resources", label: "Resource center" },
  { href: "/pricing", label: "How pricing works" },
  { href: "/junk-removal/guides", label: "Junk removal guides" },
  { href: "/junk-removal/services", label: "All junk removal services" },
  { href: "/junk-removal/areas", label: "Service areas" },
  { href: "/book?division=junk_removal", label: "Request an estimate" },
];

/**
 * Build 3–6 relevant internal links for a page context.
 * Always includes a mix of conversion + authority hubs when possible.
 */
export function buildRelatedAuthorityLinks(input?: {
  serviceSlug?: string;
  areaSlug?: string;
  excludePath?: string;
  prefer?: RelatedLink[];
  limit?: number;
}): RelatedLink[] {
  const limit = input?.limit ?? 6;
  const links: RelatedLink[] = [];
  const seen = new Set<string>();

  const push = (link?: RelatedLink | null) => {
    if (!link?.href || seen.has(link.href)) return;
    if (input?.excludePath && link.href.split("?")[0] === input.excludePath) return;
    seen.add(link.href);
    links.push(link);
  };

  for (const p of input?.prefer ?? []) push(p);

  if (input?.serviceSlug) {
    const svc = servicesForDivision("junk_removal").find((s) => s.slug === input.serviceSlug);
    if (svc) push({ href: `/junk-removal/services/${svc.slug}`, label: svc.name });
  }
  if (input?.areaSlug) {
    const area = areasForDivision("junk_removal").find((a) => a.slug === input.areaSlug);
    if (area) push({ href: `/junk-removal/areas/${area.slug}`, label: `Junk removal in ${area.name}` });
  }

  // Nearby services / areas for topical relevance
  for (const s of servicesForDivision("junk_removal").slice(0, 3)) {
    push({ href: `/junk-removal/services/${s.slug}`, label: s.name });
  }
  for (const a of areasForDivision("junk_removal").slice(0, 2)) {
    push({ href: `/junk-removal/areas/${a.slug}`, label: `${a.name} junk removal` });
  }

  for (const hub of AUTHORITY_HUBS) push(hub);

  return links.slice(0, limit);
}

export function authorityHubNavLinks(): RelatedLink[] {
  return [
    { href: "/junk-removal/latest", label: "Latest jobs" },
    { href: "/junk-removal/videos", label: "Videos" },
    { href: "/junk-removal/gallery", label: "Gallery" },
    { href: "/junk-removal/community", label: "Community" },
  ];
}
