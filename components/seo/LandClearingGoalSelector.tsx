"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PROPERTY_NEED_CARDS, type PropertyNeedCard } from "@/lib/land-clearing/intents";
import { trackMarketingEvent } from "@/lib/seo/analytics";
import { ButtonLink } from "@/components/ui/button-link";
import { cn } from "@/lib/utils";

export function LandClearingGoalSelector() {
  const [selected, setSelected] = useState<PropertyNeedCard | null>(null);

  return (
    <section id="property-need" className="scroll-mt-24">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-primary">
        Start here
      </p>
      <h2 className="mt-2 font-heading text-3xl font-medium tracking-tight sm:text-4xl">
        What are you trying to accomplish?
      </h2>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Pick the closest description. You can change it when you request an estimate.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {PROPERTY_NEED_CARDS.map((card) => {
          const active = selected?.id === card.id;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => {
                setSelected(card);
                trackMarketingEvent("property_goal_selected", {
                  division: "land_clearing",
                  label: card.goal,
                });
                trackMarketingEvent("service_recommendation_viewed", {
                  division: "land_clearing",
                  label: card.goal,
                });
              }}
              className={cn(
                "min-h-16 rounded-2xl border px-4 py-3.5 text-left text-sm font-semibold leading-snug shadow-sm transition",
                active
                  ? "border-brand-primary bg-brand-primary text-white"
                  : "border-black/5 bg-white hover:border-brand-primary/25"
              )}
            >
              {card.title}
            </button>
          );
        })}
      </div>
      {selected ? (
        <div className="mt-5 rounded-2xl border border-black/5 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-primary">
            Based on your selection
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {selected.recommendation} This is a starting point — not a site assessment or a price.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <ButtonLink href={selected.href} variant="outline" className="h-11 rounded-full">
              Learn more
            </ButtonLink>
            <ButtonLink
              href={selected.estimateHref}
              className="h-11 rounded-full"
              onClick={() =>
                trackMarketingEvent("land_clearing_estimate_started", {
                  division: "land_clearing",
                  label: selected.goal,
                })
              }
            >
              Request an Estimate
              <ArrowRight className="ml-2 h-4 w-4" />
            </ButtonLink>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-sm">
          <Link href="/book?division=land_clearing" className="font-medium text-brand-primary hover:underline">
            Or start a general land-clearing estimate
          </Link>
        </p>
      )}
    </section>
  );
}
