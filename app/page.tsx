import type { Metadata } from "next";
import { MorrisServicesHomePage } from "@/components/public/MorrisServicesHomePage";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { organizationSchema, websiteSchema } from "@/lib/seo/schema";

export const metadata: Metadata = buildPageMetadata({
  title: "Morris Service Group | Junk Removal, Hauling, Land Clearing & Site Work",
  description:
    "Morris Service Group LLC — junk removal, hauling, land clearing, site work, and equipment services across Warren, Lincoln, St. Charles, Franklin, and Jefferson Counties in Missouri.",
  path: "/",
  ogImage: "/og/og-morris-services.png",
  ogTitle: "Morris Service Group | Property & Equipment Services",
  keywords: [
    "Morris Service Group LLC",
    "Morris Services",
    "junk removal Warren County",
    "land clearing Missouri",
    "skid steer services near me",
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
