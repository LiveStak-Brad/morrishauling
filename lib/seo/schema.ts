import { SEO_ORG, DIVISION_SEO, SITE_ORIGIN, type SeoDivisionId } from "@/lib/seo/site";
import { WARRENTON_JUNK_SOCIAL, socialSameAsUrls } from "@/lib/social/config";

export function jsonLdScript(data: Record<string, unknown> | Array<Record<string, unknown>>) {
  return {
    __html: JSON.stringify(data).replace(/</g, "\\u003c"),
  };
}

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_ORIGIN}/#organization`,
    name: SEO_ORG.legalName,
    alternateName: [
      SEO_ORG.brandName,
      WARRENTON_JUNK_SOCIAL.brandShort,
      WARRENTON_JUNK_SOCIAL.displayName,
    ],
    url: SITE_ORIGIN,
    logo: SEO_ORG.logo,
    telephone: SEO_ORG.phone,
    email: SEO_ORG.email,
    sameAs: socialSameAsUrls(),
    areaServed: SEO_ORG.primaryCounties.map((name) => ({
      "@type": "AdministrativeArea",
      name,
    })),
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_ORIGIN}/#website`,
    url: SITE_ORIGIN,
    name: SEO_ORG.brandName,
    publisher: { "@id": `${SITE_ORIGIN}/#organization` },
  };
}

export function localBusinessSchema(division: SeoDivisionId) {
  const d = DIVISION_SEO[division];
  const isJunk = division === "junk_removal";
  return {
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    "@id": `${SITE_ORIGIN}${d.path}#business`,
    name: isJunk ? WARRENTON_JUNK_SOCIAL.brandShort : d.name,
    alternateName: isJunk
      ? [d.name, WARRENTON_JUNK_SOCIAL.displayName, WARRENTON_JUNK_SOCIAL.handle]
      : [d.name],
    image: d.logo,
    url: `${SITE_ORIGIN}${d.path}`,
    telephone: SEO_ORG.phone,
    parentOrganization: { "@id": `${SITE_ORIGIN}/#organization` },
    // Service-area business: intentionally omit PostalAddress and streetAddress.
    areaServed: [
      { "@type": "City", name: "Warrenton", containedInPlace: { "@type": "State", name: "Missouri" } },
      ...SEO_ORG.primaryCounties.map((name) => ({
        "@type": "AdministrativeArea",
        name,
      })),
    ],
    description: d.description,
    sameAs: isJunk ? socialSameAsUrls() : undefined,
  };
}

export function breadcrumbSchema(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_ORIGIN}${item.path}`,
    })),
  };
}

export function serviceSchema(input: {
  name: string;
  description: string;
  path: string;
  division: SeoDivisionId;
}) {
  const d = DIVISION_SEO[input.division];
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: input.name,
    description: input.description,
    url: `${SITE_ORIGIN}${input.path}`,
    provider: { "@id": `${SITE_ORIGIN}${d.path}#business` },
    areaServed: SEO_ORG.primaryCounties.map((name) => ({
      "@type": "AdministrativeArea",
      name,
    })),
  };
}

export function faqSchema(faqs: Array<{ q: string; a: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function webPageSchema(input: { name: string; description: string; path: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: input.name,
    description: input.description,
    url: `${SITE_ORIGIN}${input.path}`,
    isPartOf: { "@id": `${SITE_ORIGIN}/#website` },
  };
}
