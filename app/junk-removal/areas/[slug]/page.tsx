import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AreaMarketingPage } from "@/components/seo/AreaMarketingPage";
import { areasForDivision, getServiceArea } from "@/lib/seo/locations";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { DIVISION_SEO } from "@/lib/seo/site";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return areasForDivision("junk_removal").map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const area = getServiceArea(slug);
  if (!area || !area.divisions.includes("junk_removal")) return {};
  return buildPageMetadata({
    title: `Junk Removal in ${area.name}, MO`,
    description: area.junkBlurb,
    path: `/junk-removal/areas/${slug}`,
    ogImage: DIVISION_SEO.junk_removal.ogImage,
    keywords: [`junk removal ${area.name}`, "Morris Junk Removal", area.county, "Missouri"],
  });
}

export default async function JunkAreaPage({ params }: Props) {
  const { slug } = await params;
  const area = getServiceArea(slug);
  if (!area || !area.divisions.includes("junk_removal")) notFound();
  return <AreaMarketingPage area={area} division="junk_removal" />;
}
