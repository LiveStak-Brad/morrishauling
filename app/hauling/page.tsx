import type { Metadata } from "next";
import { HaulingHomePage } from "@/components/public/HaulingComingSoonPage";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { DIVISION_SEO } from "@/lib/seo/site";

export const metadata: Metadata = buildPageMetadata({
  title: "Equipment Hauling in Warren County, MO | Morris Hauling",
  description: DIVISION_SEO.hauling.description,
  path: "/hauling",
  ogImage: DIVISION_SEO.hauling.ogImage,
  ogTitle: "Morris Hauling | Equipment & material transport",
  keywords: [
    "equipment hauling",
    "machinery transport",
    "material delivery",
    "local hauling service",
    "Warren County MO",
  ],
});

export default function HaulingPage() {
  return <HaulingHomePage />;
}
