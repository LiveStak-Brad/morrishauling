"use client";

import type { EstimateResult } from "@/lib/estimate-engine";
import type { EstimateWarning } from "@/types/job";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { StatusChip } from "@/components/morris/StatusChip";
import { Truck, Users, Clock } from "lucide-react";

const WARNING_LABELS: Record<EstimateWarning, string> = {
  outside_service_area: "Outside service area",
  price_may_need_adjustment: "May adjust on-site",
  heavy_load: "Heavy load",
  stairs_access: "Stairs / access",
  long_carry: "Long carry",
  special_disposal: "Special disposal",
};

interface LiveEstimateProps {
  estimate: EstimateResult | null;
}

export function LiveEstimate({ estimate }: LiveEstimateProps) {
  if (!estimate) return null;

  return (
    <PremiumCard className="overflow-hidden p-0" glow>
      <div className="morris-gradient-bg px-6 py-5 text-white">
        <p className="text-sm font-medium text-white/70">Your estimate</p>
        <p className="mt-1 text-4xl font-bold tracking-tight">${estimate.total}</p>
        <p className="mt-1 text-sm text-white/60">Final price confirmed on-site</p>
      </div>

      <div className="grid grid-cols-3 divide-x border-b">
        {[
          { icon: Truck, label: "Truck", value: `${estimate.trailerPercent}%` },
          { icon: Users, label: "Crew", value: "2" },
          { icon: Clock, label: "Time", value: "~2hr" },
        ].map((item) => (
          <div key={item.label} className="flex flex-col items-center gap-1 py-4">
            <item.icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{item.label}</span>
            <span className="text-sm font-bold">{item.value}</span>
          </div>
        ))}
      </div>

      <div className="space-y-2 p-5">
        <div className="flex justify-between text-sm">
          <span>Base load</span>
          <span>${estimate.subtotal}</span>
        </div>
        {estimate.modifiers.map((m) => (
          <div key={m.id} className="flex justify-between text-sm text-muted-foreground">
            <span>{m.label}</span>
            <span>{m.amount >= 0 ? "+" : ""}${m.amount}</span>
          </div>
        ))}
      </div>

      {estimate.warnings.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t px-5 py-4">
          {estimate.warnings.map((w) => (
            <StatusChip
              key={w}
              label={WARNING_LABELS[w]}
              variant={w === "outside_service_area" ? "urgent" : "warning"}
            />
          ))}
        </div>
      )}
    </PremiumCard>
  );
}
