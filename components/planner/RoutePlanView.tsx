"use client";

import type { RoutePlan } from "@/types/route";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { StatusChip } from "@/components/morris/StatusChip";
import { Progress } from "@/components/ui/progress";
import { MapPin, Trash2, Flag, Home, Route } from "lucide-react";

const STOP_ICONS = {
  start: Home,
  pickup: MapPin,
  dump: Trash2,
  end: Flag,
};

interface RoutePlanViewProps {
  plan: RoutePlan | null;
}

export function RoutePlanView({ plan }: RoutePlanViewProps) {
  if (!plan) {
    return (
      <PremiumCard className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <Route className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="font-semibold">No route planned yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Assign fleet and tap Optimize route
        </p>
      </PremiumCard>
    );
  }

  return (
    <div className="space-y-4">
      <PremiumCard className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground">Optimized route</p>
            <p className="text-2xl font-bold">{plan.totalDistanceMiles} mi</p>
          </div>
          <StatusChip label={`${plan.stops.length} stops`} variant="info" />
        </div>
      </PremiumCard>

      <div className="space-y-3">
        {plan.stops.map((stop, i) => {
          const Icon = STOP_ICONS[stop.type] ?? MapPin;
          const isDump = stop.type === "dump";

          return (
            <PremiumCard
              key={stop.id}
              className={isDump ? "border-2 border-morris-warning/40 bg-morris-warning/5" : "p-0"}
            >
              <div className="flex gap-4 p-4">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold text-white ${
                      isDump ? "bg-morris-warning" : "bg-brand-primary"
                    }`}
                  >
                    {i + 1}
                  </div>
                  {i < plan.stops.length - 1 && (
                    <div className="my-1 w-0.5 flex-1 min-h-4 bg-border" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold text-sm">{stop.label}</span>
                    {isDump && <StatusChip label="Dump run" variant="warning" />}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {stop.distanceFromPreviousMiles} mi · Trailer {stop.trailerLoadBefore}% → {stop.trailerLoadAfter}%
                  </p>
                  <Progress value={stop.trailerLoadAfter} className="mt-2 h-1.5" />
                  {stop.warnings.map((w, wi) => (
                    <p key={wi} className="mt-2 text-xs text-morris-warning">⚠ {w.message}</p>
                  ))}
                </div>
              </div>
            </PremiumCard>
          );
        })}
      </div>
    </div>
  );
}
