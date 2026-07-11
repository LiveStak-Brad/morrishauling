import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { StickyMobileConcierge } from "@/components/public/StickyMobileConcierge";
import { MarketingBreadcrumbs } from "@/components/seo/MarketingBreadcrumbs";
import { ConversionCtaGroup } from "@/components/seo/ConversionCta";
import { CanWeTakeThisTool } from "@/components/tools/CanWeTakeThisTool";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { ACCEPTANCE_LABELS, AUTHORITY_ITEMS } from "@/lib/seo/items";
import { DIVISION_SEO } from "@/lib/seo/site";

export const metadata: Metadata = buildPageMetadata({
  title: "What Can We Take? Item Directory | Morris Junk Removal",
  description:
    "Search junk removal items Morris can usually take — furniture, appliances, mattresses, electronics, and more in Warren County and nearby Missouri.",
  path: "/junk-removal/items",
  ogImage: DIVISION_SEO.junk_removal.ogImage,
  keywords: ["what can junk removal take", "furniture removal", "appliance disposal Missouri"],
});

export default function JunkItemsIndexPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F7F5F2]">
      <PublicHeader variant="company" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 pb-28 sm:py-12">
        <MarketingBreadcrumbs
          items={[
            { name: "Morris Services", href: "/" },
            { name: "Morris Junk Removal", href: "/junk-removal" },
            { name: "Items" },
          ]}
        />
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-brand-primary">
          Morris Junk Removal
        </p>
        <h1 className="mt-2 font-heading text-4xl font-medium tracking-tight sm:text-5xl">
          What Can We Take?
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted-foreground">
          Honest acceptance guidance for common junk removal items. Facility rules and condition
          still matter — when in doubt, send photos with your estimate.
        </p>
        <ConversionCtaGroup divisionId="junk_removal" className="mt-8" />

        <section className="mt-12 rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-8">
          <h2 className="font-heading text-2xl font-medium">Search items</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Type a common item name to jump to acceptance notes.
          </p>
          <div className="mt-6">
            <CanWeTakeThisTool />
          </div>
        </section>

        <section className="mt-14">
          <h2 className="font-heading text-2xl font-medium">Full item directory</h2>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {AUTHORITY_ITEMS.map((item) => (
              <li key={item.slug}>
                <Link
                  href={`/junk-removal/items/${item.slug}`}
                  className="block rounded-2xl border border-black/5 bg-white p-5 shadow-sm transition hover:border-brand-primary/30"
                >
                  <p className="font-semibold text-foreground">{item.name}</p>
                  <p className="mt-1 text-xs font-medium text-brand-primary">
                    {ACCEPTANCE_LABELS[item.acceptance]}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-2">
                    {item.canRemove}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <PublicFooter variant="company" />
      <StickyMobileConcierge divisionId="junk_removal" />
    </div>
  );
}
