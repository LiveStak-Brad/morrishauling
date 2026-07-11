"use client";

import { useState } from "react";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button-link";
import { trackMarketingEvent } from "@/lib/seo/analytics";
import { cn } from "@/lib/utils";

const TIERS = [
  {
    id: "min",
    label: "Small pickup",
    hint: "A few items or loosely filled pickup bed",
    note: "Often a minimum-scope visit — photos still help.",
  },
  {
    id: "quarter",
    label: "About 1/4 trailer",
    hint: "Small room clear-out or several bulky pieces",
    note: "Common for single-room furniture jobs.",
  },
  {
    id: "half",
    label: "About 1/2 trailer",
    hint: "Packed garage corner or multi-room leftovers",
    note: "Volume adds up quickly with sofas and appliances.",
  },
  {
    id: "three_quarter",
    label: "About 3/4 trailer",
    hint: "Most of a garage or large cleanout",
    note: "Expect labor and access to matter as much as volume.",
  },
  {
    id: "full",
    label: "Full trailer / multi-load",
    hint: "Whole-property or estate-scale piles",
    note: "Photo estimate required — may need more than one load.",
  },
] as const;

export function LoadSizeEstimator() {
  const [selected, setSelected] = useState<(typeof TIERS)[number]["id"] | null>(null);
  const active = TIERS.find((t) => t.id === selected);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Pick the closest match. This is an education tool — not a final price. Photos confirm the
        real estimate.
      </p>
      <div className="grid gap-3">
        {TIERS.map((tier) => (
          <button
            key={tier.id}
            type="button"
            onClick={() => setSelected(tier.id)}
            className={cn(
              "rounded-2xl border-2 p-4 text-left transition",
              selected === tier.id
                ? "border-brand-primary bg-brand-primary/5"
                : "border-transparent bg-white shadow-sm hover:border-brand-primary/30"
            )}
          >
            <p className="font-semibold">{tier.label}</p>
            <p className="mt-1 text-sm text-muted-foreground">{tier.hint}</p>
          </button>
        ))}
      </div>
      {active && (
        <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
          <p className="font-semibold">{active.label}</p>
          <p className="mt-2 text-sm text-muted-foreground">{active.note}</p>
          <ButtonLink
            href="/book?division=junk_removal"
            className="mt-4 rounded-xl"
            onClick={() =>
              trackMarketingEvent("estimate_start", {
                division: "junk_removal",
                label: `load_estimator_${active.id}`,
              })
            }
          >
            Request estimate with photos
          </ButtonLink>
          <p className="mt-3 text-xs text-muted-foreground">
            Or read{" "}
            <Link
              href="/junk-removal/guides/how-much-junk-fits-in-a-pickup"
              className="font-semibold text-brand-primary hover:underline"
            >
              how much junk fits in a pickup
            </Link>
            .
          </p>
        </div>
      )}
    </div>
  );
}
