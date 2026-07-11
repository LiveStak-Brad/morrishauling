import type { Metadata } from "next";
import { HaulingHomePage } from "@/components/public/HaulingComingSoonPage";

export const metadata: Metadata = {
  title: "Morris Hauling",
  description:
    "Morris Hauling — equipment, materials, and scheduled transport for Warren, Lincoln & St. Charles Counties, MO. Book online.",
  openGraph: {
    title: "Morris Hauling | Morris Services",
    description:
      "Equipment, materials, and scheduled transport under Morris Services. Book online today.",
    images: [
      {
        url: "/haulinglogo.png",
        width: 1139,
        height: 754,
        alt: "Morris Hauling",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Morris Hauling | Morris Services",
    images: ["/haulinglogo.png"],
  },
};

export default function HaulingPage() {
  return <HaulingHomePage />;
}
