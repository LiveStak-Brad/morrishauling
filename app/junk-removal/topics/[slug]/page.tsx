import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AuthorityArticleLayout } from "@/components/seo/AuthorityArticleLayout";
import { RelatedLinks } from "@/components/seo/ConversionCta";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { getService } from "@/lib/seo/services";
import { getGuide } from "@/lib/seo/guides";
import { getItem } from "@/lib/seo/items";
import { allTopicSlugs, getTopic } from "@/lib/seo/topics";
import { DIVISION_SEO } from "@/lib/seo/site";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return allTopicSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const topic = getTopic(slug);
  if (!topic) return {};
  return buildPageMetadata({
    title: topic.title,
    description: topic.description,
    path: `/junk-removal/topics/${slug}`,
    ogImage: DIVISION_SEO.junk_removal.ogImage,
    keywords: topic.keywords,
  });
}

export default async function JunkTopicPage({ params }: Props) {
  const { slug } = await params;
  const topic = getTopic(slug);
  if (!topic) notFound();

  const serviceLinks = topic.services
    .map((s) => getService("junk_removal", s))
    .filter(Boolean)
    .map((s) => ({
      href: `/junk-removal/services/${s!.slug}`,
      label: s!.name,
    }));

  const itemLinks = topic.items
    .map((s) => getItem(s))
    .filter(Boolean)
    .map((i) => ({
      href: `/junk-removal/items/${i!.slug}`,
      label: i!.name,
    }));

  const guideLinks = topic.guides
    .map((s) => getGuide(s))
    .filter(Boolean)
    .map((g) => ({
      href: `/junk-removal/guides/${g!.slug}`,
      label: g!.h1,
    }));

  return (
    <AuthorityArticleLayout
      path={`/junk-removal/topics/${slug}`}
      crumbs={[
        { name: "Morris Services", href: "/" },
        { name: "Morris Junk Removal", href: "/junk-removal" },
        { name: "Topics", href: "/junk-removal/topics" },
        { name: topic.name },
      ]}
      eyebrow="Topic cluster"
      h1={topic.h1}
      summary={topic.summary}
      sections={topic.sections}
      faqs={topic.faqs}
      relatedServiceSlugs={topic.services}
      relatedGuideSlugs={topic.guides}
      relatedItemSlugs={topic.items}
    >
      {serviceLinks.length > 0 && (
        <RelatedLinks title="Related services" links={serviceLinks} />
      )}
      {itemLinks.length > 0 && <RelatedLinks title="Related items" links={itemLinks} />}
      {guideLinks.length > 0 && <RelatedLinks title="Related guides" links={guideLinks} />}
    </AuthorityArticleLayout>
  );
}
