import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DemolitionMarketingPage } from "@/components/seo/DemolitionMarketingPage";
import { allDemolitionSlugs, getDemolitionService } from "@/lib/seo/demolition";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { DIVISION_SEO } from "@/lib/seo/site";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return allDemolitionSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = getDemolitionService(slug);
  if (!service) return {};
  return buildPageMetadata({
    title: service.title,
    description: service.description,
    path: `/junk-removal/demolition/${slug}`,
    ogImage: DIVISION_SEO.junk_removal.ogImage,
    keywords: service.keywords,
  });
}

export default async function DemolitionServicePage({ params }: Props) {
  const { slug } = await params;
  const service = getDemolitionService(slug);
  if (!service) notFound();
  return <DemolitionMarketingPage service={service} />;
}
