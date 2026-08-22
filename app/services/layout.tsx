import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Services | Junk Removal, Hauling, Land Clearing & Site Work",
  description:
    "Everything Morris Service Group currently offers: junk removal, free scrap pickup, hauling, land clearing, site work, and equipment services.",
  path: "/services",
  ogImage: "/og/og-morris-services.png",
});

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
