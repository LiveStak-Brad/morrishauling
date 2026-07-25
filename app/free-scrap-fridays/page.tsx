import type { Metadata } from "next";
import Link from "next/link";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";
import { StickyMobileConcierge } from "@/components/public/StickyMobileConcierge";
import { ScrapFridayWizard } from "@/components/scrap-fridays/ScrapFridayWizard";
import { RelatedAuthorityLinks } from "@/components/authority/RelatedAuthorityLinks";
import { SocialFollowStrip } from "@/components/social/SocialFollowStrip";
import { FaqAccordion } from "@/components/seo/FaqAccordion";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, faqSchema, webPageSchema } from "@/lib/seo/schema";
import {
  DETACHMENT_PAID_NOTE,
  DETACHMENT_RULE,
  NOT_ACCEPTED_ITEMS,
} from "@/lib/scrap-fridays/types";
import { WARRENTON_JUNK_SOCIAL } from "@/lib/social/config";

export const metadata: Metadata = buildPageMetadata({
  title: "Free Scrap Fridays | Free Scrap Pickup in Warrenton, MO",
  description:
    "Schedule free pickup of qualifying scrap metal in the Warrenton and Warren County area. No curbside placement required. Morris Service Group handles the lifting and removal.",
  path: "/free-scrap-fridays",
  ogTitle: "Free Scrap Fridays | Morris Service Group LLC",
  ogDescription:
    "Schedule free pickup of qualifying scrap metal in the Warrenton and Warren County area. No curbside placement required.",
  ogImage: "/fsf.png",
  ogImageWidth: 1536,
  ogImageHeight: 1024,
  ogImageAlt:
    "Free Scrap Fridays by Morris Service Group LLC in Warrenton and Warren County, Missouri",
  keywords: [
    "Free Scrap Fridays",
    "free scrap metal pickup Warrenton",
    "scrap metal Warren County MO",
    "WarrentonJunk",
  ],
});

const FAQS = [
  {
    q: "Is scrap pickup really free?",
    a: "Yes — Free Scrap Fridays removes qualifying, approved scrap metal at no charge. Availability depends on photos, approval, and Friday route capacity.",
  },
  {
    q: "Do I have to move items to the curb?",
    a: "No. Schedule a Friday pickup for a time you’ll be home, show our crew what needs to go, and we’ll handle the lifting and removal from the approved location.",
  },
  {
    q: "Do I have to be home?",
    a: "Yes, or arrange approved access in advance. Someone must guide the crew to the approved items.",
  },
  {
    q: "What types of metal do you accept?",
    a: "Common appliances, automotive metal parts, yard/outdoor metal, household metal, and construction scrap. See the item selector in the request form for the current list.",
  },
  {
    q: "Do you accept refrigerators and freezers?",
    a: "Yes, when empty and detached. Our local recycling partner accepts them as dirty metal by weight.",
  },
  {
    q: "Do you accept automotive batteries?",
    a: "Intact lead-acid automotive, lawn-equipment, and marine batteries may be accepted after condition confirmation. Damaged, leaking, swollen, or unidentified packs are not accepted.",
  },
  {
    q: "Do you accept safes?",
    a: "Safes require photo review. Bolted or attached safes are not free. Extremely heavy, locked, or hard-to-access safes may be waitlisted or quoted as paid removal.",
  },
  {
    q: "Will you disconnect or dismantle items?",
    a: DETACHMENT_RULE + " " + DETACHMENT_PAID_NOTE,
  },
  {
    q: "What items are not accepted?",
    a: NOT_ACCEPTED_ITEMS.join("; ") + ".",
  },
  {
    q: "Can you remove non-metal junk too?",
    a: "Yes — request a free junk-removal estimate in the same flow. Free scrap and paid junk removal are kept separate.",
  },
  {
    q: "How is my pickup time determined?",
    a: "After approval we build an efficient Friday route and send a narrower arrival window by text/email. Flexible availability helps us serve more households.",
  },
  {
    q: "What happens after I submit photos?",
    a: "Morris Service Group reviews eligibility, weight/access, and capacity. You’ll see statuses like under review, approved, waitlisted, scheduled, or more information needed.",
  },
  {
    q: "What if the Friday route is full?",
    a: "You may be waitlisted or offered a future Friday. We’ll notify you either way.",
  },
  {
    q: "Can neighbors schedule on the same route?",
    a: "Yes — nearby stops help us fill efficient Fridays. Neighbors can submit their own photo requests.",
  },
];

