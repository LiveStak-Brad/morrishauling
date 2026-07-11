import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Junk Removal Services Overview",
  description:
    "Browse Morris Junk Removal services — furniture, appliances, cleanouts, and more — or jump to detailed service pages and request an estimate.",
  path: "/services",
  ogImage: "/og/og-junk-removal.png",
});

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
