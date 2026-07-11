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

export function ServiceLinePicker({ onSelect }: ServiceLinePickerProps) {
  return (
    <div className="space-y-6 animate-slide-up opacity-0" style={{ animationFillMode: "forwards" }}>
      <div>
        <h2 className="font-heading text-3xl font-medium tracking-tight md:text-4xl">
          What do you need help with?
        </h2>
        <p className="mt-2 text-muted-foreground">
          Junk removal and hauling use different flows and pricing — pick the one that fits.
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
                  "h-full border border-black/5 bg-white p-6 transition-all hover:border-brand-primary/30 hover:shadow-lg"
                )}
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-primary text-white shadow-md transition-transform group-hover:scale-105">
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-semibold tracking-tight">{line.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{line.tagline}</p>
                <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                  {line.examples.slice(0, 4).map((ex) => (
                    <li key={ex} className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 shrink-0 text-brand-primary" />
                      {ex}
                    </li>
                  ))}
                </ul>
                <p className="mt-5 text-sm font-semibold text-brand-primary group-hover:underline">
                  Continue with {line.name} →
                </p>
              </PremiumCard>
            </button>
          );
        })}
      </div>
    </div>
  );
}
