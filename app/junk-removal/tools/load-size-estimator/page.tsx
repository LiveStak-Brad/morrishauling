import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { StickyMobileConcierge } from "@/components/public/StickyMobileConcierge";
import { MarketingBreadcrumbs } from "@/components/seo/MarketingBreadcrumbs";
import { ConversionCtaGroup } from "@/components/seo/ConversionCta";
import { LoadSizeEstimator } from "@/components/tools/LoadSizeEstimator";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { DIVISION_SEO } from "@/lib/seo/site";

export const metadata: Metadata = buildPageMetadata({
  title: "Junk Removal Load Size Estimator | Morris Junk Removal",
  description:
    "Estimate junk removal load size by trailer volume tier — then confirm with photos for Warren County and nearby Missouri jobs.",
  path: "/junk-removal/tools/load-size-estimator",
  ogImage: DIVISION_SEO.junk_removal.ogImage,
  keywords: ["junk removal load size", "how much junk", "trailer load estimator"],
});

export default function LoadSizeEstimatorPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F7F5F2]">
      <PublicHeader variant="company" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 pb-28 sm:py-12">
        <MarketingBreadcrumbs
          items={[
            { name: "Morris Services", href: "/" },
            { name: "Morris Junk Removal", href: "/junk-removal" },
            { name: "Tools", href: "/junk-removal/tools" },
            { name: "Load size estimator" },
          ]}
        />
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-brand-primary">
          Planning tool
        </p>
        <h1 className="mt-2 font-heading text-4xl font-medium tracking-tight sm:text-5xl">
          Load Size Estimator
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted-foreground">
          Pick the volume tier that best matches your pile. Photos still drive the real estimate —
          this is a starting point, not a quote.
        </p>
        <ConversionCtaGroup divisionId="junk_removal" className="mt-8" />

        <section className="mt-12 rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-8">
          <LoadSizeEstimator />
        </section>

        <p className="mt-8 text-sm text-muted-foreground">
          Related:{" "}
          <Link
            href="/junk-removal/guides/how-much-junk-fits-in-a-pickup"
            className="font-semibold text-brand-primary hover:underline"
          >
            How much junk fits in a pickup?
          </Link>{" "}
          ·{" "}
          <Link
            href="/junk-removal/guides/how-junk-removal-pricing-works"
            className="font-semibold text-brand-primary hover:underline"
          >
            How pricing works
          </Link>
        </p>
      </main>
      <PublicFooter variant="company" />
      <StickyMobileConcierge divisionId="junk_removal" />
    </div>
  );
}
