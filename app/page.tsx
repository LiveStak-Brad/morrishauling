import type { Metadata } from "next";
import { MorrisServicesHomePage } from "@/components/public/MorrisServicesHomePage";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { organizationSchema, websiteSchema } from "@/lib/seo/schema";

export const metadata: Metadata = buildPageMetadata({
  title: "Morris Service Group LLC | Professional Missouri Home Services",
  description:
    "Morris Services — the parent brand for Morris Junk Removal and Morris Hauling. Professional local home services across Warren County and nearby Missouri communities.",
  path: "/",
  ogImage: "/og/og-morris-services.png",
  ogTitle: "Morris Service Group LLC | Morris Services",
  keywords: [
    "Morris Service Group LLC",
    "Morris Services",
    "home services Warren County Missouri",
    "professional local service company",
  ],
});

export default function HomePage() {
  return (
    <>
      <JsonLd data={[organizationSchema(), websiteSchema()]} />
      <MorrisServicesHomePage />
    </>
  );
}
