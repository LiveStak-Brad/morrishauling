import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { StickyMobileConcierge } from "@/components/public/StickyMobileConcierge";
import { MarketingBreadcrumbs } from "@/components/seo/MarketingBreadcrumbs";
import { ConversionCtaGroup, RelatedLinks } from "@/components/seo/ConversionCta";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { DIVISION_SEO } from "@/lib/seo/site";

export const metadata: Metadata = buildPageMetadata({
  title: "Commercial Junk Removal | Morris Junk Removal",
  description:
    "Junk removal for property managers, landlords, realtors, HOAs, contractors, offices, retail, storage, and apartments in Warren County and nearby Missouri.",
  path: "/junk-removal/commercial",
  ogImage: DIVISION_SEO.junk_removal.ogImage,
  keywords: [
    "commercial junk removal",
    "property manager cleanout",
    "landlord junk removal",
    "office cleanout Missouri",
  ],
});

const AUDIENCES = [
  {
    title: "Property managers",
    body: "Turnovers, abandoned items, and common-area clearouts with clear access windows and site contacts.",
  },
  {
    title: "Landlords",
    body: "Unit turnovers and leftover tenant junk — photo estimates help keep schedules predictable.",
  },
  {
    title: "Realtors",
    body: "Pre-listing cleanouts and staging leftovers so showings look ready without a dumpster on the driveway.",
  },
  {
    title: "HOAs",
    body: "Common-area debris, amenity cleanups, and resident-related piles when access and rules are clear.",
  },
  {
    title: "Contractors",
    body: "Same-day haul-away for renovation debris when a multi-day dumpster is not the right fit.",
  },
  {
    title: "Offices",
    body: "Furniture, electronics, and floor refreshes — tell us about elevators, docks, and after-hours needs.",
  },
  {
    title: "Retail",
    body: "Fixture and inventory leftovers from remodels or closures, scoped with photos and access notes.",
  },
  {
    title: "Storage facilities",
    body: "Unit cleanouts and abandoned contents when facility rules and access are confirmed.",
  },
  {
    title: "Apartments",
    body: "Move-out piles, appliance swaps, and unit turnovers for multifamily properties.",
  },
] as const;

export default function CommercialJunkRemovalPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F7F5F2]">
      <PublicHeader variant="company" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 pb-28 sm:py-12">
        <MarketingBreadcrumbs
          items={[
            { name: "Morris Services", href: "/" },
            { name: "Morris Junk Removal", href: "/junk-removal" },
            { name: "Commercial" },
          ]}
        />
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-brand-primary">
          Morris Junk Removal
        </p>
        <h1 className="mt-2 font-heading text-4xl font-medium tracking-tight sm:text-5xl">
          Commercial & Property Professional Cleanouts
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted-foreground">
          Commercial work needs clear access, a scoped inventory, and honest handling notes. We
          support turnovers, offices, light renovation debris, and property-pro cleanouts across our
          Missouri service area.
        </p>
        <ConversionCtaGroup divisionId="junk_removal" className="mt-8" />

        <section className="mt-14">
          <h2 className="font-heading text-2xl font-medium">Who we help</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {AUDIENCES.map((audience) => (
              <li
                key={audience.title}
                className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm"
              >
                <h3 className="font-semibold text-foreground">{audience.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{audience.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-14 rounded-2xl border border-black/5 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="font-heading text-2xl font-medium">What to send with your request</h2>
          <ul className="mt-4 max-w-3xl space-y-2 text-sm leading-relaxed text-muted-foreground">
            <li>• Photos of each area and specialty items</li>
            <li>• Access instructions, gate codes, elevators, and loading docks</li>
            <li>• What must stay vs. what goes</li>
            <li>• Preferred windows, after-hours needs, and COI requests if required</li>
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/book?division=junk_removal"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-brand-primary px-5 text-sm font-semibold text-white hover:bg-brand-primary/90"
            >
              Request a commercial estimate
            </Link>
            <Link
              href="/contact"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-white px-5 text-sm font-semibold text-foreground hover:bg-muted/40"
            >
              Contact us
            </Link>
          </div>
        </section>

        <RelatedLinks
          title="Guides & topics for property pros"
          links={[
            {
              href: "/junk-removal/topics/commercial-property",
              label: "Commercial & property topic hub",
            },
            {
              href: "/junk-removal/guides/commercial-cleanout-planning",
              label: "Commercial cleanout planning",
            },
            {
              href: "/junk-removal/guides/landlord-turnover-checklist",
              label: "Landlord turnover checklist",
            },
            {
              href: "/junk-removal/guides/preparing-house-for-sale",
              label: "Preparing a house for sale",
            },
            {
              href: "/junk-removal/guides/moving-cleanup-checklist",
              label: "Moving cleanup checklist",
            },
            {
              href: "/junk-removal/services/commercial-cleanouts",
              label: "Commercial cleanouts service",
            },
            { href: "/junk-removal/resources", label: "Resource Center" },
          ]}
        />
      </main>
      <PublicFooter variant="company" />
      <StickyMobileConcierge divisionId="junk_removal" />
    </div>
  );
}
