import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AuthorityArticleLayout } from "@/components/seo/AuthorityArticleLayout";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { allGuideSlugs, getGuide } from "@/lib/seo/guides";
import { DIVISION_SEO } from "@/lib/seo/site";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return allGuideSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return {};
  return buildPageMetadata({
    title: guide.title,
    description: guide.description,
    path: `/junk-removal/guides/${slug}`,
    ogImage: DIVISION_SEO.junk_removal.ogImage,
    keywords: guide.keywords,
  });
}

export default async function JunkGuidePage({ params }: Props) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  return (
    <AuthorityArticleLayout
      path={`/junk-removal/guides/${slug}`}
      crumbs={[
        { name: "Morris Services", href: "/" },
        { name: "Morris Junk Removal", href: "/junk-removal" },
        { name: "Guides", href: "/junk-removal/guides" },
        { name: guide.h1 },
      ]}
      eyebrow="Morris Junk Removal"
      h1={guide.h1}
      summary={guide.summary}
      sections={guide.sections}
      faqs={guide.faqs}
      relatedServiceSlugs={guide.relatedServices}
      relatedGuideSlugs={guide.relatedGuides}
      relatedItemSlugs={guide.relatedItems}
    />
  );
}
