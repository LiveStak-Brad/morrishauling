"use client";

import type { ServiceType } from "@/types/hauling";
import { morrisConfig } from "@/lib/morris-config";
import { PremiumCard } from "@/components/morris/PremiumCard";
import { cn } from "@/lib/utils";
import { Check, Trash2, Truck } from "lucide-react";

interface ServiceLinePickerProps {
  onSelect: (line: ServiceType) => void;
}

const ICONS = {
  junk_removal: Trash2,
  hauling_transport: Truck,
} as const;

const GRADIENTS = {
  junk_removal: "from-red-50 to-orange-50",
  hauling_transport: "from-slate-50 to-blue-50",
} as const;

export function ServiceLinePicker({ onSelect }: ServiceLinePickerProps) {
  return (
    <div className="space-y-6 animate-slide-up opacity-0" style={{ animationFillMode: "forwards" }}>
      <div>
        <h2 className="text-2xl font-bold md:text-3xl">What do you need help with today?</h2>
        <p className="mt-2 text-muted-foreground">
          Choose your service — junk removal and hauling use different booking flows and pricing.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {morrisConfig.serviceLines.map((line) => {
          const Icon = ICONS[line.id];
          return (
            <button
              key={line.id}
              type="button"
              onClick={() => onSelect(line.id)}
              className="group text-left"
            >
              <PremiumCard
                interactive
                className={cn(
                  "h-full border-2 border-transparent bg-gradient-to-br p-6 transition-all hover:border-brand-primary/40 hover:shadow-lg",
                  GRADIENTS[line.id]
                )}
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-primary text-white shadow-md transition-transform group-hover:scale-105">
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold">{line.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{line.tagline}</p>
                <ul className="mt-4 space-y-1 text-xs text-muted-foreground">
                  {line.examples.slice(0, 4).map((ex) => (
                    <li key={ex} className="flex items-center gap-1.5">
                      <Check className="h-3 w-3 shrink-0 text-brand-primary" />
                      {ex}
                    </li>
                  ))}
                </ul>
                <p className="mt-5 text-sm font-semibold text-brand-primary group-hover:underline">
                  Start {line.name} booking →
                </p>
              </PremiumCard>
            </button>
          );
        })}
      </div>
    </div>
  );
}
