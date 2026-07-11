import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { StickyMobileConcierge } from "@/components/public/StickyMobileConcierge";
import { MarketingBreadcrumbs } from "@/components/seo/MarketingBreadcrumbs";
import { ConversionCtaGroup } from "@/components/seo/ConversionCta";
import { ServiceAreaChecker } from "@/components/tools/ServiceAreaChecker";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { DIVISION_SEO } from "@/lib/seo/site";

export const metadata: Metadata = buildPageMetadata({
  title: "Junk Removal Service Area Checker | Morris Junk Removal",
  description:
    "Check whether your city or county is in Morris Junk Removal coverage across Warren, Lincoln, St. Charles, Franklin, and Jefferson Counties, Missouri.",
  path: "/junk-removal/tools/service-area-checker",
  ogImage: DIVISION_SEO.junk_removal.ogImage,
  keywords: ["junk removal near me", "Warren County junk removal", "service area"],
});

export default function ServiceAreaCheckerPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F7F5F2]">
      <PublicHeader variant="company" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 pb-28 sm:py-12">
        <MarketingBreadcrumbs
          items={[
            { name: "Morris Services", href: "/" },
            { name: "Morris Junk Removal", href: "/junk-removal" },
            { name: "Tools", href: "/junk-removal/tools" },
            { name: "Service area checker" },
          ]}
        />
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-brand-primary">
          Planning tool
        </p>
        <h1 className="mt-2 font-heading text-4xl font-medium tracking-tight sm:text-5xl">
          Service Area Checker
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted-foreground">
          Search listed cities and counties. Nearby addresses outside the exact list are often still
          reviewable — contact us if you do not see a match.
        </p>
        <ConversionCtaGroup divisionId="junk_removal" className="mt-8" />

        <section className="mt-12 rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-8">
          <ServiceAreaChecker />
        </section>

        <p className="mt-8 text-sm text-muted-foreground">
          See the full{" "}
          <Link href="/junk-removal/areas" className="font-semibold text-brand-primary hover:underline">
            junk removal service areas
          </Link>{" "}
          or the parent{" "}
          <Link href="/service-area" className="font-semibold text-brand-primary hover:underline">
            Morris Services coverage page
          </Link>
          .
        </p>
      </main>
      <PublicFooter variant="company" />
      <StickyMobileConcierge divisionId="junk_removal" />
    </div>
  );
}
