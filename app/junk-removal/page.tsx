import type { Metadata } from "next";
import { JunkRemovalHomePage } from "@/components/public/JunkRemovalHomePage";

export const metadata: Metadata = {
  title: "Morris Junk Removal",
  description:
    "Professional junk removal and property cleanouts for Warren, Lincoln & St. Charles Counties, MO. Book online today.",
  openGraph: {
    title: "Morris Junk Removal | Morris Services",
    description:
      "Professional junk removal and property cleanouts for Warren, Lincoln & St. Charles Counties, MO. Book online.",
    images: [
      {
        url: "/logo.png",
        width: 1146,
        height: 758,
        alt: "Morris Junk Removal",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Morris Junk Removal | Morris Services",
    images: ["/logo.png"],
  },
};

export default function JunkRemovalPage() {
  return <JunkRemovalHomePage />;
}
