import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildPageMetadata({
  title: "Open Positions | Careers at Morris Services",
  description:
    "Browse current openings at Morris Service Group LLC — field, office, and growth roles with Morris Junk Removal and Morris Hauling near Warrenton, Missouri.",
  path: "/careers/jobs",
  ogImage: "/og/og-morris-services.png",
});

export default function CareersJobsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
