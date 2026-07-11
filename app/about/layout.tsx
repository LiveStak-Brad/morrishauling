import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "About Morris Service Group LLC",
  description:
    "Morris Service Group LLC builds professional local home services — starting with Morris Junk Removal and Morris Hauling across Warren County and nearby Missouri communities.",
  path: "/about",
  ogImage: "/og/og-morris-services.png",
});

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
