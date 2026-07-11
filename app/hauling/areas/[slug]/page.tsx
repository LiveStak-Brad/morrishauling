import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AreaMarketingPage } from "@/components/seo/AreaMarketingPage";
import { areasForDivision, getServiceArea } from "@/lib/seo/locations";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { DIVISION_SEO } from "@/lib/seo/site";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return areasForDivision("hauling").map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const area = getServiceArea(slug);
  if (!area || !area.divisions.includes("hauling")) return {};
  return buildPageMetadata({
    title: `Equipment Hauling in ${area.name}, MO`,
    description: area.haulingBlurb,
    path: `/hauling/areas/${slug}`,
    ogImage: DIVISION_SEO.hauling.ogImage,
    keywords: [`hauling ${area.name}`, "Morris Hauling", area.county, "Missouri"],
  });
}

export default async function HaulingAreaPage({ params }: Props) {
  const { slug } = await params;
  const area = getServiceArea(slug);
  if (!area || !area.divisions.includes("hauling")) notFound();
  return <AreaMarketingPage area={area} division="hauling" />;
}
