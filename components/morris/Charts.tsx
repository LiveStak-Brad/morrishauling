"use client";

import type { DataPoint } from "@/types/operations-command-center";
import { cn } from "@/lib/utils";
import { PremiumCard } from "./PremiumCard";

interface MiniBarChartProps {
  data: DataPoint[];
  title?: string;
  className?: string;
}

export function MiniBarChart({ data, title, className }: MiniBarChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const max = Math.max(...data.map((d) => d.value), 0);

  if (!data.length || total === 0 || max === 0) {
    return (
      <PremiumCard className={cn("p-5", className)}>
        {title && (
          <p className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {title}
          </p>
        )}
        <div className="flex h-32 items-center justify-center">
          <p className="text-sm text-muted-foreground">No activity yet</p>
        </div>
      </PremiumCard>
    );
  }

  return (
    <PremiumCard className={cn("p-5", className)}>
      {title && (
        <p className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </p>
      )}
      <div className="flex h-32 items-end justify-between gap-2">
        {data.map((point, i) => (
          <div key={point.label} className="flex flex-1 flex-col items-center gap-2">
            <div className="relative w-full flex-1 flex items-end">
              <div
                className="w-full rounded-t-lg bg-gradient-to-t from-brand-primary to-brand-primary/60 transition-all duration-500 animate-slide-up"
                style={{
                  height: `${(point.value / max) * 100}%`,
                  animationDelay: `${i * 0.05}s`,
                }}
              />
            </div>
            <span className="text-[10px] font-medium text-muted-foreground">
              {point.label}
            </span>
          </div>
        ))}
      </div>
    </PremiumCard>
  );
}

interface DonutStatProps {
  value: number;
  max?: number;
  label: string;
  suffix?: string;
}

export function DonutStat({ value, max = 100, label, suffix = "%" }: DonutStatProps) {
  const pct = Math.min(100, (value / max) * 100);
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-24 w-24">
        <svg className="h-24 w-24 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="36" fill="none" stroke="#F3F4F6" strokeWidth="6" />
          <circle
            cx="40"
            cy="40"
            r="36"
            fill="none"
            stroke="url(#donut-gradient)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000"
          />
          <defs>
            <linearGradient id="donut-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#9B1B30" />
              <stop offset="100%" stopColor="#C8102E" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold">
            {value}
            {suffix}
          </span>
        </div>
      </div>
      <p className="mt-2 text-center text-xs font-medium text-muted-foreground">{label}</p>
    </div>
  );
}
