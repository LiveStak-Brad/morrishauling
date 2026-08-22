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
  return equipmentServicesForDivision("site_work").map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = getEquipmentService("site_work", slug);
  if (!service) return {};
  return buildPageMetadata({
    title: service.title.replace(" | Morris Site Work", "").replace(" | Morris Service Group", ""),
    description: service.description,
    path: `/site-work/${slug}`,
    ogImage: DIVISION_SEO.site_work.ogImage,
    keywords: service.keywords,
  });
}

export default async function SiteWorkServicePage({ params }: Props) {
  const { slug } = await params;
  const service = getEquipmentService("site_work", slug);
  if (!service) notFound();
  return <EquipmentServiceMarketingPage service={service} />;
}
