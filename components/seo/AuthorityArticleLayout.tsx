import Link from "next/link";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { StickyMobileConcierge } from "@/components/public/StickyMobileConcierge";
import { MarketingBreadcrumbs } from "@/components/seo/MarketingBreadcrumbs";
import { FaqAccordion } from "@/components/seo/FaqAccordion";
import { ConversionCtaGroup, RelatedLinks } from "@/components/seo/ConversionCta";
import { FacebookFollow } from "@/components/seo/FacebookFollow";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumbSchema, faqSchema, webPageSchema } from "@/lib/seo/schema";
import { getService } from "@/lib/seo/services";
import { getGuide } from "@/lib/seo/guides";
import { getItem } from "@/lib/seo/items";
import { AuthenticTrustSlots } from "@/components/seo/AuthenticTrustSlots";
import { VideoEmbedSlot } from "@/components/seo/VideoEmbedSlot";

type Crumb = { name: string; href?: string };

export function AuthorityArticleLayout({
  path,
  crumbs,
  eyebrow,
  h1,
  summary,
  sections,
  faqs,
  relatedServiceSlugs = [],
  relatedGuideSlugs = [],
  relatedItemSlugs = [],
  extraRelated,
  children,
}: {
  path: string;
  crumbs: Crumb[];
  eyebrow: string;
  h1: string;
  summary: string;
  sections: Array<{ heading: string; body: string[] | string }>;
  faqs: Array<{ q: string; a: string }>;
  relatedServiceSlugs?: string[];
  relatedGuideSlugs?: string[];
  relatedItemSlugs?: string[];
  extraRelated?: Array<{ href: string; label: string }>;
  children?: React.ReactNode;
}) {
  const serviceLinks = relatedServiceSlugs
    .map((slug) => getService("junk_removal", slug))
    .filter(Boolean)
    .map((s) => ({
      href: `/junk-removal/services/${s!.slug}`,
      label: s!.name,
    }));
  const guideLinks = relatedGuideSlugs
    .map((slug) => getGuide(slug))
    .filter(Boolean)
    .map((g) => ({
      href: `/junk-removal/guides/${g!.slug}`,
      label: g!.h1,
    }));
  const itemLinks = relatedItemSlugs
    .map((slug) => getItem(slug))
    .filter(Boolean)
    .map((i) => ({
      href: `/junk-removal/items/${i!.slug}`,
      label: i!.name,
    }));

  const related = [
    ...serviceLinks,
    ...guideLinks,
    ...itemLinks,
    ...(extraRelated ?? []),
    { href: "/junk-removal/responsible-disposal", label: "Responsible disposal" },
    { href: "/pricing", label: "Pricing explained" },
    { href: "/junk-removal/areas", label: "Service areas" },
    { href: "/contact", label: "Contact" },
  ].filter((l, i, arr) => arr.findIndex((x) => x.href === l.href) === i);

  return (
    <div className="flex min-h-screen flex-col bg-[#F7F5F2]">
      <JsonLd
        data={[
          webPageSchema({ name: h1, description: summary, path }),
          breadcrumbSchema(crumbs.map((c) => ({ name: c.name, path: c.href ?? path }))),
          faqSchema(faqs),
        ]}
      />
      <PublicHeader variant="company" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 pb-28 sm:py-12">
        <MarketingBreadcrumbs items={crumbs} />
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-brand-primary">
          {eyebrow}
        </p>
        <h1 className="mt-2 font-heading text-4xl font-medium tracking-tight sm:text-5xl">{h1}</h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted-foreground">{summary}</p>
        <ConversionCtaGroup divisionId="junk_removal" className="mt-8" />

        {sections.map((section) => (
          <section key={section.heading} className="mt-12">
            <h2 className="font-heading text-2xl font-medium">{section.heading}</h2>
            {Array.isArray(section.body) ? (
              <ul className="mt-4 max-w-3xl space-y-2 text-sm leading-relaxed text-muted-foreground">
                {section.body.map((line) => (
                  <li key={line}>• {line}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                {section.body}
              </p>
            )}
          </section>
        ))}

        {children}

        <AuthenticTrustSlots />
        <VideoEmbedSlot className="mt-10" />

        {faqs.length > 0 && (
          <section className="mt-14">
            <h2 className="font-heading text-2xl font-medium">Frequently asked questions</h2>
            <FaqAccordion items={faqs} className="mt-4" />
          </section>
        )}

        <RelatedLinks title="Related resources" links={related.slice(0, 10)} />

        <p className="mt-10 text-sm text-muted-foreground">
          Looking for something else? Browse the{" "}
          <Link href="/junk-removal/resources" className="font-semibold text-brand-primary hover:underline">
            Junk Removal Resource Center
          </Link>
          .
        </p>

        <div className="mt-14">
          <FacebookFollow />
        </div>
      </main>
      <PublicFooter variant="company" />
      <StickyMobileConcierge divisionId="junk_removal" />
    </div>
  );
}
