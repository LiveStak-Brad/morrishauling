import type { Metadata } from "next";
import { JunkRemovalHomePage } from "@/components/public/JunkRemovalHomePage";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { DIVISION_SEO } from "@/lib/seo/site";

export const metadata: Metadata = buildPageMetadata({
  title: "Junk Removal in Warren County, MO | Morris Junk Removal",
  description: DIVISION_SEO.junk_removal.description,
  path: "/junk-removal",
  ogImage: DIVISION_SEO.junk_removal.ogImage,
  ogTitle: "Morris Junk Removal | Clear the space. Keep the peace.",
  keywords: [
    "junk removal",
    "furniture removal",
    "garage cleanouts",
    "estate cleanouts",
    "Warren County MO",
  ],
});

export default function JunkRemovalPage() {
  return <JunkRemovalHomePage />;
}
