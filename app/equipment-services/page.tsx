import type { Metadata } from "next";
import { EquipmentDivisionHub } from "@/components/seo/EquipmentDivisionHub";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { DIVISION_HUB_COPY } from "@/lib/seo/equipment-divisions";
import { DIVISION_SEO } from "@/lib/seo/site";

const copy = DIVISION_HUB_COPY.equipment_services;

export const metadata: Metadata = buildPageMetadata({
  title: copy.title.replace(" | Morris Equipment Services", ""),
  description: copy.description,
  path: "/equipment-services",
  ogImage: DIVISION_SEO.equipment_services.ogImage,
  keywords: ["skid steer services", "Bobcat services", "grapple services", "Warrenton MO"],
});

export default function EquipmentServicesPage() {
  return <EquipmentDivisionHub division="equipment_services" />;
}
