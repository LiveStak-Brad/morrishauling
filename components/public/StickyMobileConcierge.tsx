"use client";

import Link from "next/link";
import { Phone } from "lucide-react";
import { useCompany } from "@/lib/company-context";
import { useDivisionPublicStatus } from "@/components/public/useDivisionPublicStatus";
import { trackMarketingEvent } from "@/lib/seo/analytics";
import type { DivisionId } from "@/lib/divisions";
import { cn } from "@/lib/utils";

/**
 * Persistent mobile conversion bar: Call + Request Estimate.
 * Respects division launch status from the database.
 */
export function StickyMobileConcierge({
  className,
  divisionId,
}: {
  className?: string;
  /** Prefer this division for the estimate CTA when set */
  divisionId?: DivisionId;
}) {
  const { company } = useCompany();
  const tel = company.phone.replace(/\D/g, "");
  const junk = useDivisionPublicStatus("junk_removal");
  const hauling = useDivisionPublicStatus("hauling");

  const preferred =
    divisionId === "hauling"
      ? hauling.status
      : divisionId === "junk_removal"
        ? junk.status
        : junk.status?.acceptsBookings || junk.status?.acceptsEstimateRequests
          ? junk.status
          : hauling.status?.acceptsBookings || hauling.status?.acceptsEstimateRequests
            ? hauling.status
            : junk.status;

  const canEstimate =
    preferred?.acceptsBookings ||
    preferred?.acceptsEstimateRequests ||
    preferred?.acceptsInterest;
  const estimateHref =
    preferred?.acceptsBookings || preferred?.acceptsEstimateRequests
      ? preferred.bookPath
      : "/contact";
  const estimateLabel =
    preferred?.bookingCtaLabel ??
    (canEstimate ? "Request estimate" : "Contact us");

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-white/95 px-3 py-2.5 backdrop-blur-xl md:hidden",
        "pb-[max(0.65rem,env(safe-area-inset-bottom))]",
        className
      )}
      role="navigation"
      aria-label="Quick actions"
    >
      <div className="mx-auto flex max-w-lg gap-2">
        <a
          href={`tel:${tel}`}
          onClick={() =>
            trackMarketingEvent("phone_cta_click", {
              division: divisionId ?? "parent",
              label: "mobile_bar",
            })
          }
          className="inline-flex h-12 min-h-[48px] min-w-0 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-white text-sm font-semibold text-foreground shadow-sm transition hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
        >
          <Phone className="h-4 w-4 shrink-0" aria-hidden />
          Call
        </a>
        <Link
          href={canEstimate ? estimateHref : "/contact"}
          onClick={() =>
            trackMarketingEvent("estimate_start", {
              division: divisionId ?? preferred?.id ?? "parent",
              label: "mobile_bar",
            })
          }
          className="inline-flex h-12 min-h-[48px] min-w-0 flex-[1.35] items-center justify-center rounded-xl bg-brand-primary px-3 text-sm font-semibold text-white shadow-md transition hover:bg-brand-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
        >
          {estimateLabel}
        </Link>
      </div>
    </div>
  );
}
