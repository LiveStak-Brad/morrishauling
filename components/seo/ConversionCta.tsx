"use client";

import Link from "next/link";
import { Phone } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { SocialFollowStrip } from "@/components/social/SocialFollowStrip";
import { SEO_ORG } from "@/lib/seo/site";
import { trackMarketingEvent } from "@/lib/seo/analytics";
import { useDivisionPublicStatus } from "@/components/public/useDivisionPublicStatus";
import type { DivisionId } from "@/lib/divisions";
import { cn } from "@/lib/utils";

export function ConversionCtaGroup({
  divisionId,
  className,
  estimateHref,
  showSocial = true,
}: {
  divisionId: DivisionId;
  className?: string;
  estimateHref?: string;
  /** Secondary @WarrentonJunk CTA under primary estimate/call actions */
  showSocial?: boolean;
}) {
  const { status } = useDivisionPublicStatus(divisionId);
  const canRequest =
    status?.acceptsBookings || status?.acceptsEstimateRequests || status?.acceptsInterest;
  const href =
    estimateHref ??
    (status?.acceptsBookings || status?.acceptsEstimateRequests
      ? status.bookPath
      : "/contact");
  const label =
    status?.bookingCtaLabel ??
    (divisionId === "hauling" ? "Request hauling estimate" : "Request an estimate");

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {canRequest ? (
          <ButtonLink
            href={href}
            className="h-12 min-h-[48px] rounded-full px-8"
            onClick={() =>
              trackMarketingEvent("estimate_start", {
                division: divisionId,
                label,
              })
            }
          >
            {label}
          </ButtonLink>
        ) : (
          <ButtonLink href="/contact" className="h-12 min-h-[48px] rounded-full px-8">
            Contact us
          </ButtonLink>
        )}
        <a
          href={`tel:${SEO_ORG.phoneTel}`}
          onClick={() =>
            trackMarketingEvent("phone_cta_click", { division: divisionId, label: "call" })
          }
          className="inline-flex h-12 min-h-[48px] items-center justify-center gap-2 rounded-full border border-foreground/15 bg-white px-8 text-sm font-semibold text-foreground hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
        >
          <Phone className="h-4 w-4" aria-hidden />
          Call {SEO_ORG.phone}
        </a>
      </div>
      {showSocial ? <SocialFollowStrip compact /> : null}
    </div>
  );
}

export function RelatedLinks({
  title,
  links,
}: {
  title: string;
  links: Array<{ href: string; label: string }>;
}) {
  return (
    <section className="mt-12">
      <h2 className="font-heading text-2xl font-medium tracking-tight">{title}</h2>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="text-sm font-medium text-brand-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
