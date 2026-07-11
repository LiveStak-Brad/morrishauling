import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { StickyMobileConcierge } from "@/components/public/StickyMobileConcierge";
import { MarketingBreadcrumbs } from "@/components/seo/MarketingBreadcrumbs";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { areasForDivision } from "@/lib/seo/locations";
import { DIVISION_SEO } from "@/lib/seo/site";

export const metadata: Metadata = buildPageMetadata({
  title: "Junk Removal Service Areas",
  description:
    "Morris Junk Removal service areas across Warren, Lincoln, St. Charles, Franklin, and Jefferson Counties in Missouri.",
  path: "/junk-removal/areas",
  ogImage: DIVISION_SEO.junk_removal.ogImage,
});

export default function JunkAreasIndexPage() {
  const areas = areasForDivision("junk_removal");
  const counties = areas.filter((a) => a.kind === "county");
  const cities = areas.filter((a) => a.kind === "city");
  return (
    <div className="flex min-h-screen flex-col bg-[#F7F5F2]">
      <PublicHeader variant="company" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 pb-28">
        <MarketingBreadcrumbs
          items={[
            { name: "Morris Services", href: "/" },
            { name: "Morris Junk Removal", href: "/junk-removal" },
            { name: "Service areas" },
          ]}
        />
        <h1 className="mt-6 font-heading text-4xl font-medium tracking-tight">Junk removal service areas</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Primary coverage in Warren, Lincoln, and St. Charles Counties, with extended-area service nearby.
          Travel expectations are disclosed before you book.
        </p>
        <h2 className="mt-10 text-lg font-semibold">Counties</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {counties.map((a) => (
            <li key={a.slug}>
              <Link href={`/junk-removal/areas/${a.slug}`} className="font-medium text-brand-primary hover:underline">
                Junk Removal in {a.name}
              </Link>
            </li>
          ))}
        </ul>
        <h2 className="mt-10 text-lg font-semibold">Cities & communities</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {cities.map((a) => (
            <li key={a.slug}>
              <Link href={`/junk-removal/areas/${a.slug}`} className="text-sm font-medium text-brand-primary hover:underline">
                {a.name}
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <PublicFooter variant="company" />
      <StickyMobileConcierge />
    </div>
  );
}
