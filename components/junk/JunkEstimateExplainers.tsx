"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function TransportationDetailsCollapsible({
  amount,
  breakdownSteps,
  originCity,
  className,
}: {
  amount: number;
  breakdownSteps: string[];
  originCity?: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-xl border bg-muted/30 p-3", className)}>
      <div className="flex justify-between text-sm">
        <span className="font-medium">Travel & Transportation</span>
        <span className="font-semibold">${amount}</span>
      </div>
      <p className="mt-2 text-xs font-medium text-muted-foreground">Your estimate includes:</p>
      <ul className="mt-1.5 space-y-1.5">
        {breakdownSteps.map((step) => (
          <li key={step} className="flex items-start gap-2 text-xs text-muted-foreground">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" />
            <span>{step}</span>
          </li>
        ))}
      </ul>
      {originCity && (
        <p className="mt-2 text-[11px] text-muted-foreground/80">
          Routed from our {originCity} operating area.
        </p>
      )}
    </div>
  );
}

export function PriceFactorsCard({
  factors,
  title = "Why this estimate may be higher",
  showDetails = false,
}: {
  factors: { id: string; label: string; detail?: string }[];
  title?: string;
  showDetails?: boolean;
}) {
  if (factors.length === 0) return null;

  return (
    <div className="rounded-xl border border-amber-200/80 bg-amber-50/60 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
      <p className="text-sm font-semibold text-amber-950 dark:text-amber-100">{title}</p>
      <ul className="mt-2 space-y-1.5">
        {factors.map((f) => (
          <li key={f.id} className="flex items-start gap-2 text-sm text-amber-900/90 dark:text-amber-100/90">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-600" />
            <span>
              {f.label}
              {showDetails && f.detail && (
                <span className="block text-xs text-muted-foreground">{f.detail}</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PreliminaryEstimateConfidenceNote() {
  return (
    <p className="mt-3 rounded-lg bg-background/60 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
      Most preliminary estimates are confirmed with little or no change after our team reviews your
      details. We&apos;ll reach out if anything needs adjustment before work is scheduled.
    </p>
  );
}
