import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Junk Removal Pricing Explained",
  description:
    "How Morris Junk Removal estimates work — volume, access, and disposal. Online amounts are estimates; scope changes require your approval.",
  path: "/pricing",
  ogImage: "/og/og-junk-removal.png",
});

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
