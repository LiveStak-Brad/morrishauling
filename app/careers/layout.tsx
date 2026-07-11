import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Careers at Morris Services",
  description:
    "Join Morris Service Group LLC — careers with Morris Junk Removal and Morris Hauling in Warren County and nearby Missouri communities.",
  path: "/careers",
  ogImage: "/og/og-morris-services.png",
});

export default function CareersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
