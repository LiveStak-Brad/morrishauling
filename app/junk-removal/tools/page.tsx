import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { StickyMobileConcierge } from "@/components/public/StickyMobileConcierge";
import { MarketingBreadcrumbs } from "@/components/seo/MarketingBreadcrumbs";
import { ConversionCtaGroup } from "@/components/seo/ConversionCta";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { DIVISION_SEO } from "@/lib/seo/site";

export const metadata: Metadata = buildPageMetadata({
  title: "Junk Removal Tools | Morris Junk Removal",
  description:
    "Free junk removal planning tools — load-size estimator, can-we-take-this search, and service-area checker for Warren County and nearby Missouri.",
  path: "/junk-removal/tools",
  ogImage: DIVISION_SEO.junk_removal.ogImage,
  keywords: ["junk removal load size", "can junk removal take", "junk removal service area"],
});

const TOOLS = [
  {
    href: "/junk-removal/tools/load-size-estimator",
    label: "Load size estimator",
    body: "Map your pile to a rough trailer-volume tier before you request an estimate.",
  },
  {
    href: "/junk-removal/tools/can-we-take-this",
    label: "Can we take this?",
    body: "Search common items for honest acceptance, recycling, and donation notes.",
  },
  {
    href: "/junk-removal/tools/service-area-checker",
    label: "Service area checker",
    body: "See if your city or county is in our listed junk removal coverage.",
  },
] as const;

export default function JunkToolsHubPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F7F5F2]">
      <PublicHeader variant="company" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 pb-28 sm:py-12">
        <MarketingBreadcrumbs
          items={[
            { name: "Morris Services", href: "/" },
            { name: "Morris Junk Removal", href: "/junk-removal" },
            { name: "Tools" },
          ]}
        />
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-brand-primary">
          Morris Junk Removal
        </p>
        <h1 className="mt-2 font-heading text-4xl font-medium tracking-tight sm:text-5xl">
          Junk Removal Tools
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted-foreground">
          Quick planning helpers. They do not replace a photo estimate — they help you ask better
          questions before you book.
        </p>
        <ConversionCtaGroup divisionId="junk_removal" className="mt-8" />

        <ul className="mt-12 grid gap-4 sm:grid-cols-1 md:grid-cols-3">
          {TOOLS.map((tool) => (
            <li key={tool.href}>
              <Link
                href={tool.href}
                className="block h-full rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition hover:border-brand-primary/30 sm:p-6"
              >
                <p className="font-heading text-xl font-medium text-foreground">{tool.label}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{tool.body}</p>
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-10 text-sm text-muted-foreground">
          Back to the{" "}
          <Link href="/junk-removal/resources" className="font-semibold text-brand-primary hover:underline">
            Resource Center
          </Link>
          .
        </p>
      </main>
      <PublicFooter variant="company" />
      <StickyMobileConcierge divisionId="junk_removal" />
    </div>
  );
}
