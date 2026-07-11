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
  title: "Seasonal Junk Removal | Morris Junk Removal",
  description:
    "Seasonal junk removal guidance for spring cleaning, summer projects, fall yard debris, holidays, moving, storms, and estate season in Warren County and nearby Missouri.",
  path: "/junk-removal/seasonal",
  ogImage: DIVISION_SEO.junk_removal.ogImage,
  keywords: [
    "spring cleaning junk removal",
    "storm debris removal",
    "estate cleanout",
    "moving junk removal Missouri",
  ],
});

const SEASONS = [
  {
    title: "Spring",
    body: "Garage corners, winter leftovers, and yard debris after thaw. Photos of the full pile beat item lists alone.",
    links: [
      { href: "/junk-removal/guides/spring-cleaning-guide", label: "Spring cleaning guide" },
      { href: "/junk-removal/guides/garage-cleanout-checklist", label: "Garage cleanout checklist" },
    ],
  },
  {
    title: "Summer",
    body: "Sheds, hot tubs, patio furniture, and renovation leftovers while weather cooperates for outdoor staging.",
    links: [
      { href: "/junk-removal/guides/prepare-for-junk-removal", label: "Prepare for junk removal" },
      { href: "/junk-removal/topics/cleanouts", label: "Property cleanouts topic" },
    ],
  },
  {
    title: "Fall",
    body: "Yard debris, seasonal furniture, and pre-winter garage space — tell us if brush is mixed with household junk.",
    links: [
      { href: "/junk-removal/guides/what-can-we-remove", label: "What can we remove?" },
      { href: "/junk-removal/items/yard-debris", label: "Yard debris item notes" },
    ],
  },
  {
    title: "Holiday",
    body: "Post-holiday packaging, old décor, and furniture swaps. Bundle items into one visit when you can.",
    links: [
      { href: "/junk-removal/guides/how-junk-removal-pricing-works", label: "How pricing works" },
      { href: "/junk-removal/tools/load-size-estimator", label: "Load size estimator" },
    ],
  },
  {
    title: "Moving",
    body: "Leftovers after the truck leaves — furniture, appliances, and “maybe later” piles that never made the cut.",
    links: [
      { href: "/junk-removal/guides/moving-cleanup-checklist", label: "Moving cleanup checklist" },
      { href: "/junk-removal/guides/photo-estimate-tips", label: "Photo estimate tips" },
    ],
  },
  {
    title: "Storm",
    body: "Storm-related debris varies by material and safety. Share photos and note hazards before we schedule.",
    links: [
      { href: "/junk-removal/guides/what-we-cannot-take", label: "What we cannot take" },
      { href: "/contact", label: "Contact for storm debris review" },
    ],
  },
  {
    title: "Estate season",
    body: "Family cleanouts mix keepers, donation candidates, and disposal. Condition-based donation is never guaranteed.",
    links: [
      { href: "/junk-removal/guides/estate-cleanout-checklist", label: "Estate cleanout checklist" },
      { href: "/junk-removal/guides/donation-vs-disposal", label: "Donation vs disposal" },
      { href: "/junk-removal/services/estate-cleanouts", label: "Estate cleanouts service" },
    ],
  },
] as const;

export default function SeasonalJunkRemovalPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F7F5F2]">
      <PublicHeader variant="company" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 pb-28 sm:py-12">
        <MarketingBreadcrumbs
          items={[
            { name: "Morris Services", href: "/" },
            { name: "Morris Junk Removal", href: "/junk-removal" },
            { name: "Seasonal" },
          ]}
        />
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-brand-primary">
          Morris Junk Removal
        </p>
        <h1 className="mt-2 font-heading text-4xl font-medium tracking-tight sm:text-5xl">
          Seasonal Junk Removal
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted-foreground">
          Different seasons create different piles. Use these starting points, then request a photo
          estimate when you are ready.
        </p>
        <ConversionCtaGroup divisionId="junk_removal" className="mt-8" />

        <div className="mt-14 space-y-10">
          {SEASONS.map((season) => (
            <section
              key={season.title}
              className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:p-6"
            >
              <h2 className="font-heading text-2xl font-medium">{season.title}</h2>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                {season.body}
              </p>
              <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
                {season.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm font-medium text-brand-primary hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <RelatedLinks
          title="More resources"
          links={[
            { href: "/junk-removal/guides", label: "All guides" },
            { href: "/junk-removal/topics", label: "Topic hubs" },
            { href: "/junk-removal/resources", label: "Resource Center" },
            { href: "/junk-removal/responsible-disposal", label: "Responsible disposal" },
          ]}
        />
      </main>
      <PublicFooter variant="company" />
      <StickyMobileConcierge divisionId="junk_removal" />
    </div>
  );
}
