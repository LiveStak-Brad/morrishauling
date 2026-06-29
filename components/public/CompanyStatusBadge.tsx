import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CompanyLaunchStatus } from "@/lib/morris-services-config";

const LABELS: Record<CompanyLaunchStatus, string> = {
  launching_soon: "Launching Soon",
  coming_soon: "Coming Soon",
  future_expansion: "Future Expansion",
};

const STYLES: Record<CompanyLaunchStatus, string> = {
  launching_soon: "border-amber-300 bg-amber-50 text-amber-900",
  coming_soon: "border-slate-200 bg-slate-50 text-slate-600",
  future_expansion: "border-slate-200 bg-slate-50 text-slate-500",
};

export function CompanyStatusBadge({
  status,
  className,
}: {
  status: CompanyLaunchStatus;
  className?: string;
}) {
  return (
    <Badge variant="outline" className={cn("font-semibold", STYLES[status], className)}>
      {LABELS[status]}
    </Badge>
  );
}
