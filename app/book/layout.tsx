import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Request an Estimate",
  description:
    "Request a Morris Junk Removal or Morris Hauling estimate online. Upload photos, choose a window, and get a clear next step.",
  path: "/book",
  ogImage: "/og/og-morris-services.png",
});

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return children;
}
