"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DivisionLaunchStatus } from "@/lib/divisions";
import type { CompanyLaunchStatus } from "@/lib/morris-services-config";

const DIVISION_LABELS: Record<DivisionLaunchStatus, string> = {
  setup: "Coming soon",
  internal_testing: "Internal testing",
  accepting_interest: "Accepting interest",
  accepting_estimate_requests: "Accepting estimates",
  accepting_bookings: "Now booking",
  temporarily_paused: "Temporarily paused",
};

const DIVISION_STYLES: Record<DivisionLaunchStatus, string> = {
  setup: "border-border bg-muted/60 text-muted-foreground",
  internal_testing: "border-amber-500/30 bg-amber-500/10 text-amber-800",
  accepting_interest: "border-brand-primary/20 bg-brand-primary/5 text-brand-primary",
  accepting_estimate_requests: "border-brand-primary/25 bg-brand-primary/5 text-brand-primary",
  accepting_bookings: "border-brand-primary/25 bg-brand-primary/5 text-brand-primary",
  temporarily_paused: "border-border bg-muted/60 text-muted-foreground",
};

const LEGACY_LABELS: Record<CompanyLaunchStatus, string> = {
  open: "Now booking",
  launching_soon: "Launching soon",
  coming_soon: "Coming soon",
  future_expansion: "Future craft",
};

const LEGACY_STYLES: Record<CompanyLaunchStatus, string> = {
  open: "border-brand-primary/25 bg-brand-primary/5 text-brand-primary",
  launching_soon: "border-brand-primary/25 bg-brand-primary/5 text-brand-primary",
  coming_soon: "border-border bg-muted/60 text-muted-foreground",
  future_expansion: "border-border bg-transparent text-muted-foreground",
};

export function CompanyStatusBadge({
  status,
  divisionStatus,
  label,
  className,
}: {
  status?: CompanyLaunchStatus;
  divisionStatus?: DivisionLaunchStatus;
  label?: string;
  className?: string;
}) {
  if (divisionStatus) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "rounded-full px-3 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em]",
          DIVISION_STYLES[divisionStatus],
          className
        )}
      >
        {label ?? DIVISION_LABELS[divisionStatus]}
      </Badge>
    );
  }

  const legacy = status ?? "coming_soon";
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full px-3 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em]",
        LEGACY_STYLES[legacy],
        className
      )}
    >
      {label ?? LEGACY_LABELS[legacy]}
    </Badge>
  );
}
