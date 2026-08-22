import type { Metadata } from "next";
import { EquipmentDivisionHub } from "@/components/seo/EquipmentDivisionHub";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { DIVISION_HUB_COPY } from "@/lib/seo/equipment-divisions";
import { DIVISION_SEO } from "@/lib/seo/site";

const copy = DIVISION_HUB_COPY.site_work;

export const metadata: Metadata = buildPageMetadata({
  title: copy.title.replace(" | Morris Site Work", ""),
  description: copy.description,
  path: "/site-work",
  ogImage: DIVISION_SEO.site_work.ogImage,
  keywords: ["rough grading", "site preparation", "gravel spreading", "driveway grading"],
});

export default function SiteWorkPage() {
  return <EquipmentDivisionHub division="site_work" />;
}