export default function FreeScrapFridaysPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F7F5F2]">
      <JsonLd
        data={[
          webPageSchema({
            name: "Free Scrap Fridays",
            description:
              "Free qualifying scrap metal pickup on Fridays in Warrenton and Warren County, Missouri.",
            path: "/free-scrap-fridays",
          }),
          breadcrumbSchema([
            { name: "Morris Services", path: "/" },
            { name: "Free Scrap Fridays", path: "/free-scrap-fridays" },
          ]),
          faqSchema(FAQS),
        ]}
      />
      <PublicHeader variant="umbrella" />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 pb-28 sm:py-12">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-primary">
          Morris Service Group LLC · {WARRENTON_JUNK_SOCIAL.handle}
        </p>
        <h1 className="mt-3 font-heading text-4xl font-medium tracking-tight sm:text-5xl md:text-6xl">
          Free Scrap Fridays
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted-foreground">
          We remove qualifying scrap metal from your property at no charge. No curbside placement
          required — schedule a Friday pickup for a time you’ll be home, show our crew what needs to
          go, and we’ll handle the lifting and removal.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a
            href="#request"
            className="inline-flex h-12 min-h-[48px] items-center justify-center rounded-full bg-brand-primary px-8 text-sm font-semibold text-white shadow-md hover:bg-brand-primary/90"
          >
            Check My Address &amp; Request Pickup
          </a>
          <Link
            href="/book?division=junk_removal"
            className="inline-flex h-12 min-h-[48px] items-center justify-center rounded-full border border-black/10 bg-white px-8 text-sm font-semibold hover:bg-muted/40"
          >
            Request a junk-removal estimate
          </Link>
        </div>

        <section className="mt-14 grid gap-4 sm:grid-cols-3">
          {[
            {
              t: "No curb required",
              d: "Be home (or arrange access), guide the crew, and we remove approved items from where they sit.",
            },
            {
              t: "Photos + approval",
              d: "Requests are reviewed before Friday routing. Capacity is limited by weight, labor, and geography.",
            },
            {
              t: "Scrap only is free",
              d: "Approved metal is free. Non-metal junk can be quoted separately while we’re already on site.",
            },
          ].map((card) => (
            <div key={card.t} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              <h2 className="font-semibold tracking-tight">{card.t}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{card.d}</p>
            </div>
          ))}
        </section>

        <section className="mt-14">
          <h2 className="font-heading text-2xl font-medium">How it works</h2>
          <ol className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li>1. Check your address and select scrap items.</li>
            <li>2. Answer item questions, upload photos, and confirm access.</li>
            <li>3. Share Friday availability (flexible helps the whole route).</li>
            <li>4. We review and approve — then place you on a Friday route.</li>
            <li>5. You get an arrival window; be ready to show approved items.</li>
          </ol>
        </section>

        <section className="mt-14 rounded-2xl border border-amber-500/25 bg-amber-50 p-5 sm:p-6">
          <h2 className="font-heading text-xl font-medium text-amber-950">Detachment requirement</h2>
          <p className="mt-2 text-sm leading-relaxed text-amber-950/90">{DETACHMENT_RULE}</p>
          <p className="mt-2 text-sm font-medium text-amber-950">{DETACHMENT_PAID_NOTE}</p>
        </section>

        <section className="mt-14">
          <h2 className="font-heading text-2xl font-medium">Common accepted items</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Appliances, automotive metal, yard/outdoor metal, household metal, and construction
            scrap — each with quantity, weight bands, and item-specific questions in the request
            form.
          </p>
        </section>

        <section className="mt-14">
          <h2 className="font-heading text-2xl font-medium">Not accepted</h2>
          <ul className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            {NOT_ACCEPTED_ITEMS.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </section>

        <section id="request" className="mt-16 scroll-mt-24">
          <h2 className="font-heading text-3xl font-medium tracking-tight">
            Check my address &amp; request pickup
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Primary coverage starts around Warrenton and Warren County. Active Friday zones may be
            narrower than our general junk-removal area.
          </p>
          <div className="mt-6">
            <ScrapFridayWizard />
          </div>
        </section>

        <section className="mt-16">
          <h2 className="font-heading text-2xl font-medium">FAQ</h2>
          <FaqAccordion items={FAQS} className="mt-4" />
        </section>

        <SocialFollowStrip className="mt-14" compact />
        <RelatedAuthorityLinks
          excludePath="/free-scrap-fridays"
          prefer={[
            { href: "/junk-removal", label: "Junk removal" },
            { href: "/junk-removal/responsible-disposal", label: "Responsible disposal" },
            { href: "/pricing", label: "Pricing" },
          ]}
        />
      </main>
      <PublicFooter />
      <StickyMobileConcierge divisionId="junk_removal" />
    </div>
  );
}
