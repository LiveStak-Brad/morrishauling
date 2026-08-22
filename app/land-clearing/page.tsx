import type { Metadata } from "next";
import { EquipmentDivisionHub } from "@/components/seo/EquipmentDivisionHub";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { DIVISION_HUB_COPY } from "@/lib/seo/equipment-divisions";
import { DIVISION_SEO } from "@/lib/seo/site";

const copy = DIVISION_HUB_COPY.land_clearing;

export const metadata: Metadata = buildPageMetadata({
  title: copy.title.replace(" | Morris Land Clearing", ""),
  description: copy.description,
  path: "/land-clearing",
  ogImage: DIVISION_SEO.land_clearing.ogImage,
  keywords: ["land clearing", "forestry mulching", "brush clearing", "Warrenton MO"],
});

export default function LandClearingPage() {
  return <EquipmentDivisionHub division="land_clearing" />;
}
