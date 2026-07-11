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
  title: "Hauling Service Areas",
  description:
    "Morris Hauling service areas for equipment transport and material delivery across Warren County and nearby Missouri communities.",
  path: "/hauling/areas",
  ogImage: DIVISION_SEO.hauling.ogImage,
});

export default function HaulingAreasIndexPage() {
  const areas = areasForDivision("hauling");
  const counties = areas.filter((a) => a.kind === "county");
  const cities = areas.filter((a) => a.kind === "city");
  return (
    <div className="flex min-h-screen flex-col bg-[#F7F5F2]">
      <PublicHeader variant="umbrella" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 pb-28">
        <MarketingBreadcrumbs
          items={[
            { name: "Morris Services", href: "/" },
            { name: "Morris Hauling", href: "/hauling" },
            { name: "Service areas" },
          ]}
        />
        <h1 className="mt-6 font-heading text-4xl font-medium tracking-tight">Hauling service areas</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Local equipment and material transport centered on Warren County, with extended-area routes when capacity allows.
        </p>
        <h2 className="mt-10 text-lg font-semibold">Counties</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {counties.map((a) => (
            <li key={a.slug}>
              <Link href={`/hauling/areas/${a.slug}`} className="font-medium text-brand-primary hover:underline">
                Hauling in {a.name}
              </Link>
            </li>
          ))}
        </ul>
        <h2 className="mt-10 text-lg font-semibold">Cities & communities</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {cities.map((a) => (
            <li key={a.slug}>
              <Link href={`/hauling/areas/${a.slug}`} className="text-sm font-medium text-brand-primary hover:underline">
                {a.name}
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <PublicFooter variant="umbrella" />
      <StickyMobileConcierge />
    </div>
  );
}
