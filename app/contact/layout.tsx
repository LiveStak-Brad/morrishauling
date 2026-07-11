import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { SEO_ORG } from "@/lib/seo/site";

export const metadata: Metadata = buildPageMetadata({
  title: "Contact Morris Services",
  description: `Call ${SEO_ORG.phone} or request an estimate online for Morris Junk Removal and Morris Hauling across Warren County and nearby Missouri communities.`,
  path: "/contact",
  ogImage: "/og/og-morris-services.png",
});

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
