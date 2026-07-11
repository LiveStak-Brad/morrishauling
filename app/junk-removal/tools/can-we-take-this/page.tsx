import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { StickyMobileConcierge } from "@/components/public/StickyMobileConcierge";
import { MarketingBreadcrumbs } from "@/components/seo/MarketingBreadcrumbs";
import { ConversionCtaGroup } from "@/components/seo/ConversionCta";
import { CanWeTakeThisTool } from "@/components/tools/CanWeTakeThisTool";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { DIVISION_SEO } from "@/lib/seo/site";

export const metadata: Metadata = buildPageMetadata({
  title: "Can We Take This? | Morris Junk Removal",
  description:
    "Search whether Morris Junk Removal can usually take mattresses, appliances, furniture, electronics, and more in Warren County and nearby Missouri.",
  path: "/junk-removal/tools/can-we-take-this",
  ogImage: DIVISION_SEO.junk_removal.ogImage,
  keywords: ["can junk removal take", "what junk can be removed", "appliance disposal"],
});

export default function CanWeTakeThisPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F7F5F2]">
      <PublicHeader variant="company" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 pb-28 sm:py-12">
        <MarketingBreadcrumbs
          items={[
            { name: "Morris Services", href: "/" },
            { name: "Morris Junk Removal", href: "/junk-removal" },
            { name: "Tools", href: "/junk-removal/tools" },
            { name: "Can we take this?" },
          ]}
        />
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-brand-primary">
          Planning tool
        </p>
        <h1 className="mt-2 font-heading text-4xl font-medium tracking-tight sm:text-5xl">
          Can We Take This?
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted-foreground">
          Search common items for acceptance, special handling, recycling, and donation notes.
          Facility rules and condition still apply.
        </p>
        <ConversionCtaGroup divisionId="junk_removal" className="mt-8" />

        <section className="mt-12 rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-8">
          <CanWeTakeThisTool />
        </section>

        <p className="mt-8 text-sm text-muted-foreground">
          Browse the full{" "}
          <Link href="/junk-removal/items" className="font-semibold text-brand-primary hover:underline">
            item directory
          </Link>{" "}
          or read{" "}
          <Link
            href="/junk-removal/guides/what-can-we-remove"
            className="font-semibold text-brand-primary hover:underline"
          >
            what we can remove
          </Link>
          .
        </p>
      </main>
      <PublicFooter variant="company" />
      <StickyMobileConcierge divisionId="junk_removal" />
    </div>
  );
}
