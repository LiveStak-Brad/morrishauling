"use client";

import Link from "next/link";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { StatusChip } from "@/components/morris/StatusChip";
import { ButtonLink } from "@/components/ui/button-link";
import type { RouteStop } from "@/types/hr/employee-portal";
import { Home, MapPin, Trash2, Utensils, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const TYPE_ICON = {
  yard: Home,
  job: MapPin,
  dump: Trash2,
  lunch: Utensils,
  break: Utensils,
};

export function RouteTimeline({ stops }: { stops: RouteStop[] }) {
  if (stops.length <= 1) {
    return (
      <PremiumCard className="p-4 text-center text-sm text-muted-foreground">
        No route stops scheduled for today.
      </PremiumCard>
    );
  }

  return (
    <PremiumCard className="p-4">
      <h3 className="font-semibold mb-4">Today&apos;s Route</h3>
      <ol className="relative space-y-0">
        {stops.map((stop, idx) => {
          const Icon = TYPE_ICON[stop.type] ?? MapPin;
          const isLast = idx === stops.length - 1;
          return (
            <li key={stop.id} className="relative flex gap-3 pb-5">
              {!isLast && (
                <span className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-border" />
              )}
              <div
                className={cn(
                  "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2",
                  stop.status === "completed" && "border-green-500 bg-green-50 text-green-700",
                  stop.status === "active" && "border-brand-primary bg-brand-primary/10 text-brand-primary",
                  stop.status === "pending" && "border-muted bg-muted text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{stop.label}</p>
                    {stop.jobType && (
                      <p className="text-xs text-muted-foreground capitalize">{stop.jobType}</p>
                    )}
                    {stop.address && (
                      <p className="text-xs text-muted-foreground truncate">{stop.address}</p>
                    )}
                    {stop.time && <p className="text-xs font-medium mt-0.5">{stop.time}</p>}
                  </div>
                  <StatusChip
                    label={stop.status}
                    variant={stop.status === "active" ? "success" : stop.status === "completed" ? "neutral" : "warning"}
                    className="text-[10px] capitalize shrink-0"
                  />
                </div>
                {stop.jobId && (
                  <ButtonLink href={`/employee/jobs/${stop.jobId}`} variant="ghost" size="sm" className="mt-1 h-8 px-2 text-xs">
                    Open job <ChevronRight className="h-3 w-3" />
                  </ButtonLink>
                )}
                {stop.loadPercent != null && (
                  <p className="text-[10px] text-muted-foreground mt-1">Est. load: {stop.loadPercent}%</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </PremiumCard>
  );
}
