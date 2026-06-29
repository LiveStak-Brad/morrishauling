"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface TimelineStep {
  id: string;
  label: string;
  description?: string;
  status: "completed" | "current" | "upcoming";
  time?: string;
}

interface TimelineProps {
  steps: TimelineStep[];
  className?: string;
}

export function Timeline({ steps, className }: TimelineProps) {
  return (
    <div className={cn("space-y-0", className)}>
      {steps.map((step, i) => (
        <div key={step.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                step.status === "completed" &&
                  "border-morris-success bg-morris-success text-white",
                step.status === "current" &&
                  "border-brand-primary bg-brand-primary text-white pulse-live",
                step.status === "upcoming" &&
                  "border-gray-200 bg-white text-gray-400"
              )}
            >
              {step.status === "completed" ? (
                <Check className="h-4 w-4" />
              ) : (
                <span className="text-xs font-bold">{i + 1}</span>
              )}
            </div>
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "my-1 w-0.5 flex-1 min-h-[2rem]",
                  step.status === "completed" ? "bg-morris-success" : "bg-gray-200"
                )}
              />
            )}
          </div>
          <div className="pb-6 pt-1">
            <p
              className={cn(
                "font-semibold",
                step.status === "upcoming" && "text-muted-foreground"
              )}
            >
              {step.label}
            </p>
            {step.description && (
              <p className="mt-0.5 text-sm text-muted-foreground">{step.description}</p>
            )}
            {step.time && (
              <p className="mt-1 text-xs font-medium text-brand-primary">{step.time}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
