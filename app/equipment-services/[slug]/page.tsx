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
  return equipmentServicesForDivision("equipment_services").map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = getEquipmentService("equipment_services", slug);
  if (!service) return {};
  return buildPageMetadata({
    title: service.title.replace(" | Morris Equipment Services", "").replace(" | Morris Service Group", ""),
    description: service.description,
    path: `/equipment-services/${slug}`,
    ogImage: DIVISION_SEO.equipment_services.ogImage,
    keywords: service.keywords,
  });
}

export default async function EquipmentServicePage({ params }: Props) {
  const { slug } = await params;
  const service = getEquipmentService("equipment_services", slug);
  if (!service) notFound();
  return <EquipmentServiceMarketingPage service={service} />;
}
