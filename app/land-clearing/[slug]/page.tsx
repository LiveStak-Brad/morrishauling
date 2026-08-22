import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EquipmentServiceMarketingPage } from "@/components/seo/EquipmentServiceMarketingPage";
import {
  equipmentServicesForDivision,
  getEquipmentService,
} from "@/lib/seo/equipment-divisions";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { DIVISION_SEO } from "@/lib/seo/site";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return equipmentServicesForDivision("land_clearing").map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = getEquipmentService("land_clearing", slug);
  if (!service) return {};
  return buildPageMetadata({
    title: service.title.replace(" | Morris Service Group", "").replace(" | Morris Land Clearing", ""),
    description: service.description,
    path: `/land-clearing/${slug}`,
    ogImage: DIVISION_SEO.land_clearing.ogImage,
    keywords: service.keywords,
  });
}

export default async function LandClearingServicePage({ params }: Props) {
  const { slug } = await params;
  const service = getEquipmentService("land_clearing", slug);
  if (!service) notFound();
  return <EquipmentServiceMarketingPage service={service} />;
}
