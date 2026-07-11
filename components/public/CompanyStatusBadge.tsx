import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CompanyLaunchStatus } from "@/lib/morris-services-config";

const LABELS: Record<CompanyLaunchStatus, string> = {
  open: "Now booking",
  launching_soon: "Now booking",
  coming_soon: "Coming soon",
  future_expansion: "Future craft",
};

const STYLES: Record<CompanyLaunchStatus, string> = {
  open: "border-brand-primary/25 bg-brand-primary/5 text-brand-primary",
  launching_soon: "border-brand-primary/25 bg-brand-primary/5 text-brand-primary",
  coming_soon: "border-border bg-muted/60 text-muted-foreground",
  future_expansion: "border-border bg-transparent text-muted-foreground",
};

export function CompanyStatusBadge({
  status,
  className,
}: {
  status: CompanyLaunchStatus;
  className?: string;
}) {
  // Don't show badges for future crafts that aren't open — callers may still pass coming_soon
  if (status === "future_expansion") {
    return (
      <Badge
        variant="outline"
        className={cn(
          "rounded-full px-3 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em]",
          STYLES[status],
          className
        )}
      >
        {LABELS[status]}
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full px-3 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em]",
        STYLES[status],
        className
      )}
    >
      {LABELS[status]}
    </Badge>
  );
}
