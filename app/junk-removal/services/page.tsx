import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { StickyMobileConcierge } from "@/components/public/StickyMobileConcierge";
import { MarketingBreadcrumbs } from "@/components/seo/MarketingBreadcrumbs";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { servicesForDivision } from "@/lib/seo/services";
import { DIVISION_SEO } from "@/lib/seo/site";

export const metadata: Metadata = buildPageMetadata({
  title: "Junk Removal Services",
  description:
    "Furniture removal, appliance haul-away, garage and estate cleanouts, and commercial junk removal from Morris Junk Removal.",
  path: "/junk-removal/services",
  ogImage: DIVISION_SEO.junk_removal.ogImage,
});

export default function JunkServicesIndexPage() {
  const services = servicesForDivision("junk_removal");
  return (
    <div className="flex min-h-screen flex-col bg-[#F7F5F2]">
      <PublicHeader variant="company" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 pb-28">
        <MarketingBreadcrumbs
          items={[
            { name: "Morris Services", href: "/" },
            { name: "Morris Junk Removal", href: "/junk-removal" },
            { name: "Services" },
          ]}
        />
        <h1 className="mt-6 font-heading text-4xl font-medium tracking-tight">Junk removal services</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Choose a service for details, photos to upload, and how pricing works — then request an estimate.
        </p>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {services.map((s) => (
            <li key={s.slug}>
              <Link
                href={`/junk-removal/services/${s.slug}`}
                className="block rounded-2xl border border-border bg-white p-5 transition hover:border-brand-primary/30"
              >
                <p className="font-semibold text-foreground">{s.name}</p>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{s.description}</p>
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
