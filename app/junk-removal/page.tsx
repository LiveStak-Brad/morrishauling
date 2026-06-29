import type { Metadata } from "next";
import { HaulingHomePage } from "@/components/public/HaulingHomePage";

export const metadata: Metadata = {
  title: "Morris Hauling & Junk Removal | Morris Services",
  description:
    "Morris Hauling & Junk Removal is launching soon — preparing professional junk removal for Warren, Lincoln, St. Charles, and surrounding Missouri counties.",
};

export default function JunkRemovalPage() {
  return <HaulingHomePage />;
}
