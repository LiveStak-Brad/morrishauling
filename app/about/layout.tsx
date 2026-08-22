import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "About Morris Service Group LLC",
  description:
    "Morris Service Group LLC is a Missouri property and equipment contractor — junk removal, hauling, land clearing, site work, and equipment services.",
  path: "/about",
  ogImage: "/og/og-morris-services.png",
});

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
